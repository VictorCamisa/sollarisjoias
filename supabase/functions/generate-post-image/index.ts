import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type BrandAsset = {
  type: string;
  title: string;
  content?: string | null;
  file_url?: string | null;
};

type GenerationDirectives = {
  referencesAreStyleOnly?: boolean;
  requireSelectedProductFidelity?: boolean;
  requireOfficialLogoFidelity?: boolean;
  adaptationTarget?: string;
};

type VisualInput = {
  fileName: string;
  kind: "product" | "logo" | "reference";
  label: string;
  url: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const platformFormats: Record<string, { label: string; size: string }> = {
  Instagram: { label: "1080x1080 square (1:1)", size: "1024x1024" },
  TikTok: { label: "1080x1920 vertical (9:16)", size: "1024x1792" },
  Facebook: { label: "1200x630 landscape (1.91:1)", size: "1792x1024" },
  WhatsApp: { label: "1080x1080 square (1:1)", size: "1024x1024" },
  LinkedIn: { label: "1200x627 landscape (1.91:1)", size: "1792x1024" },
};

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function extractUrlsFromText(text?: string) {
  if (!text) return [];
  return Array.from(text.matchAll(/https?:\/\/[^\s)]+/g), (match) => match[0]);
}

function buildBrandSummary(assets: BrandAsset[]) {
  return assets
    .map((asset) => {
      const parts = [`[${asset.type.toUpperCase()}] ${asset.title}`];
      if (asset.content) parts.push(asset.content.trim());
      if (asset.file_url) parts.push(`Arquivo visual: ${asset.file_url}`);
      return parts.join(" — ");
    })
    .join("\n");
}

function decodeBase64(base64: string) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function dedupeVisualInputs(inputs: VisualInput[]) {
  return inputs.reduce<VisualInput[]>((acc, asset) => {
    const key = `${asset.kind}-${asset.url}`;
    if (!acc.some((item) => `${item.kind}-${item.url}` === key)) acc.push(asset);
    return acc;
  }, []);
}

async function fetchImageInput(url: string, name: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/png";
    if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) return null;

    const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
    const bytes = await response.arrayBuffer();

    return {
      blob: new Blob([bytes], { type: contentType }),
      filename: `${name}.${extension}`,
      contentType,
    };
  } catch (error) {
    console.error("Failed to fetch input image", url, error);
    return null;
  }
}

async function loadActiveBrandAssets(supabase: any) {
  const { data, error } = await supabase
    .from("brand_assets")
    .select("type, title, content, file_url")
    .eq("is_active", true)
    .order("type");

  if (error) {
    console.error("Failed to load active brand assets", error);
    return [] as BrandAsset[];
  }

  return (data || []) as BrandAsset[];
}

async function requestImageEdit(apiKey: string, prompt: string, size: string, imageInputs: Array<{ blob: Blob; filename: string }>) {
  const formData = new FormData();
  formData.append("model", "gpt-image-1");
  formData.append("prompt", prompt);
  formData.append("size", size);
  formData.append("n", "1");
  formData.append("response_format", "b64_json");

  imageInputs.forEach((input) => {
    formData.append("image[]", input.blob, input.filename);
  });

  return fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });
}

async function requestImageGeneration(apiKey: string, prompt: string, size: string, model: string) {
  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });
}

function extractGeneratedImagePayload(data: any) {
  const item = data?.data?.[0];
  if (!item) return null;

  if (item.b64_json) {
    return {
      imageUrl: `data:image/png;base64,${item.b64_json}`,
      bytes: decodeBase64(item.b64_json),
      contentType: "image/png",
      extension: "png",
    };
  }

  return null;
}

