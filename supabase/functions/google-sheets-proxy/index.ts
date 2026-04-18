import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Integration {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  email_google: string;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
  const CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Refresh failed: ${JSON.stringify(data)}`);
  return data;
}

async function getValidToken(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<{ token: string; integration: Integration }> {
  const { data, error } = await supabaseAdmin
    .from("google_integrations")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("Google não conectado para este usuário");

  const integration = data as Integration;
  const expiresAt = new Date(integration.expires_at).getTime();
  if (Date.now() < expiresAt) {
    return { token: integration.access_token, integration };
  }

  // Refresh
  const refreshed = await refreshAccessToken(integration.refresh_token);
  const newExpiresAt = new Date(Date.now() + (refreshed.expires_in - 60) * 1000).toISOString();
  await supabaseAdmin
    .from("google_integrations")
    .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
    .eq("user_id", userId);
  return { token: refreshed.access_token, integration: { ...integration, access_token: refreshed.access_token } };
}

async function callGoogle(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`Google API ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, user_id: bodyUserId } = body;

    // Identify caller: either via JWT (frontend) or via service-role + user_id (brain-nalu)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (authHeader && !bodyUserId) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      userId = user?.id ?? null;
    } else if (bodyUserId) {
      // Trust service-role caller
      userId = bodyUserId;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    // === STATUS / DISCONNECT actions don't need Google call ===
    if (action === "status") {
      const { data } = await supabaseAdmin
        .from("google_integrations")
        .select("email_google, connected_at, scopes")
        .eq("user_id", userId)
        .maybeSingle();
      return new Response(JSON.stringify({ connected: !!data, ...(data || {}) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      // Try to revoke at Google
      try {
        const { data } = await supabaseAdmin
          .from("google_integrations")
          .select("refresh_token")
          .eq("user_id", userId)
          .maybeSingle();
        if (data?.refresh_token) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${data.refresh_token}`, { method: "POST" });
        }
      } catch (_) { /* ignore */ }
      await supabaseAdmin.from("google_integrations").delete().eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token } = await getValidToken(supabaseAdmin, userId);

    // === LIST SHEETS ===
    if (action === "list_sheets") {
      const q = body.query as string | undefined;
      const queryParts = ["mimeType='application/vnd.google-apps.spreadsheet'", "trashed=false"];
      if (q) queryParts.push(`name contains '${q.replace(/'/g, "\\'")}'`);
      const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryParts.join(" and "))}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=50&orderBy=modifiedTime desc`;
      const data = await callGoogle(token, driveUrl);
      return new Response(JSON.stringify({ sheets: data.files || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === READ RANGE ===
    if (action === "read_range") {
      const { spreadsheet_id, range } = body;
      if (!spreadsheet_id || !range) throw new Error("spreadsheet_id e range obrigatórios");
      const data = await callGoogle(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}`
      );
      return new Response(JSON.stringify({ range: data.range, values: data.values || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === GET SHEET METADATA (tabs, etc) ===
    if (action === "get_metadata") {
      const { spreadsheet_id } = body;
      const data = await callGoogle(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}?fields=properties.title,sheets(properties(sheetId,title,gridProperties))`
      );
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === WRITE RANGE (overwrite) ===
    if (action === "write_range") {
      const { spreadsheet_id, range, values } = body;
      const data = await callGoogle(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        { method: "PUT", body: JSON.stringify({ values }) }
      );
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === APPEND ROW ===
    if (action === "append_row") {
      const { spreadsheet_id, range, values } = body;
      const data = await callGoogle(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        { method: "POST", body: JSON.stringify({ values }) }
      );
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CREATE SHEET ===
    if (action === "create_sheet") {
      const { title } = body;
      const data = await callGoogle(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets`,
        { method: "POST", body: JSON.stringify({ properties: { title: title || "Nova Planilha Sollaris" } }) }
      );
      return new Response(JSON.stringify({ id: data.spreadsheetId, url: data.spreadsheetUrl, title: data.properties?.title }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("google-sheets-proxy error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
