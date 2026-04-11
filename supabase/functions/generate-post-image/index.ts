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
    const { prompt, platform, productId, caption, style = "dark", brandContext } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

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

        productImageUrl = product.foto_lifestyle || product.foto_frontal || (product.images && product.images[0]) || "";
      }
    }

    // Platform format
    const platformFormats: Record<string, string> = {
      Instagram: "1080x1080 square (1:1)",
      TikTok: "1080x1920 vertical (9:16)",
      Facebook: "1200x630 landscape (1.91:1)",
      WhatsApp: "1080x1080 square (1:1)",
      LinkedIn: "1200x627 landscape (1.91:1)",
    };
    const format = platformFormats[platform] || "1080x1080 square (1:1)";

    // Style-specific design tokens
    const isDark = style === "dark";
    const styleDirective = isDark
      ? `DARK MODE — "Obsidiana":
- Background: Deep matte black (#0F0F14) or very dark charcoal gradient
- Text: White (#FFFFFF) for headlines, champagne gold (#C5A96A) for accents and highlights
- Accents: Thin champagne gold lines, subtle gold foil textures, gold borders
- Mood: Mysterious, editorial, dramatic — like a luxury magazine night edition
- Shadows: Deep, dramatic with subtle gold rim lighting on product`
      : `LIGHT MODE — "Champagne":
- Background: Warm off-white (#F8F4EF) or soft champagne cream gradient
- Text: Deep obsidian black (#0F0F14) for headlines, muted charcoal for body
- Accents: Champagne gold (#C5A96A) for decorative elements, thin gold lines
- Mood: Airy, luminous, refined — like a high-end bridal magazine
- Shadows: Soft, diffused, elegant natural lighting on product`;

    const imagePrompt = `You are a world-class graphic designer at a top luxury branding agency. Create a single, stunning social media post for SOLLARIS — a premium Brazilian jewelry brand.

═══ BRAND DNA ═══
Brand: SOLLARIS
Tagline: "Curadoria com Intenção"
Aesthetic: Ultra-modern minimalism meets editorial luxury. Think Celine × Cartier × Aesop.
Typography: Clean, modern sans-serif (like Futura, Didot, or similar). NO handwritten or script fonts. Always uppercase for brand name.
Logo treatment: "SOLLARIS" in elegant, wide-spaced uppercase letters — small, tasteful, never overwhelming.

═══ COLOR PALETTE & STYLE ═══
${styleDirective}

═══ POST SPECIFICATIONS ═══
Platform: ${platform}
Format: ${format}
Theme: ${prompt}
${productContext ? `Product: ${productContext}` : ""}
${caption ? `Caption context: ${caption.slice(0, 200)}` : ""}

═══ DESIGN RULES (CRITICAL) ═══
1. COMPOSITION: Use the rule of thirds. Generous negative space. Asymmetric balance. The product (if any) should be the hero — centered or slightly off-center with breathing room.
2. TYPOGRAPHY: Maximum 2 lines of text on the image. Product name in clean modern font. Price displayed elegantly (small, refined). NO paragraphs of text. Let the image speak.
3. LAYOUT: Clean geometric structure. Consider using thin gold lines as dividers or frames. Subtle grid alignment.
4. PRODUCT PHOTOGRAPHY STYLE: If showing jewelry, make it look like a professional still-life shoot — dramatic lighting, clean reflections, precise focus. The piece should glow.
5. TEXTURE: Subtle grain or noise for editorial feel. No glossy/plastic look. Matte sophistication.
6. BRAND MARK: "SOLLARIS" appears small at bottom or top — never as the main focal point. Wide letter-spacing.
7. NO CLUTTER: No emojis, no busy patterns, no stock-photo feel, no generic templates. Every element must have purpose.
8. MODERN: This should look like it belongs on the Instagram feed of a brand with 500K+ followers. Contemporary, not dated.

═══ REFERENCE AESTHETIC ═══
Think: Bottega Veneta campaign simplicity + Bulgari product elegance + Apple's clean design language. The post should make someone stop scrolling.

OUTPUT: One polished, scroll-stopping post image. Magazine-quality. Ready to publish.`;

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

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: typeof messages[0].content === "string" ? messages[0].content : messages[0].content[0].text,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
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
    const b64 = data.data?.[0]?.b64_json;
    const imageData = b64 ? `data:image/png;base64,${b64}` : null;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem foi gerada. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const fileName = `posts/${Date.now()}-${platform.toLowerCase()}-${style}.png`;
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ image_url: imageData }), {
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
