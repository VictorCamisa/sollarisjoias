import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

    // Evolution API sends different event types
    const event = body.event || body.action;

    // Only process incoming text messages
    if (event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
      console.log("Ignoring event:", event);
      return new Response(JSON.stringify({ ignored: true, event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract message data from Evolution API payload
    const messageData = body.data || body;
    const message = messageData.message || messageData;
    const key = message.key || messageData.key || {};

    // Ignore messages sent by us (fromMe)
    if (key.fromMe) {
      console.log("Ignoring own message");
      return new Response(JSON.stringify({ ignored: true, reason: "fromMe" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ignore group messages — only respond to direct messages
    if (key.remoteJid?.includes("@g.us")) {
      console.log("Ignoring group message");
      return new Response(JSON.stringify({ ignored: true, reason: "group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text content
    const textContent =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.body ||
      messageData.body ||
      null;

    if (!textContent) {
      console.log("No text content, ignoring");
      return new Response(JSON.stringify({ ignored: true, reason: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const senderJid = key.remoteJid || messageData.from;
    const senderPhone = senderJid?.replace("@s.whatsapp.net", "") || "unknown";
    const instanceName = body.instance || body.instanceName || messageData.instance;

    console.log(`Message from ${senderPhone}: "${textContent.substring(0, 100)}"`);

    // ── Call Brain Nalu ──
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find or create a conversation for this phone number
    const convTitle = `WhatsApp: ${senderPhone}`;
    let conversationId: string;

    // Check for existing conversation with this phone
    const { data: existingConvs } = await supabase
      .from("brain_conversations")
      .select("id")
      .eq("title", convTitle)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (existingConvs && existingConvs.length > 0) {
      conversationId = existingConvs[0].id;
      // Update timestamp
      await supabase.from("brain_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    } else {
      const { data: newConv } = await supabase
        .from("brain_conversations")
        .insert({ title: convTitle })
        .select("id")
        .single();
      conversationId = newConv!.id;
    }

    // Get recent message history for this conversation
    const { data: history } = await supabase
      .from("brain_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    const previousMessages = (history || []).reverse().map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // Add current message
    previousMessages.push({ role: "user", content: textContent });

    // Call Brain Nalu edge function
    const brainResponse = await fetch(`${SUPABASE_URL}/functions/v1/brain-nalu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        messages: previousMessages,
        conversation_id: conversationId,
        save_messages: true,
      }),
    });

    if (!brainResponse.ok) {
      const errText = await brainResponse.text();
      console.error("Brain Nalu error:", brainResponse.status, errText);
      throw new Error(`Brain Nalu returned ${brainResponse.status}`);
    }

    const brainData = await brainResponse.json();
    const replyText = brainData.response || "Desculpe, não consegui processar sua mensagem.";

    console.log(`Brain reply: "${replyText.substring(0, 100)}"`);

    // ── Send reply via Evolution API ──
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error("Evolution API credentials missing");
      return new Response(JSON.stringify({ error: "Evolution API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
    const resolvedInstance = instanceName || await getInstanceName(supabase);

    const sendResp = await fetch(`${baseUrl}/message/sendText/${resolvedInstance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: senderPhone,
        text: replyText,
      }),
    });

    const sendData = await sendResp.json();
    if (!sendResp.ok) {
      console.error("Evolution send error:", sendData);
    } else {
      console.log("Reply sent successfully to", senderPhone);
    }

    return new Response(JSON.stringify({
      success: true,
      sender: senderPhone,
      replied: true,
      actions: brainData.actions_executed || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("whatsapp-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper to get instance name from settings if not in webhook payload
async function getInstanceName(supabase: any): Promise<string> {
  const { data } = await supabase.from("settings").select("evolution_instance").limit(1).single();
  return data?.evolution_instance || "default";
}
