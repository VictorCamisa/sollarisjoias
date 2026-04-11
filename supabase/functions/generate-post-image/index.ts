import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BrandAsset = { type: string; title: string; content?: string | null; file_url?: string | null };

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      prompt,
      platform,
      productId,
      caption,
      style = "dark",
      brandAssets = [],
      referenceContext,
      generationDirectives = {},
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const isDark = style === "dark";

    // Collect visual inputs
    const referenceUrls = allAssets
      .filter((a) => a.type === "reference" && a.file_url)
      .slice(0, 4)
      .map((a) => a.file_url!);

    const logoUrl = allAssets.find((a) => a.type === "logo" && a.file_url)?.file_url || "";

    const brandRules = allAssets
      .filter((a) => a.type === "rules" && a.content)
      .map((a) => a.content!)
      .join("\n");

    // Build the prompt for complete post composition
    const colorScheme = isDark
      ? "Fundo preto mate (#0F0F14), textos em branco e dourado champagne (#C5A96A)"
      : "Fundo off-white quente (#F8F4EF), textos em cinza escuro e dourado champagne (#C5A96A)";

    const textInstruction = caption
      ? `Inclua este texto na arte de forma elegante e editorial: "${caption.slice(0, 200)}"`
      : "Inclua uma frase curta, aspiracional e sofisticada sobre o produto na arte";

    const promptLines: string[] = [
      `Crie uma arte COMPLETA para Instagram post (1080x1080) da marca SOLLARIS, joalheria premium brasileira.`,
      ``,
      `TEMA DO POST: ${prompt}`,
      ``,
      `ESTILO VISUAL: ${colorScheme}`,
      ``,
      `COMPOSIÇÃO OBRIGATÓRIA:`,
      `- A imagem deve ser uma ARTE FINALIZADA, pronta para publicar no Instagram`,
      `- Layout profissional de design gráfico, como um post de marca de luxo (Cartier, Bottega Veneta, Tiffany)`,
      `- ${textInstruction}`,
      `- O nome "SOLLARIS" deve aparecer na arte em tipografia limpa, caixa alta, espaçamento amplo`,
    ];

    if (productInfo) {
      promptLines.push(`- PRODUTO HERO: ${productInfo}`);
      promptLines.push(`- O produto da foto anexada deve ser o elemento central da composição`);
    }

    if (referenceUrls.length > 0) {
      promptLines.push(`- Use as imagens de referência anexadas como INSPIRAÇÃO DE ESTILO (layout, tipografia, composição, mood). Adapte para a identidade SOLLARIS.`);
    }

    promptLines.push(
      ``,
      `REGRAS DE DESIGN:`,
      `- Estética minimalista de luxo, editorial`,
      `- Regra dos terços, espaço negativo generoso`,
      `- Tipografia elegante (serif para destaque, sans-serif para corpo)`,
      `- Sem clutter, sem emojis, sem templates genéricos`,
      `- Qualidade de revista, pronto para publicar`,
    );

    if (brandRules) {
      promptLines.push(``, `DIRETRIZES DA MARCA: ${brandRules.slice(0, 400)}`);
    }

    const imagePrompt = promptLines.join("\n");

    // Build multimodal content with image inputs
    const content: Array<any> = [{ type: "text", text: imagePrompt }];

    // Add product image
    if (productImageUrl) {
      content.push({
        type: "image_url",
        image_url: { url: productImageUrl },
      });
      console.log("Added product image");
    }

    // Add logo
    if (logoUrl) {
      content.push({
        type: "image_url",
        image_url: { url: logoUrl },
      });
      console.log("Added logo image");
    }

    // Add reference images (max 4)
    for (const refUrl of referenceUrls.slice(0, 4)) {
      content.push({
        type: "image_url",
        image_url: { url: refUrl },
      });
    }
    if (referenceUrls.length > 0) {
      console.log(`Added ${Math.min(referenceUrls.length, 4)} reference images`);
    }

    console.log(`Generating with Gemini image model, ${content.length - 1} visual inputs, style: ${style}`);

    // Call Lovable AI Gateway with Gemini image model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini image error:", response.status, errText);

      if (response.status === 429) return jsonError(429, "Limite de requisições atingido. Tente novamente em alguns segundos.");
      if (response.status === 402) return jsonError(402, "Créditos insuficientes. Adicione créditos no workspace.");

      return jsonError(500, "Erro ao gerar imagem. Tente novamente.");
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return jsonError(500, "Nenhuma imagem foi gerada. Tente novamente com um prompt diferente.");
    }

    // Extract base64 from data URL
    let imageBase64: string;
    if (imageData.startsWith("data:image/")) {
      imageBase64 = imageData.split(",")[1];
    } else {
      imageBase64 = imageData;
    }

    // Upload to storage
    const imageBytes = decodeBase64(imageBase64);
    const fileName = `posts/${Date.now()}-instagram-${style}.png`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return data URL as fallback
      return new Response(JSON.stringify({ image_url: imageData.startsWith("data:") ? imageData : `data:image/png;base64,${imageBase64}` }), {
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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
