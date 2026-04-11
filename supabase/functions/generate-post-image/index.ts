import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BrandAsset = { type: string; title: string; content?: string | null; file_url?: string | null };

const platformFormats: Record<string, { label: string; size: string }> = {
  Instagram: { label: "1080×1080 (1:1)", size: "1024x1024" },
  TikTok: { label: "1080×1920 (9:16)", size: "1024x1792" },
  Facebook: { label: "1200×630 (1.91:1)", size: "1792x1024" },
  WhatsApp: { label: "1080×1080 (1:1)", size: "1024x1024" },
  LinkedIn: { label: "1200×627 (1.91:1)", size: "1792x1024" },
};

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeBase64(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function loadActiveBrandAssets(supabase: any) {
  const { data, error } = await supabase
    .from("brand_assets")
    .select("type, title, content, file_url")
    .eq("is_active", true)
    .order("type");
  if (error) console.error("Brand assets error:", error);
  return (data || []) as BrandAsset[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      prompt,
      platform,
      productId,
      caption,
      style = "dark",
      brandContext,
      brandAssets = [],
      referenceContext,
      generationDirectives = {},
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load brand assets from DB
    const storedAssets = await loadActiveBrandAssets(supabase);
    const allAssets = [...((Array.isArray(brandAssets) ? brandAssets : []) as BrandAsset[]), ...storedAssets];

    // Get product info
    let productInfo = "";
    let productImageUrl = "";
    if (productId) {
      const { data: product } = await supabase
        .from("products")
        .select("name, price, material, banho, pedra, foto_frontal, foto_lifestyle, images")
        .eq("id", productId)
        .single();

      if (product) {
        productInfo = [
          product.name,
          product.material ? `Material: ${product.material}` : null,
          product.banho ? `Banho: ${product.banho}` : null,
          product.pedra ? `Pedra: ${product.pedra}` : null,
        ].filter(Boolean).join(" | ");
        productImageUrl = product.foto_lifestyle || product.foto_frontal || (product.images?.[0]) || "";
      }
    }

    const effectiveFormat = platformFormats[platform] || platformFormats.Instagram;
    const isDark = style === "dark";

    // Get reference URLs
    const referenceUrls = allAssets
      .filter((a) => a.type === "reference" && a.file_url)
      .slice(0, 3)
      .map((a) => a.file_url!);

    const logoUrl = allAssets.find((a) => a.type === "logo" && a.file_url)?.file_url || "";

    // Build brand rules from text assets
    const brandRules = allAssets
      .filter((a) => a.type === "rules" && a.content)
      .map((a) => a.content!)
      .join("\n");

    // Build concise, focused prompt
    const colorScheme = isDark
      ? "Dark mode: matte black background (#0F0F14), white text, champagne gold (#C5A96A) accents"
      : "Light mode: warm off-white background (#F8F4EF), dark text, champagne gold (#C5A96A) accents";

    const promptParts: string[] = [
      `Create a premium Instagram post for SOLLARIS, a luxury Brazilian jewelry brand.`,
      `Theme: ${prompt}`,
      `Style: ${colorScheme}`,
      `Format: ${effectiveFormat.label}`,
    ];

    if (productInfo) {
      promptParts.push(`Product: ${productInfo}. This specific product must be the hero of the composition.`);
    }

    if (caption) {
      promptParts.push(`Caption context: "${caption.slice(0, 150)}"`);
    }

    if (referenceUrls.length > 0) {
      promptParts.push(`Use the reference images as STYLE INSPIRATION ONLY (composition, lighting, mood). Do NOT copy their product, brand, or text.`);
    }

    promptParts.push(
      `Design rules:`,
      `- Minimalist luxury aesthetic (think Bottega Veneta × Cartier)`,
      `- "SOLLARIS" in clean, wide-spaced uppercase if text is needed`,
      `- Rule of thirds, generous negative space`,
      `- No clutter, no emojis, no generic templates`,
      `- Magazine-quality, ready to publish`,
    );

    if (brandRules) {
      promptParts.push(`Brand guidelines: ${brandRules.slice(0, 300)}`);
    }

    const imagePrompt = promptParts.join("\n");

    // Build the request - use gpt-image-1 with image inputs if available
    const imageInputs: Array<{ type: string; image_url: { url: string } }> = [];

    // Add product image
    if (productImageUrl) {
      imageInputs.push({ type: "image_url", image_url: { url: productImageUrl } });
    }

    // Add logo
    if (logoUrl) {
      imageInputs.push({ type: "image_url", image_url: { url: logoUrl } });
    }

    // Add references (max 2)
    for (const refUrl of referenceUrls.slice(0, 2)) {
      imageInputs.push({ type: "image_url", image_url: { url: refUrl } });
    }

    // Try gpt-image-1 first (supports image inputs via chat completions)
    let imageBase64: string | null = null;

    if (imageInputs.length > 0) {
      // Use chat completions with image inputs for better context
      console.log(`Generating with gpt-image-1 + ${imageInputs.length} reference images`);

      const content: Array<any> = [
        { type: "text", text: imagePrompt },
        ...imageInputs,
      ];

      const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content,
            },
          ],
          max_tokens: 500,
        }),
      });

      // gpt-4o can't generate images, so fall through to pure generation
      // The chat completions approach doesn't work for image generation
      // Just go straight to image generation API
    }

    // Generate image with gpt-image-1
    console.log("Generating image with gpt-image-1");
    const genResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: imagePrompt,
        n: 1,
        size: effectiveFormat.size,
      }),
    });

    if (!genResponse.ok) {
      const errText = await genResponse.text();
      console.error("gpt-image-1 error:", genResponse.status, errText);

      if (genResponse.status === 429) return jsonError(429, "Limite de requisições atingido. Tente novamente.");
      if (genResponse.status === 402) return jsonError(402, "Créditos insuficientes.");

      // Fallback to dall-e-3
      console.log("Falling back to dall-e-3");
      const fallbackResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: imagePrompt.slice(0, 3900),
          n: 1,
          size: effectiveFormat.size,
          response_format: "b64_json",
        }),
      });

      if (!fallbackResponse.ok) {
        const fbErr = await fallbackResponse.text();
        console.error("dall-e-3 fallback error:", fallbackResponse.status, fbErr);
        return jsonError(500, "Erro ao gerar imagem");
      }

      const fbData = await fallbackResponse.json();
      imageBase64 = fbData?.data?.[0]?.b64_json || null;
    } else {
      const genData = await genResponse.json();
      // gpt-image-1 returns b64_json by default
      imageBase64 = genData?.data?.[0]?.b64_json || null;

      // If it returned a URL instead
      if (!imageBase64 && genData?.data?.[0]?.url) {
        const imgResp = await fetch(genData.data[0].url);
        if (imgResp.ok) {
          const buf = await imgResp.arrayBuffer();
          imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        }
      }
    }

    if (!imageBase64) {
      return jsonError(500, "Nenhuma imagem foi gerada. Tente novamente.");
    }

    // Upload to storage
    const imageBytes = decodeBase64(imageBase64);
    const fileName = `posts/${Date.now()}-${platform.toLowerCase()}-${style}.png`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ image_url: `data:image/png;base64,${imageBase64}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(fileName);

    return new Response(JSON.stringify({ image_url: publicUrl.publicUrl, style }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
