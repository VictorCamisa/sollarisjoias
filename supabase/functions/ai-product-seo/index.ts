import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é especialista em SEO para e-commerce de joias e bijuterias no Brasil.

Sua tarefa é analisar os dados de um produto e retornar sugestões de otimização para:
1. Nome do produto — deve ser descritivo, conter palavras-chave de busca, e ter entre 40-70 caracteres
2. Descrição — deve ser comercial, emocional, e rich text com keywords naturais
3. Tags SEO — termos de busca que clientes reais usam no Google, Shopee, Instagram

REGRAS:
- Use português brasileiro
- Nomes devem conter: tipo de peça + material/banho + característica marcante (ex: "Brinco Argola Dourado Zircônia Ouro 18k")
- Descriptions: 2-3 frases, primeira frase com a keyword principal, linguagem aspiracional
- Tags SEO: 8-12 termos, mistura de genéricos e específicos, separados por vírgula
- Score de qualidade: 0-100 baseado em completude dos dados originais
- Se o nome original já é bom, mantenha-o e explique no campo de observações
- NUNCA invente materiais, pedras ou características que não foram informados

FORMATO de resposta: JSON estrito com os campos abaixo.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, description, category, material, banho, pedra, tags, price } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const productInfo = [
      `Nome atual: "${name || "não informado"}"`,
      category ? `Categoria: ${category}` : null,
      price ? `Preço: R$ ${price}` : null,
      material ? `Material: ${material}` : null,
      banho ? `Banho/Acabamento: ${banho}` : null,
      pedra ? `Pedra: ${pedra}` : null,
      tags ? `Tags atuais: ${tags}` : null,
      description ? `Descrição atual: "${description}"` : null,
    ].filter(Boolean).join("\n");

    const userMessage = `Analise este produto de joias e otimize para SEO:\n\n${productInfo}\n\nRetorne as sugestões no formato JSON especificado.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "optimize_product_seo",
              description: "Return SEO optimizations for the jewelry product",
              parameters: {
                type: "object",
                properties: {
                  suggestedName: {
                    type: "string",
                    description: "Optimized product name (40-70 chars) with main keywords",
                  },
                  suggestedDescription: {
                    type: "string",
                    description: "Optimized product description (2-3 sentences, keyword-rich)",
                  },
                  seoTags: {
                    type: "string",
                    description: "8-12 SEO search terms comma-separated",
                  },
                  qualityScore: {
                    type: "number",
                    description: "Original data completeness score 0-100",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific improvements made and why",
                  },
                  nameChanged: {
                    type: "boolean",
                    description: "Whether the name was significantly changed",
                  },
                },
                required: ["suggestedName", "suggestedDescription", "seoTags", "qualityScore", "improvements", "nameChanged"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "optimize_product_seo" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar sugestões SEO" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "Resposta inválida da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-product-seo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
