import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID");

  if (!ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // ── STT: receive audio file, return text ──
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;

      if (!audioFile) {
        return new Response(JSON.stringify({ error: "No audio file" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiFormData = new FormData();
      apiFormData.append("file", audioFile, "audio.webm");
      apiFormData.append("model_id", "scribe_v2");
      apiFormData.append("language_code", "por");

      const sttResp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY },
        body: apiFormData,
      });

      if (!sttResp.ok) {
        const errText = await sttResp.text();
        console.error("ElevenLabs STT error:", sttResp.status, errText);
        return new Response(JSON.stringify({ error: `STT failed: ${sttResp.status}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sttData = await sttResp.json();
      return new Response(JSON.stringify({ text: sttData.text || "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── TTS: receive text, return base64 audio ──
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ELEVENLABS_VOICE_ID) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_VOICE_ID not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      return new Response(JSON.stringify({ error: `TTS failed: ${ttsResp.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await ttsResp.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);

    return new Response(JSON.stringify({ audioContent: audioBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("brain-voice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
