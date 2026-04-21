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

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
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

    // Load logo from brand assets
    const { data: brandAssets } = await supabase
      .from("brand_assets")
      .select("type, file_url, content")
      .eq("is_active", true)
      .in("type", ["logo", "rules"]);

    const logoUrl = brandAssets?.find((a: any) => a.type === "logo" && a.file_url)?.file_url || "";
    const brandRules = brandAssets
      ?.filter((a: any) => a.type === "rules" && a.content)
      .map((a: any) => a.content)
      .join("\n") || "";

    // Build product description for prompt
    const productDetails = [
      productName,
      material ? `Material: ${material}` : null,
      banho ? `Banho: ${banho}` : null,
      pedra ? `Pedra: ${pedra}` : null,
    ].filter(Boolean).join(" | ");

    // Style-specific prompts
    const stylePrompts: Record<string, string> = {
      catalog: [
        "Pure white (#FFFFFF) or very light neutral background, perfectly clean and seamless.",
        "Professional product photography style: centered jewelry piece, sharp focus, even soft lighting from above/front.",
        "The jewelry must be the ONLY subject — remove all distractions, hands, props, clutter.",
        "Crop tightly in portrait orientation (3:4 ratio) with generous padding.",
        "Render fine details: metal texture, gem facets, plating sheen. No shadows except subtle drop shadow.",
      ].join(" "),
      mockup: [
        "Elegant dark background (#0F0F14 or deep charcoal), luxury editorial mood.",
        "Place the jewelry on a minimalist surface (black marble, matte black stand, or floating).",
        "Dramatic side lighting with champagne gold (#C5A96A) accent highlights on the metal.",
        "Magazine-quality product shot with bokeh background.",
        "SOLLARIS JOIAS brand identity — premium, sophisticated, Brazilian luxury.",
      ].join(" "),
      lifestyle: [
        "Warm, aspirational lifestyle scene with a stylish woman wearing the jewelry.",
        "Soft natural light, editorial fashion photography feel.",
        "Background: modern Brazilian interior, café, or outdoor golden hour setting.",
        "The piece must be clearly visible and the hero of the image.",
        "Warm tones, sophisticated yet approachable. Think Vogue Brasil editorial.",
      ].join(" "),
    };

    const styleDesc = stylePrompts[style] || stylePrompts.catalog;

    const imagePrompt = [
      `Create a professional product photo for SOLLARIS JOIAS — premium Brazilian jewelry brand.`,
      ``,
      `STYLE: ${styleDesc}`,
      ``,
      productDetails ? `PRODUCT (from attached raw photo): ${productDetails}. The EXACT same jewelry piece must appear — this is NOT an illustration, treat and relight the actual product.` : "Use the attached jewelry piece as the subject.",
      ``,
      logoUrl ? `Brand: subtle SOLLARIS watermark if the logo can be faithfully reproduced in the corner.` : "",
      brandRules ? `BRAND RULES: ${brandRules.slice(0, 200)}` : "",
      ``,
      `CRITICAL:`,
      `- ABSOLUTELY NO text, labels, prices, captions, or any typography`,
      `- Output must be 1:1 square (1080x1080) ready for e-commerce`,
      `- Photorealistic, not illustrated or stylized`,
      `- The jewelry must look identical to the input photo — just professionally lit and styled`,
    ].filter(Boolean).join("\n");

    // Fetch input image
    const rawImageB64 = await fetchImageAsBase64(imageUrl);
    if (!rawImageB64) return jsonError(400, "Não foi possível carregar a imagem. Verifique a URL.");

    const imageInputs: Array<{ type: string; image_url: string; detail: string }> = [
      { type: "image_url", image_url: `data:image/jpeg;base64,${rawImageB64}`, detail: "high" },
    ];

    // Add logo if available
    if (logoUrl) {
      const logoB64 = await fetchImageAsBase64(logoUrl);
      if (logoB64) {
        imageInputs.push({ type: "image_url", image_url: `data:image/png;base64,${logoB64}`, detail: "high" });
      }
    }

    // Call OpenAI responses API (GPT-4o + image generation tool)
    const content: Array<Record<string, unknown>> = [
      { type: "text", text: imagePrompt },
      ...imageInputs.map((img) => ({
        type: "image_url",
        image_url: { url: img.image_url, detail: img.detail },
      })),
    ];

    let imageBase64: string | undefined;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: content,
        tools: [{ type: "image_generation", size: "1024x1024", quality: "high" }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const output = data.output || [];
      for (const item of output) {
        if (item.type === "image_generation_call" && item.result) {
          imageBase64 = item.result;
          break;
        }
        if (item.content) {
          for (const c of item.content) {
            if (c.type === "image" && c.image_url?.url) {
              const url = c.image_url.url;
              imageBase64 = url.startsWith("data:")
                ? url.split(",")[1]
                : (await fetchImageAsBase64(url)) || undefined;
              break;
            }
          }
        }
      }
    } else {
      const errText = await response.text();
      console.error("responses API error:", response.status, errText);
    }

    // Fallback: gpt-image-1 without the input image
    if (!imageBase64) {
      console.log("Falling back to gpt-image-1...");
      const fallbackRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "high",
        }),
      });

      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        imageBase64 = fbData.data?.[0]?.b64_json;
        if (!imageBase64 && fbData.data?.[0]?.url) {
          imageBase64 = (await fetchImageAsBase64(fbData.data[0].url)) || undefined;
        }
      } else {
        const fbErr = await fallbackRes.text();
        console.error("gpt-image-1 fallback error:", fallbackRes.status, fbErr);
        if (fallbackRes.status === 429) return jsonError(429, "Limite de requisições atingido. Tente novamente em alguns segundos.");
        return jsonError(500, "Erro ao processar foto. Tente novamente.");
      }
    }

    if (!imageBase64) return jsonError(500, "Nenhuma imagem foi gerada. Tente novamente.");

    // Upload processed image to storage
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
