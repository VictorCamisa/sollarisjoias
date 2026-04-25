import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BrandAsset = { type: string; title: string; content?: string | null; file_url?: string | null };

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

async function loadActiveBrandAssets(supabase: any): Promise<BrandAsset[]> {
  const { data, error } = await supabase
    .from("brand_assets")
    .select("type, title, content, file_url")
    .eq("is_active", true)
    .order("type");
  if (error) console.error("Brand assets error:", error);
  return (data || []) as BrandAsset[];
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      prompt,
      productId,
      style = "dark",
      brandAssets = [],
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load brand assets from DB
    const storedAssets = await loadActiveBrandAssets(supabase);
    const allAssets = [...((Array.isArray(brandAssets) ? brandAssets : []) as BrandAsset[]), ...storedAssets];

    // Get product info + image
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

    // Collect visual references
    const referenceUrls = allAssets
      .filter((a) => a.type === "reference" && a.file_url)
      .slice(0, 6)
      .map((a) => a.file_url!);

    const logoUrl = allAssets.find((a) => a.type === "logo" && a.file_url)?.file_url || "";

    const brandRules = allAssets
      .filter((a) => a.type === "rules" && a.content)
      .map((a) => a.content!)
      .join("\n");

    const isDark = style === "dark";
    const colorScheme = isDark
      ? "dark background (#0F0F14), champagne gold accents (#C5A96A), rich contrast, luxury mood"
      : "warm off-white background (#F8F4EF), dark gray details, champagne gold accents (#C5A96A), editorial softness";

    // Build the image input array for gpt-image-1
    const imageInputs: Array<{ type: string; image_url?: string; detail?: string }> = [];

    // Add product image
    if (productImageUrl) {
      const b64 = await fetchImageAsBase64(productImageUrl);
      if (b64) {
        imageInputs.push({ type: "input_image", image_url: `data:image/png;base64,${b64}`, detail: "high" });
        console.log("Added product image input");
      }
    }

    // Add logo
    if (logoUrl) {
      const b64 = await fetchImageAsBase64(logoUrl);
      if (b64) {
        imageInputs.push({ type: "input_image", image_url: `data:image/png;base64,${b64}`, detail: "high" });
        console.log("Added logo image input");
      }
    }

    // Add reference images (max 4)
    for (const refUrl of referenceUrls.slice(0, 4)) {
      const b64 = await fetchImageAsBase64(refUrl);
      if (b64) {
        imageInputs.push({ type: "input_image", image_url: `data:image/png;base64,${b64}`, detail: "low" });
      }
    }
    if (imageInputs.length > 2) {
      console.log(`Added ${imageInputs.length - 2} reference images`);
    }

    const imagePrompt = [
      `Create a COMPLETE, ready-to-publish Instagram post image (1080x1080) for SOLLARIS, a premium Brazilian jewelry brand.`,
      ``,
      `THEME: ${prompt}`,
      `STYLE: ${colorScheme}. Luxury editorial aesthetic.`,
      ``,
      productInfo ? `HERO PRODUCT (from attached photo): ${productInfo}. The real product must be visible and central.` : "",
      logoUrl ? `Use the attached official logo only as a subtle brand mark if it can be reproduced faithfully.` : "",
      ``,
      referenceUrls.length > 0 ? [
        `REFERENCE IMAGES (CRITICAL — FOLLOW CLOSELY):`,
        `The attached reference images define the EXACT visual direction. You MUST replicate:`,
        `- If references show PEOPLE/MODELS wearing jewelry → include a person/model wearing the product`,
        `- If references show lifestyle scenes → create a similar lifestyle scene`,
        `- If references show close-up product shots → create a similar close-up`,
        `- Replicate the SAME type of composition, framing, color palette, lighting, energy level, and vibe`,
        `- The references are NOT just mood inspiration — they are the TEMPLATE for what the output should look like`,
        `- Match the level of vibrancy, warmth, human presence, and editorial quality shown in the references`,
      ].join("\n") : "",
      ``,
      `CRITICAL TEXT RULES:`,
      `- ABSOLUTELY NO caption text, headlines, slogans, CTA, body copy, labels, prices, or any text on the image`,
      `- ABSOLUTELY NO letters, phrases, numbers, characters, or fake typography`,
      `- The art communicates only through visuals — composition, product, people, light, texture`,
      ``,
      `DESIGN RULES:`,
      `- Professional editorial photography / graphic design, ready to post`,
      `- Magazine-quality composition with generous negative space`,
      `- No clutter, no emojis, no generic stock-photo feel`,
      brandRules ? `BRAND GUIDELINES: ${brandRules.slice(0, 300)}` : "",
    ].filter(Boolean).join("\n");

    console.log(`Generating with gpt-image-1, ${imageInputs.length} visual inputs, style: ${style}, text-on-image disabled`);

    // Build the request body for OpenAI Images API
    const requestBody: Record<string, unknown> = {
      model: "gpt-image-1",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
    };

    // If we have image inputs, use the chat completions endpoint with image generation
    let imageBase64: string | undefined;

    if (imageInputs.length > 0) {
      // Use responses API for multimodal image generation
      const content: Array<Record<string, unknown>> = [
        { type: "text", text: imagePrompt },
      ];
      for (const img of imageInputs) {
        content.push({
          type: "image_url",
          image_url: { url: img.image_url, detail: img.detail || "auto" },
        });
      }

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

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI responses API error:", response.status, errText);

        if (response.status === 429) return jsonError(429, "Limite de requisições atingido. Tente novamente em alguns segundos.");
        if (response.status === 402 || response.status === 400) {
          // Fallback to simple image generation without references
          console.log("Falling back to simple gpt-image-1 generation...");
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

          if (!fallbackRes.ok) {
            const fbErr = await fallbackRes.text();
            console.error("Fallback error:", fallbackRes.status, fbErr);
            return jsonError(500, "Erro ao gerar imagem. Tente novamente.");
          }

          const fbData = await fallbackRes.json();
          imageBase64 = fbData.data?.[0]?.b64_json;
          if (!imageBase64 && fbData.data?.[0]?.url) {
            const downloaded = await fetchImageAsBase64(fbData.data[0].url);
            if (downloaded) imageBase64 = downloaded;
          }
        } else {
          return jsonError(500, "Erro ao gerar imagem. Tente novamente.");
        }
      } else {
        const data = await response.json();
        // Extract image from responses API output
        const output = data.output || [];
        for (const item of output) {
          if (item.type === "image_generation_call" && item.result) {
            imageBase64 = item.result;
            break;
          }
        }
        if (!imageBase64) {
          // Try alternate response format
          for (const item of output) {
            if (item.content) {
              for (const c of item.content) {
                if (c.type === "image" && c.image_url?.url) {
                  const url = c.image_url.url;
                  if (url.startsWith("data:")) {
                    imageBase64 = url.split(",")[1];
                  } else {
                    imageBase64 = await fetchImageAsBase64(url) || undefined;
                  }
                  break;
                }
              }
            }
          }
        }
        if (!imageBase64) {
          console.error("No image in responses API output:", JSON.stringify(data).slice(0, 500));
        }
      }
    }

    // If no image yet, try simple generation
    if (!imageBase64) {
      console.log("Using simple gpt-image-1 generation...");
      const response = await fetch("https://api.openai.com/v1/images/generations", {
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

      if (!response.ok) {
        const errText = await response.text();
        console.error("gpt-image-1 error:", response.status, errText);

        if (response.status === 429) return jsonError(429, "Limite de requisições atingido.");

        // Final fallback: dall-e-3
        console.log("Falling back to dall-e-3...");
        const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: imagePrompt.slice(0, 4000),
            n: 1,
            size: "1024x1024",
            quality: "hd",
          }),
        });

        if (!dalleRes.ok) {
          const dErr = await dalleRes.text();
          console.error("DALL-E 3 error:", dalleRes.status, dErr);
          return jsonError(500, "Erro ao gerar imagem. Tente novamente.");
        }

        const dalleData = await dalleRes.json();
        const dalleUrl = dalleData.data?.[0]?.url;
        if (dalleUrl) {
          imageBase64 = await fetchImageAsBase64(dalleUrl) || undefined;
        }
        if (!imageBase64) {
          return jsonError(500, "Nenhuma imagem foi gerada.");
        }
      } else {
        const data = await response.json();
        imageBase64 = data.data?.[0]?.b64_json;
        if (!imageBase64 && data.data?.[0]?.url) {
          imageBase64 = await fetchImageAsBase64(data.data[0].url) || undefined;
        }
      }
    }

    if (!imageBase64) {
      return jsonError(500, "Nenhuma imagem foi gerada. Tente novamente.");
    }

    // Upload to storage
    const imageBytes = decodeBase64(imageBase64);
    const fileName = `posts/${Date.now()}-instagram-${style}.png`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return jsonOk({ image_url: `data:image/png;base64,${imageBase64}` });
    }

    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(fileName);

    return jsonOk({ image_url: publicUrl.publicUrl, style });
  } catch (e) {
    console.error("generate-post-image error:", e);
    return jsonError(500, e instanceof Error ? e.message : "Erro desconhecido");
  }
});
