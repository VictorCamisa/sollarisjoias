import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-oauth-callback`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: "Google OAuth não configurado. Adicione GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET nos secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // === STEP 1: Generate auth URL ===
  if (action === "init") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const returnTo = url.searchParams.get("return_to") || "";
    const state = btoa(JSON.stringify({ user_id: user.id, return_to: returnTo }));

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // === STEP 2: Callback from Google (browser GET) ===
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return htmlResponse(`<h2>Erro na autenticação Google</h2><p>${errorParam}</p>`);
  }

  if (!code || !stateParam) {
    return htmlResponse(`<h2>Parâmetros inválidos</h2>`);
  }

  let state: { user_id: string; return_to: string };
  try {
    state = JSON.parse(atob(stateParam));
  } catch {
    return htmlResponse(`<h2>State inválido</h2>`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("Google token error:", tokens);
    return htmlResponse(`<h2>Erro ao trocar código</h2><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
  }

  // Get user email
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userInfoRes.json();

  const expiresAt = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString();

  // Save with service role
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error: upsertErr } = await supabaseAdmin
    .from("google_integrations")
    .upsert({
      user_id: state.user_id,
      email_google: userInfo.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scopes: tokens.scope || SCOPES,
      connected_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (upsertErr) {
    console.error("Upsert error:", upsertErr);
    return htmlResponse(`<h2>Erro ao salvar tokens</h2><pre>${upsertErr.message}</pre>`);
  }

  const returnTo = state.return_to || "/admin/configuracoes";
  return htmlResponse(`
    <h2>✅ Google Sheets conectado!</h2>
    <p>Conta: <strong>${userInfo.email}</strong></p>
    <p>Redirecionando...</p>
    <script>
      setTimeout(() => { window.location.href = ${JSON.stringify(returnTo)}; }, 1500);
    </script>
  `);
});

function htmlResponse(body: string) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google OAuth</title>
    <style>body{font-family:system-ui;max-width:600px;margin:80px auto;padding:24px;background:#0a0a0a;color:#e5e5e5}h2{color:#d4af37}pre{background:#1a1a1a;padding:12px;border-radius:8px;overflow:auto}</style>
    </head><body>${body}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
