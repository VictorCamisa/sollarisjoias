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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const productDetails = [
      productName,
      material ? `material ${material}` : null,
      banho ? `banho ${banho}` : null,
      pedra ? `pedra ${pedra}` : null,
    ].filter(Boolean).join(", ");

    const BRAND_PRESERVE =
      "ABSOLUTE RULE: This is a PHOTO RETOUCH task, NOT a new design. Preserve the original jewelry exactly: same silhouette, same gemstone color and cut, same chain pattern, same metal finish, same proportions, same orientation, same prongs, same visible details. Do not redesign, do not restyle, do not change the product structure. Only improve the photo treatment, background and lighting.";

    const stylePrompts: Record<string, string> = {
      catalog:
        `${BRAND_PRESERVE} Replace only the background with a seamless obsidian black backdrop (#0A0A0B). Use luxury studio lighting, soft frontal light, subtle champagne highlights, clean premium jewelry e-commerce aesthetic, centered composition, photorealistic. No text, no logo, no watermark, no typography.`,
      mockup:
        `${BRAND_PRESERVE} Keep the exact same jewelry piece and place it in a luxury editorial product scene with obsidian black environment, subtle reflective surface, dramatic warm champagne side light, photorealistic, premium fashion jewelry direction. No text, no logo, no watermark, no typography.`,
      lifestyle:
        `${BRAND_PRESERVE} Keep the exact same jewelry piece and place it in a dark editorial lifestyle scene with obsidian black mood, soft warm highlights, premium fashion styling, but the jewelry must remain the hero and visually identical to the input. Photorealistic. No text, no logo, no watermark, no typography.`,
    };

    const styleDesc = stylePrompts[style] || stylePrompts.catalog;
    const finalPrompt = productDetails
      ? `${styleDesc}\n\nProduct reference: ${productDetails}.`
      : styleDesc;

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
              { type: "text", text: finalPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
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
      if (aiRes.status === 402) return jsonError(402, "Créditos de IA insuficientes no workspace.");
      return jsonError(500, `Falha ao processar a foto (${aiRes.status}).`);
    }

    const aiData = await aiRes.json();
    const generatedUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!generatedUrl) return jsonError(500, "Nenhuma imagem foi gerada. Tente novamente.");

    let imageBase64: string | undefined;
    if (generatedUrl.startsWith("data:image/")) {
      const base64Part = generatedUrl.split(",")[1];
      imageBase64 = base64Part;
    } else {
      const fetched = await fetchImageBytes(generatedUrl);
      if (fetched) {
        let bin = "";
        for (let i = 0; i < fetched.bytes.length; i++) bin += String.fromCharCode(fetched.bytes[i]);
        imageBase64 = btoa(bin);
      }
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
