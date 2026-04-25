import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    if (!EVOLUTION_API_URL) throw new Error("EVOLUTION_API_URL não configurada");
    if (!EVOLUTION_API_KEY) throw new Error("EVOLUTION_API_KEY não configurada");

    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
    const { action, instanceName } = await req.json();

    if (!instanceName || typeof instanceName !== "string" || instanceName.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Nome da instância inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = instanceName.trim();
    const headers = {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    };

    // ── ACTION: create ──
    if (action === "create") {
      // 1. Create instance
      const createResp = await fetch(`${baseUrl}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          instanceName: name,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true,
        }),
      });

      const createData = await createResp.json();
      if (!createResp.ok) {
        console.error("Evolution create error:", createData);
        return new Response(JSON.stringify({ error: createData?.message || createData?.error || "Erro ao criar instância" }), {
          status: createResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Set webhook
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
      const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;

      const webhookResp = await fetch(`${baseUrl}/webhook/set/${name}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: false,
            events: [
              "MESSAGES_UPSERT",
              "MESSAGES_UPDATE",
              "CONNECTION_UPDATE",
              "QRCODE_UPDATED",
            ],
          },
        }),
      });

      const webhookData = await webhookResp.json();
      if (!webhookResp.ok) {
        console.error("Evolution webhook error:", webhookData);
      }

      return new Response(JSON.stringify({
        success: true,
        instance: createData,
        webhook: webhookData,
        qrcode: createData?.qrcode?.base64 || createData?.hash?.qrcode || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: status ──
    if (action === "status") {
      const statusResp = await fetch(`${baseUrl}/instance/connectionState/${name}`, {
        method: "GET",
        headers,
      });
      const statusData = await statusResp.json();
      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: qrcode ──
    if (action === "qrcode") {
      const qrResp = await fetch(`${baseUrl}/instance/connect/${name}`, {
        method: "GET",
        headers,
      });
      const qrData = await qrResp.json();
      return new Response(JSON.stringify(qrData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: delete ──
    if (action === "delete") {
      const delResp = await fetch(`${baseUrl}/instance/delete/${name}`, {
        method: "DELETE",
        headers,
      });
      const delData = await delResp.json();
      return new Response(JSON.stringify({ success: delResp.ok, ...delData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida. Use: create, status, qrcode, delete" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("evolution-instance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
