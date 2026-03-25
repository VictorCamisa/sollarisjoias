import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, platform, productId, caption } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product data if provided
    let productContext = "";
    let productImageUrl = "";
    if (productId) {
      const { data: product } = await supabase
        .from("products")
        .select("name, price, original_price, material, banho, pedra, foto_frontal, foto_lifestyle, images")
        .eq("id", productId)
        .single();

      if (product) {
        const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price);
        const origPrice = product.original_price
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.original_price)
          : null;

        productContext = `
Produto: ${product.name}
Preço: ${price}${origPrice ? ` (de ${origPrice})` : ""}
${product.material ? `Material: ${product.material}` : ""}
${product.banho ? `Banho: ${product.banho}` : ""}
${product.pedra ? `Pedra: ${product.pedra}` : ""}`;

        // Pick best image
        productImageUrl = product.foto_lifestyle || product.foto_frontal || (product.images && product.images[0]) || "";
      }
    }

    // Determine aspect ratio based on platform
    const platformFormats: Record<string, string> = {
      Instagram: "1080x1080 square",
      TikTok: "1080x1920 vertical 9:16",
      Facebook: "1200x630 landscape",
      WhatsApp: "1080x1080 square",
      LinkedIn: "1200x627 landscape",
    };
    const format = platformFormats[platform] || "1080x1080 square";

    const imagePrompt = `Create a luxurious, elegant social media post image for a premium Brazilian jewelry brand called SOLLARIS.

BRAND IDENTITY:
- Colors: Black obsidian background, champagne gold accents, white text
- Style: Editorial luxury, like a high-end fashion magazine
- Philosophy: "Curadoria com Intenção" (Curation with Intention)
- Aesthetic: Sophisticated, minimal, premium

POST CONTEXT:
- Platform: ${platform} (${format})
- Theme: ${prompt}
${productContext ? `- Product info: ${productContext}` : ""}
${caption ? `- Caption context: ${caption.slice(0, 200)}` : ""}

DESIGN REQUIREMENTS:
- Elegant black/dark background with gold accents
- Brand name "SOLLARIS" subtly integrated (small, elegant, gold)
- If there's a product, show a beautiful jewelry piece as the hero element
- Minimalist luxury typography with the product name and price displayed elegantly
- High-end editorial feel — like a Cartier or Bulgari ad
- Clean composition with generous negative space
- No cluttered elements — sophistication through simplicity
- The image should look like a professional designer created it
- Include subtle gold border or frame elements
${productContext ? `- Feature the product name and price: ${productContext.split("\n").filter(l => l.trim()).join(", ")}` : ""}

OUTPUT: A single beautiful post-ready image. Professional quality. Magazine-level design.`;

    // Build messages for image generation
    const messages: any[] = [
      {
        role: "user",
        content: productImageUrl
          ? [
              { type: "text", text: imagePrompt },
              { type: "image_url", image_url: { url: productImageUrl } },
            ]
          : imagePrompt,
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI image error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar imagem" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const fileName = `posts/${Date.now()}-${platform.toLowerCase()}.png`;
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return base64 as fallback
      return new Response(JSON.stringify({ image_url: imageData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(fileName);

    return new Response(JSON.stringify({ image_url: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
