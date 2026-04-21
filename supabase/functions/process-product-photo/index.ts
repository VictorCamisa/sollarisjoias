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

async function fetchImageBytes(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buf = await res.arrayBuffer();
    return { bytes: new Uint8Array(buf), contentType };
  } catch (e) {
    console.error("Failed to fetch image:", url, e);
    return null;
  }
}

function decodeBase64(base64: string): Uint8Array {
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
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
      style = "catalog", // "catalog" | "mockup" | "lifestyle"
    } = await req.json();

    if (!imageUrl) return jsonError(400, "imageUrl é obrigatório");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build product hint
    const productDetails = [
      productName,
      material ? `material ${material}` : null,
      banho ? `banho ${banho}` : null,
      pedra ? `pedra ${pedra}` : null,
    ].filter(Boolean).join(", ");

    // EDIT prompts — não recriar, apenas relight + background. NUNCA mudar a forma da peça.
    const stylePrompts: Record<string, string> = {
      catalog:
        "Keep the EXACT same jewelry piece from the input photo — same shape, same details, same proportions, same gemstones, same metal finish. Do NOT redesign or alter the piece in any way. Only: replace the background with a clean, seamless pure white (#FFFFFF) studio backdrop, apply professional even soft lighting from above and front, render fine micro-details (metal texture, gem facets, plating sheen), add a very subtle natural drop shadow under the piece. Center the piece in portrait composition. Photorealistic product photography. Absolutely no text, no logos, no captions, no typography.",
      mockup:
        "Keep the EXACT same jewelry piece from the input photo — same shape, details, gemstones, finish. Do NOT redesign. Only relight and restyle: place it on an elegant deep charcoal (#0F0F14) surface with luxury editorial mood, dramatic side lighting with warm champagne gold accent highlights on the metal, subtle bokeh dark background, magazine-quality jewelry photography. Photorealistic. No text, no logos, no captions.",
      lifestyle:
        "Keep the EXACT same jewelry piece from the input photo — same shape, details, finish. Do NOT redesign the piece. Place the same piece worn naturally by a stylish woman in a warm editorial lifestyle scene (soft natural light, modern Brazilian interior or golden hour outdoor), Vogue Brasil editorial feel. The jewelry must remain clearly visible, identical to the input, and be the hero. Photorealistic. No text, no logos, no captions.",
    };

    const styleDesc = stylePrompts[style] || stylePrompts.catalog;
    const finalPrompt = productDetails
      ? `${styleDesc}\n\nProduct reference: ${productDetails}.`
      : styleDesc;

    // Fetch input image bytes (the REAL product photo we want to preserve)
    const input = await fetchImageBytes(imageUrl);
    if (!input) return jsonError(400, "Não foi possível carregar a imagem original. Verifique a URL.");

    // Use OpenAI /images/edits with gpt-image-1 — this preserves the actual product
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", finalPrompt);
    formData.append("size", "1024x1024");
    formData.append("quality", "high");
    formData.append("n", "1");
    formData.append(
      "image",
      new Blob([input.bytes], { type: input.contentType }),
      "input.png",
    );

    let imageBase64: string | undefined;

    const editRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (editRes.ok) {
      const editData = await editRes.json();
      imageBase64 = editData.data?.[0]?.b64_json;
      if (!imageBase64 && editData.data?.[0]?.url) {
        const fetched = await fetchImageBytes(editData.data[0].url);
        if (fetched) {
          let bin = "";
          for (let i = 0; i < fetched.bytes.length; i++) bin += String.fromCharCode(fetched.bytes[i]);
          imageBase64 = btoa(bin);
        }
      }
    } else {
      const errText = await editRes.text();
      console.error("images/edits error:", editRes.status, errText);
      if (editRes.status === 429) return jsonError(429, "Limite de requisições atingido. Tente em alguns segundos.");
      if (editRes.status === 401) return jsonError(500, "Chave OpenAI inválida.");
      return jsonError(500, `Falha ao editar a foto (${editRes.status}). A foto original precisa ser PNG/JPG válida.`);
    }

    if (!imageBase64) return jsonError(500, "Nenhuma imagem foi gerada. Tente novamente.");

    // Upload to storage
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
