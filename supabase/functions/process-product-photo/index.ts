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

function buildPrompt(style: string, productDetails: string, customInstruction?: string, photoPreset = "standard"): string {
  const PRESERVE =
    "CRITICAL RULE — THIS IS PHOTO RETOUCHING, NOT IMAGE GENERATION. " +
    "You MUST preserve the exact jewelry piece from the reference photo with absolute fidelity: " +
    "identical silhouette, gemstone color and cut, chain/link pattern, metal finish (gold/silver/rose), " +
    "proportions and scale, orientation, prong count, engraving, and every visible detail. " +
    "COUNT LOCK: preserve the exact number of visible pieces. If the reference shows a pair, output exactly two; " +
    "if it shows a trio or set of three small earrings, output exactly three separate pieces, never one, two, four, duplicated, merged, or redesigned. " +
    "Do not change the spacing relationship between pieces except to gently center the complete set. " +
    "DO NOT redesign, restyle, or change any element. DO NOT invent new features. " +
    "DO NOT add logos, brand marks, watermarks, text, typography, or any graphic overlay. " +
    "The image must be completely free of text and brand elements.";

  const CLEAR =
    "Background: warm pearl/off-white (#F7F3EC to #FFFFFF), matching the new clear Sollaris storefront layout. " +
    "Use a clean luxury ecommerce surface, soft champagne reflection, subtle contact shadow, high clarity, no black background, no colored props.";

  const presetRules: Record<string, string> = {
    standard:
      "STANDARD PRODUCT MODE: keep the item centered, crisp, premium and truthful. Product should occupy about 72–82% of the canvas with elegant breathing room.",
    small_set:
      "SMALL SET / TRIO MODE: designed for tiny earrings, sets and multiple small pieces. Use macro product photography. " +
      "Every individual earring or charm must remain visible, separated, sharp and true to the source. Preserve exactly the same count and arrangement. " +
      "Do not simplify stones, close holes, thicken posts, fuse pieces, or turn a trio into a single object.",
    macro:
      "MACRO DETAIL MODE: preserve the original product while improving sharpness, metal highlights and stone definition. Do not crop away edges or change geometry.",
    exact:
      "MAXIMUM FIDELITY MODE: make the smallest possible edits. Prefer cleaning background, exposure, shadow and sharpness over changing product pixels. " +
      "If unsure, leave the product exactly as in the reference photo.",
  };

  const selectedPreset = presetRules[photoPreset] || presetRules.standard;

  // 🔧 EDIÇÃO PONTUAL — quando o usuário pede um ajuste específico,
  // alteramos APENAS o que foi pedido e mantemos todo o resto idêntico.
  if (customInstruction && customInstruction.trim().length > 0) {
    const SURGICAL =
      "SURGICAL EDIT MODE — Apply ONLY the specific change requested below. " +
      "Keep EVERYTHING ELSE in the image absolutely identical: composition, framing, lighting direction, " +
      "background, colors, shadows, reflections, and every pixel that is not part of the requested change. " +
      "Do NOT regenerate the scene from scratch. Do NOT redesign the product. Do NOT change the camera angle. " +
      "This is a targeted retouch, like a Photoshop adjustment layer applied to the original photo.";

    const base =
      `${SURGICAL} ${PRESERVE} ${selectedPreset} ` +
      `\n\nUSER REQUESTED CHANGE (apply ONLY this, nothing else): "${customInstruction.trim()}"` +
      `\n\nRemember: clear pearl storefront background when background is touched; NO text, NO logo, NO watermark. Photorealistic output matching the original product.`;

    return productDetails ? `${base}\n\nProduct reference: ${productDetails}.` : base;
  }

  const prompts: Record<string, string> = {
    catalog:
      `${PRESERVE} ${CLEAR} ${selectedPreset} Replace ONLY the background and lighting environment; the jewelry itself is the source of truth. ` +
      `Apply luxury jewelry studio lighting: soft key light from slightly above-front, subtle champagne-gold rim highlights on metal edges, zero harsh shadows. ` +
      `Center the complete product/set. Photorealistic, ultra-sharp product photography. NO text, NO logo, NO watermark under any circumstances.`,
    mockup:
      `${PRESERVE} ${CLEAR} ${selectedPreset} Compose the exact same jewelry in a minimal luxury editorial scene: warm pearl surface, ` +
      `soft champagne side lighting, refined shadow, no distracting props. ` +
      `Ultra-photorealistic premium fashion editorial. NO text, NO logo, NO watermark.`,
    lifestyle:
      `${PRESERVE} ${CLEAR} ${selectedPreset} Place the exact same jewelry in a bright minimal editorial lifestyle scene: pearl-toned mood, ` +
      `soft warm champagne highlights, premium styling. The jewelry must be the visual hero, ` +
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
  photoPreset = "standard",
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
  formData.append("quality", photoPreset === "small_set" || photoPreset === "macro" || photoPreset === "exact" ? "high" : "medium");

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
      customInstruction = "",
      photoPreset = "standard",
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

    const prompt = buildPrompt(style, productDetails, customInstruction, photoPreset);

    const imageData = await fetchImageBytes(imageUrl);
    if (!imageData) return jsonError(400, "Não foi possível carregar a imagem original.");

    let imageBase64: string | null = null;
    let lastError: Error | null = null;

    // 1. Try OpenAI (gpt-image-1) first — provedor primário
    if (OPENAI_API_KEY) {
      try {
        imageBase64 = await processWithOpenAI(imageData, prompt, OPENAI_API_KEY, style, photoPreset);
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

    if (!imageBase64) {
      const msg = lastError?.message || "Configure OPENAI_API_KEY (ou GOOGLE_API_KEY) para gerar imagens.";
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
    return jsonOk({ image_url: publicUrl.publicUrl, style, photoPreset });
  } catch (e) {
    console.error("process-product-photo error:", e);
    return jsonError(500, e instanceof Error ? e.message : "Erro desconhecido");
  }
});
