import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonOk(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeBase64(base64: string): Uint8Array {
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function encodeBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function fetchImageBytes(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    if (url.startsWith("data:")) {
      const match = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
      if (!match) return null;
      const contentType = match[1] || "image/jpeg";
      const isBase64 = Boolean(match[2]);
      const payload = match[3] || "";
      if (isBase64) return { bytes: decodeBase64(payload), contentType };
      return { bytes: new TextEncoder().encode(decodeURIComponent(payload)), contentType };
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buf = await res.arrayBuffer();
    return { bytes: new Uint8Array(buf), contentType };
  } catch (e) {
    console.error("fetchImageBytes error:", e);
    return null;
  }
}

function buildPrompt(style: string, productDetails: string): string {
  const PRESERVE =
    "CRITICAL RULE — THIS IS PHOTO RETOUCHING, NOT IMAGE GENERATION. " +
    "You MUST preserve the exact jewelry piece from the reference photo with absolute fidelity: " +
    "identical silhouette, gemstone color and cut, chain/link pattern, metal finish (gold/silver/rose), " +
    "proportions and scale, orientation, prong count, engraving, and every visible detail. " +
    "DO NOT redesign, restyle, or change any element. DO NOT invent new features. " +
    "DO NOT add logos, brand marks, watermarks, text, typography, or any graphic overlay. " +
    "The image must be completely free of text and brand elements.";

  const DARK =
    "Background: deep obsidian black (#090909–#0D0D0F). This is the permanent Sollaris luxury ecommerce standard — non-negotiable.";

  const prompts: Record<string, string> = {
    catalog:
      `${PRESERVE} ${DARK} Replace ONLY the background with a perfectly seamless obsidian black backdrop. ` +
      `Apply luxury jewelry studio lighting: soft key light from slightly above-front, subtle champagne-gold rim highlights on metal edges, zero harsh shadows. ` +
      `Center the jewelry. Photorealistic, ultra-sharp product photography. NO text, NO logo, NO watermark under any circumstances.`,
    mockup:
      `${PRESERVE} ${DARK} Compose the exact same jewelry in a luxury editorial scene: obsidian black environment, ` +
      `barely-visible dark reflective surface, dramatic warm champagne side lighting. ` +
      `Ultra-photorealistic premium fashion editorial. NO text, NO logo, NO watermark.`,
    lifestyle:
      `${PRESERVE} ${DARK} Place the exact same jewelry in a dark editorial lifestyle scene: obsidian mood, ` +
      `soft warm champagne highlights, premium fashion styling. The jewelry must be the visual hero, ` +
      `visually identical to the input. Photorealistic. NO text, NO logo, NO watermark.`,
  };

  const base = prompts[style] || prompts.catalog;
  return productDetails ? `${base}\n\nProduct reference: ${productDetails}.` : base;
}

/* ─── OpenAI gpt-image-1 ─── */
async function processWithOpenAI(
  imageData: { bytes: Uint8Array; contentType: string },
  prompt: string,
  apiKey: string,
  style: string,
): Promise<string | null> {
  const ext = imageData.contentType.includes("png") ? "png"
    : imageData.contentType.includes("webp") ? "webp"
    : "jpeg";
  const fileName = `product.${ext}`;
  const blob = new Blob([imageData.bytes], { type: imageData.contentType });

  const formData = new FormData();
  formData.append("image[]", blob, fileName);
  formData.append("prompt", prompt);
  formData.append("model", "gpt-image-1");
  formData.append("n", "1");
  formData.append("size", "1024x1024");
  formData.append("quality", "high");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI error:", res.status, errText);
    if (res.status === 429) throw new Error("Limite de requisições OpenAI atingido. Tente em alguns segundos.");
    if (res.status === 402 || res.status === 403) throw new Error("Créditos ou permissão insuficiente na conta OpenAI.");
    throw new Error(`OpenAI retornou status ${res.status}.`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json as string | undefined;
  return b64 || null;
}

/* ─── Google Gemini 2.0 Flash (fallback) ─── */
async function processWithGemini(
  imageData: { bytes: Uint8Array; contentType: string },
  prompt: string,
  apiKey: string,
): Promise<string | null> {
  const base64Image = encodeBase64(imageData.bytes);
  const mimeType = imageData.contentType.split(";")[0] || "image/jpeg";

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini error:", res.status, errText);
    if (res.status === 429) throw new Error("Limite de requisições Gemini atingido. Tente em alguns segundos.");
    throw new Error(`Gemini retornou status ${res.status}.`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inline_data?.data) return part.inline_data.data as string;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      imageUrl,
      productName = "",
      banho = "",
      pedra = "",
      material = "",
      style = "catalog",
    } = await req.json();

    if (!imageUrl) return jsonError(400, "imageUrl é obrigatório");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

    if (!OPENAI_API_KEY && !GOOGLE_API_KEY) {
      return jsonError(500,
        "Nenhuma chave de IA configurada. Adicione OPENAI_API_KEY ou GOOGLE_API_KEY nas variáveis de ambiente do Supabase."
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const productDetails = [
      productName,
      material ? `material ${material}` : null,
      banho ? `banho ${banho}` : null,
      pedra ? `pedra ${pedra}` : null,
    ].filter(Boolean).join(", ");

    const prompt = buildPrompt(style, productDetails);

    const imageData = await fetchImageBytes(imageUrl);
    if (!imageData) return jsonError(400, "Não foi possível carregar a imagem original.");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let imageBase64: string | null = null;
    let lastError: Error | null = null;

    // 1. Try OpenAI (gpt-image-1) first
    if (OPENAI_API_KEY) {
      try {
        imageBase64 = await processWithOpenAI(imageData, prompt, OPENAI_API_KEY, style);
      } catch (e: any) {
        console.error("OpenAI failed:", e.message);
        lastError = e;
      }
    }

    // 2. Fallback to Google Gemini direct API
    if (!imageBase64 && GOOGLE_API_KEY) {
      try {
        imageBase64 = await processWithGemini(imageData, prompt, GOOGLE_API_KEY);
      } catch (e: any) {
        console.error("Gemini direct failed:", e.message);
        lastError = e;
      }
    }

    // 3. Last resort: Lovable AI Gateway
    if (!imageBase64 && LOVABLE_API_KEY) {
      try {
        const dataUrl = `data:${imageData.contentType};base64,${encodeBase64(imageData.bytes)}`;
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          console.error("lovable image edit error:", aiRes.status, errText);
          if (aiRes.status === 429) return jsonError(429, "Limite de requisições atingido. Tente em alguns segundos.");
          if (aiRes.status === 402) return jsonError(402, "Créditos de IA insuficientes no workspace. Adicione saldo em Settings > Cloud & AI balance ou configure OPENAI_API_KEY/GOOGLE_API_KEY.");
          throw new Error(`Lovable AI retornou ${aiRes.status}.`);
        }

        const aiData = await aiRes.json();
        const generatedUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (generatedUrl) {
          if (generatedUrl.startsWith("data:image/")) {
            imageBase64 = generatedUrl.split(",")[1];
          } else {
            const fetched = await fetchImageBytes(generatedUrl);
            if (fetched) imageBase64 = encodeBase64(fetched.bytes);
          }
        }
      } catch (e: any) {
        console.error("Lovable AI failed:", e.message);
        lastError = e;
      }
    }

    if (!imageBase64) {
      const msg = lastError?.message || "Nenhum provedor de IA disponível conseguiu gerar a imagem.";
      return jsonError(500, msg);
    }

    const imageBytes = decodeBase64(imageBase64);
    const fileName = `product-ai/${Date.now()}-${style}.png`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return jsonOk({ image_url: `data:image/png;base64,${imageBase64}`, style });
    }

    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return jsonOk({ image_url: publicUrl.publicUrl, style });
  } catch (e) {
    console.error("process-product-photo error:", e);
    return jsonError(500, e instanceof Error ? e.message : "Erro desconhecido");
  }
});