async function loadImageInputs(visualInputs: VisualInput[]) {
  const loaded = await Promise.all(
    visualInputs.map(async (asset) => {
      const input = await fetchImageInput(asset.url, asset.fileName);
      return input ? { ...asset, ...input } : null;
    })
  );

  return loaded.filter(Boolean) as Array<VisualInput & { blob: Blob; filename: string }>;
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

    const storedBrandAssets = await loadActiveBrandAssets(supabase);
    const mergedBrandAssets = [
      ...((Array.isArray(brandAssets) ? brandAssets : []) as BrandAsset[]),
      ...storedBrandAssets,
    ].reduce<BrandAsset[]>((acc, asset) => {
      const key = `${asset.type}-${asset.title}-${asset.file_url || ""}-${asset.content || ""}`;
      if (!acc.some((item) => `${item.type}-${item.title}-${item.file_url || ""}-${item.content || ""}` === key)) {
        acc.push(asset);
      }
      return acc;
    }, []);

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

    const effectiveFormat = platformFormats[platform] || platformFormats.Instagram;

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

    const logoAssets = mergedBrandAssets.filter((asset) => asset.type === "logo" && asset.file_url);
    const referenceAssets = mergedBrandAssets.filter((asset) => asset.type === "reference" && asset.file_url);
    const fallbackReferenceUrls = extractUrlsFromText(brandContext);

    const coreVisualInputs = dedupeVisualInputs([
      ...(productImageUrl ? [{ url: productImageUrl, label: "produto real selecionado", fileName: "product-reference", kind: "product" as const }] : []),
      ...logoAssets.slice(0, 1).map((asset, index) => ({ url: asset.file_url!, label: `logo oficial ${index + 1}`, fileName: `brand-logo-${index + 1}`, kind: "logo" as const })),
    ]);
    const referenceVisualInputs = dedupeVisualInputs([
      ...referenceAssets.slice(0, 2).map((asset, index) => ({ url: asset.file_url!, label: `referência de estilo ${index + 1}`, fileName: `brand-reference-${index + 1}`, kind: "reference" as const })),
      ...fallbackReferenceUrls.slice(0, 1).map((url, index) => ({ url, label: `referência adicional ${index + 1}`, fileName: `brand-extra-${index + 1}`, kind: "reference" as const })),
    ]);
    const combinedVisualInputs = dedupeVisualInputs([...coreVisualInputs, ...referenceVisualInputs]).slice(0, 4);
    const hasMandatorySourceAssets = coreVisualInputs.length > 0;

    const inputGuide = combinedVisualInputs.length
      ? combinedVisualInputs.map((asset, index) => `Imagem ${index + 1}: ${asset.label} [${asset.kind}]`).join("\n")
      : "Nenhuma imagem de apoio foi enviada.";
    const productGuide = coreVisualInputs.some((asset) => asset.kind === "product")
      ? "Use a foto do produto como fonte de verdade visual absoluta. Preserve desenho, proporções, pedras, acabamento e categoria exatos."
      : "Nenhum produto real foi enviado — não invente uma peça específica se a composição puder ser mais abstrata/editorial.";
    const logoGuide = coreVisualInputs.some((asset) => asset.kind === "logo")
      ? "Aplique a logo oficial enviada exatamente como está, de forma sutil e premium. Não redesenhe, não reescreva e não improvise tipografia."
      : "Se não houver logo enviada, não invente marca nominativa na arte.";
    const referenceGuide = referenceVisualInputs.length
      ? `As referências visuais representam POSTS QUE O CLIENTE GOSTOU. Use apenas o padrão visual: composição, ritmo, iluminação, recorte, densidade, direção de arte e sensação premium. Nunca copie literalmente o produto, a marca, o texto, a oferta ou o layout da referência. Adapte para ${generationDirectives.adaptationTarget || "SOLLARIS"}.\n${referenceContext || ""}`
      : "Sem referências de estilo adicionais.";

    const structuredBrandSummary = buildBrandSummary(mergedBrandAssets);

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
Format: ${effectiveFormat.label}
Theme: ${prompt}
${productContext ? `Product: ${productContext}` : ""}
${caption ? `Caption context: ${caption.slice(0, 200)}` : ""}

═══ ASSET PRIORITY (NON-NEGOTIABLE) ═══
1. REAL PRODUCT PHOTO: ${productGuide}
2. OFFICIAL LOGO: ${logoGuide}
3. STYLE REFERENCES: ${referenceGuide}
4. BRAND RULES: follow brand assets and written rules strictly.

═══ DESIGN RULES (CRITICAL) ═══
1. COMPOSITION: Use the rule of thirds. Generous negative space. Asymmetric balance. The selected real product must be the hero and remain unmistakably recognizable from the provided source photo.
2. PRODUCT FIDELITY: Never replace the selected jewelry with another piece. Do not invent a different stone, shape, material, clasp, chain, thickness, setting or silhouette.
3. BRAND ACCURACY: If a logo reference image is provided, use that exact logo as the brand mark. Do not redraw it, rewrite it, distort it, or invent typography.
4. REFERENCES ARE STYLE-ONLY: Reference posts are art-direction inputs, not content to replicate. Borrow visual language only; never copy their exact layout, product, brand or text.
5. TYPOGRAPHY: Avoid extra copy on the artwork. If there is a logo input, it is the only text allowed on the image. No fake pricing labels. No gibberish text. No placeholder words.
4. LAYOUT: Clean geometric structure. Consider thin gold lines, editorial framing, elegant spacing, premium luxury composition.
5. PRODUCT PHOTOGRAPHY STYLE: If jewelry is shown, it must feel like a real premium campaign using the supplied product image as the visual truth source.
6. TEXTURE: Subtle grain or noise for editorial feel. No plastic 3D toy aesthetics. No random abstract circles unless clearly supported by the references.
7. NO CLUTTER: No emojis, no busy patterns, no stock-photo feel, no generic templates, no invented symbols unrelated to jewelry branding.
8. MODERN: This should look like a premium fashion/jewelry campaign, not AI art.
9. PROFESSIONAL STANDARD: The final result must look like a luxury agency deliverable ready for a real brand feed, not an experiment.

═══ REFERENCE AESTHETIC ═══
Think: Bottega Veneta campaign simplicity + Bulgari product elegance + Apple's clean design language. The post should make someone stop scrolling.

═══ PROVIDED VISUAL INPUTS ═══
${inputGuide}

═══ EXTRA BRAND GUIDELINES (from client — follow strictly) ═══
${[structuredBrandSummary, brandContext].filter(Boolean).join("\n") || "Use SOLLARIS premium luxury branding with strict consistency."}

OUTPUT: One polished, scroll-stopping post image. Magazine-quality. Ready to publish.`;

    let response: Response | null = null;
    const editAttemptSets = [combinedVisualInputs, coreVisualInputs, coreVisualInputs.filter((asset) => asset.kind === "product")]
      .filter((attempt, index, all) => attempt.length > 0 && all.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(attempt)) === index);

    for (const attempt of editAttemptSets) {
      const loadedInputs = await loadImageInputs(attempt);
      if (!loadedInputs.length) continue;

      response = await requestImageEdit(
        OPENAI_API_KEY,
        imagePrompt,
        effectiveFormat.size,
        loadedInputs.map((input) => ({ blob: input.blob, filename: input.filename }))
      );

      if (response.ok) break;

      const failedText = await response.text();
      console.error("AI image edit error:", response.status, failedText, attempt.map((asset) => asset.label));

      if (response.status === 429) return jsonError(429, "Limite de requisições atingido. Tente novamente em alguns segundos.");
      if (response.status === 402) return jsonError(402, "Créditos insuficientes. Adicione créditos na sua conta.");

      response = null;
    }

    if (!response) {
      if (hasMandatorySourceAssets || generationDirectives.requireSelectedProductFidelity || generationDirectives.requireOfficialLogoFidelity) {
        return jsonError(422, "Não consegui aplicar com fidelidade o produto real e a logo oficial nesta tentativa. Ajustei o fluxo para priorizar isso; tente novamente com a referência e o produto selecionado.");
      }

      response = await requestImageGeneration(OPENAI_API_KEY, imagePrompt, effectiveFormat.size, "gpt-image-1");
    }

    if (!response.ok) {
      const generationErrorText = await response.text();
      console.error("AI image generation error:", response.status, generationErrorText);

      if (response.status === 429) return jsonError(429, "Limite de requisições atingido. Tente novamente em alguns segundos.");
      if (response.status === 402) return jsonError(402, "Créditos insuficientes. Adicione créditos na sua conta.");

      response = await requestImageGeneration(OPENAI_API_KEY, imagePrompt, effectiveFormat.size, "dall-e-3");
      if (!response.ok) {
        const fallbackErrorText = await response.text();
        console.error("Fallback AI image error:", response.status, fallbackErrorText);
        return jsonError(500, "Erro ao gerar imagem");
      }
    }

    const data = await response.json();
    const generatedImage = extractGeneratedImagePayload(data);
    const imageData = generatedImage?.imageUrl || null;

    if (!imageData) {
      return jsonError(500, "Nenhuma imagem foi gerada. Tente novamente.");
    }

    // Upload to storage
    const fileExtension = generatedImage?.extension || "png";
    const fileName = `posts/${Date.now()}-${platform.toLowerCase()}-${style}.${fileExtension}`;
    const imageBytes = generatedImage?.bytes || decodeBase64(imageData.replace(/^data:image\/\w+;base64,/, ""));

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageBytes, { contentType: generatedImage?.contentType || "image/png", upsert: true });

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
