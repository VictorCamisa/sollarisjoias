import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    const event = body.event || body.action;

    if (event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
      console.log("Ignoring event:", event);
      return new Response(JSON.stringify({ ignored: true, event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageData = body.data || body;
    const message = messageData.message || messageData;
    const key = message.key || messageData.key || {};

    if (key.fromMe) {
      return new Response(JSON.stringify({ ignored: true, reason: "fromMe" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (key.remoteJid?.includes("@g.us")) {
      return new Response(JSON.stringify({ ignored: true, reason: "group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Detect if message is audio ──
    const audioMessage =
      message.audioMessage ||
      message.message?.audioMessage ||
      null;
    const isAudioMessage = !!audioMessage;

    // ── Extract text content (for text messages) ──
    const textContent =
      message.conversation ||
      message.extendedTextMessage?.text ||
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.body ||
      messageData.body ||
      null;

    if (!textContent && !isAudioMessage) {
      console.log("No text or audio content, ignoring");
      return new Response(JSON.stringify({ ignored: true, reason: "no_content" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const senderJid = key.remoteJid || messageData.from;
    const senderPhone = senderJid?.replace("@s.whatsapp.net", "") || "unknown";
    const instanceName = body.instance || body.instanceName || messageData.instance;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error("Evolution API credentials missing");
      return new Response(JSON.stringify({ error: "Evolution API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
    const resolvedInstance = instanceName || await getInstanceName(supabase);

    // ── If audio, transcribe first ──
    let userText = textContent || "";

    if (isAudioMessage) {
      console.log("Audio message detected, transcribing...");
      try {
        userText = await transcribeAudio(
          key.id || messageData.key?.id,
          senderJid,
          resolvedInstance,
          baseUrl,
          EVOLUTION_API_KEY
        );
        console.log(`Transcription: "${userText.substring(0, 100)}"`);
      } catch (e) {
        console.error("Transcription error:", e);
        userText = "[Áudio não pôde ser transcrito]";
      }
    }

    if (!userText || userText.trim() === "") {
      return new Response(JSON.stringify({ ignored: true, reason: "empty_content" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Message from ${senderPhone}: "${userText.substring(0, 100)}" (audio: ${isAudioMessage})`);

    // ── Conversation history ──
    const convTitle = `WhatsApp: ${senderPhone}`;
    let conversationId: string;

    const { data: existingConvs } = await supabase
      .from("brain_conversations")
      .select("id")
      .eq("title", convTitle)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (existingConvs && existingConvs.length > 0) {
      conversationId = existingConvs[0].id;
      await supabase.from("brain_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    } else {
      const { data: newConv } = await supabase
        .from("brain_conversations")
        .insert({ title: convTitle })
        .select("id")
        .single();
      conversationId = newConv!.id;
    }

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

    previousMessages.push({ role: "user", content: userText });

    // ── Call Brain Nalu ──
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

    // ── Send reply: audio if received audio, text otherwise ──
    if (isAudioMessage) {
      console.log("Generating audio reply with ElevenLabs TTS...");
      try {
        const audioBase64 = await textToSpeech(replyText);
        
        // Send audio via Evolution API using sendMedia endpoint
        const sendResp = await fetch(`${baseUrl}/message/sendMedia/${resolvedInstance}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: senderPhone,
            mediatype: "audio",
            media: `data:audio/mpeg;base64,${audioBase64}`,
            fileName: "response.mp3",
          }),
        });

        const sendData = await sendResp.json();
        if (!sendResp.ok) {
          console.error("Evolution send audio error:", sendData);
          // Fallback: send as text
          await sendTextReply(baseUrl, resolvedInstance, EVOLUTION_API_KEY, senderPhone, replyText);
        } else {
          console.log("Audio reply sent successfully to", senderPhone);
        }
      } catch (e) {
        console.error("TTS error, falling back to text:", e);
        await sendTextReply(baseUrl, resolvedInstance, EVOLUTION_API_KEY, senderPhone, replyText);
      }
    } else {
      await sendTextReply(baseUrl, resolvedInstance, EVOLUTION_API_KEY, senderPhone, replyText);
    }

    return new Response(JSON.stringify({
      success: true,
      sender: senderPhone,
      replied: true,
      mode: isAudioMessage ? "audio" : "text",
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

// ── Helper: send text reply ──
async function sendTextReply(baseUrl: string, instance: string, apiKey: string, phone: string, text: string) {
  const sendResp = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: phone, text }),
  });
  const sendData = await sendResp.json();
  if (!sendResp.ok) {
    console.error("Evolution send text error:", sendData);
  } else {
    console.log("Text reply sent successfully to", phone);
  }
}

// ── Helper: get instance name from settings ──
async function getInstanceName(supabase: any): Promise<string> {
  const { data } = await supabase.from("settings").select("evolution_instance").limit(1).single();
  return data?.evolution_instance || "default";
}

// ── Transcribe audio using ElevenLabs STT ──
async function transcribeAudio(
  messageId: string,
  senderJid: string,
  instance: string,
  evolutionBaseUrl: string,
  evolutionApiKey: string
): Promise<string> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not set");

  // Download audio base64 from Evolution API
  const downloadResp = await fetch(
    `${evolutionBaseUrl}/chat/getBase64FromMediaMessage/${instance}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
      body: JSON.stringify({
        message: { key: { remoteJid: senderJid, id: messageId } },
        convertToMp4: false,
      }),
    }
  );

  if (!downloadResp.ok) {
    const errText = await downloadResp.text();
    console.error("Evolution download audio error:", downloadResp.status, errText);
    throw new Error(`Failed to download audio: ${downloadResp.status}`);
  }

  const downloadData = await downloadResp.json();
  const audioBase64 = downloadData.base64 || downloadData.data?.base64;

  if (!audioBase64) {
    console.error("No base64 in download response:", JSON.stringify(downloadData).substring(0, 300));
    throw new Error("No audio base64 received");
  }

  // Decode base64 to binary
  const binaryStr = atob(audioBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // Create form data for ElevenLabs STT
  const formData = new FormData();
  const audioBlob = new Blob([bytes], { type: "audio/ogg" });
  formData.append("file", audioBlob, "audio.ogg");
  formData.append("model_id", "scribe_v2");
  formData.append("language_code", "por");

  const sttResp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
    body: formData,
  });

  if (!sttResp.ok) {
    const errText = await sttResp.text();
    console.error("ElevenLabs STT error:", sttResp.status, errText);
    throw new Error(`STT failed: ${sttResp.status}`);
  }

  const sttData = await sttResp.json();
  return sttData.text || "";
}

// ── Text to Speech using ElevenLabs ──
async function textToSpeech(text: string): Promise<string> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID");

  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error("ElevenLabs credentials not configured");
  }

  // Truncate text if too long for TTS (5000 char limit)
  const truncatedText = text.length > 4500 ? text.substring(0, 4500) + "..." : text;

  const ttsResp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: truncatedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!ttsResp.ok) {
    const errText = await ttsResp.text();
    console.error("ElevenLabs TTS error:", ttsResp.status, errText);
    throw new Error(`TTS failed: ${ttsResp.status}`);
  }

  const audioBuffer = await ttsResp.arrayBuffer();
  return base64Encode(audioBuffer);
}
