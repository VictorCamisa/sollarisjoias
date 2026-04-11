import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a diretora criativa e copywriter da SOLLARIS JOIAS — marca de joias premium brasileira.

IDENTIDADE:
• Nome: SOLLARIS (sempre maiúsculas)
• Filosofia: "Curadoria com Intenção" — cada peça é selecionada com propósito
• Público: Mulheres sofisticadas, classes A/B, que valorizam exclusividade
• Tom: Sofisticado, editorial, como revista de luxo. Nunca genérico ou "vendedor"
• Valores: Autenticidade, elegância atemporal, empoderamento feminino

REGRAS DE COPY:
1. A legenda DEVE ser sobre o tema/ideia que o usuário pediu — siga o pedido fielmente
2. Se um produto real foi informado, a legenda fala DESSE produto específico (nome, material, pedra exatos)
3. Linguagem aspiracional e emocional — venda sentimentos, não features
4. Emojis: máximo 3, sofisticados (✨💎🤍), nunca 🔥🚨💥
5. Hashtags: sempre inclua #SOLLARIS #SollarisJoias + 3-5 relevantes
6. CTA sutil e elegante (nunca "COMPRE AGORA" ou "CORRE")
7. Frases curtas e impactantes, com pausas estratégicas
8. NUNCA invente dados do produto (preço, material, pedra) que não foram informados

FORMATO (JSON estrito):
{
  "caption": "legenda completa pronta para postar",
  "hashtags": ["lista", "de", "hashtags"],
  "platform_tips": "dica rápida para Instagram",
  "visual_suggestion": "sugestão de visual para a foto",
  "best_time": "melhor horário sugerido"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, platform, brandContext, productContext, referenceContext, generationDirectives } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Build a focused user message that prioritizes what the user actually asked
    const sections: string[] = [
      `PEDIDO DO CLIENTE: "${prompt}"`,
      `Plataforma: Instagram`,
    ];

    if (productContext) {
      sections.push(`PRODUTO SELECIONADO (use exatamente esses dados):\n${productContext}`);
    }

    if (generationDirectives?.requireSelectedProductFidelity) {
      sections.push("⚠️ OBRIGATÓRIO: A legenda DEVE falar especificamente deste produto. Não generalize nem troque por outro.");
    }

    if (referenceContext) {
      sections.push(`REFERÊNCIAS DE ESTILO (use apenas como inspiração de tom/ritmo, não copie conteúdo):\n${referenceContext}`);
    }

    if (brandContext) {
      sections.push(`DIRETRIZES DA MARCA:\n${brandContext}`);
    }

    sections.push("Responda APENAS com o JSON no formato especificado. A legenda deve seguir fielmente o pedido do cliente acima.");

    const userMessage = sections.join("\n\n");

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
              name: "generate_branded_post",
              description: "Generate a branded social media post for SOLLARIS JOIAS following the client's exact request",
              parameters: {
                type: "object",
                properties: {
                  caption: { type: "string", description: "Full post caption that directly addresses the client's request" },
                  hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags" },
                  platform_tips: { type: "string", description: "Platform-specific tips" },
                  visual_suggestion: { type: "string", description: "Visual/photo suggestion" },
                  best_time: { type: "string", description: "Best time to post" },
                },
                required: ["caption", "hashtags", "platform_tips", "visual_suggestion", "best_time"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_branded_post" } },
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
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar post" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let post;

    if (toolCall?.function?.arguments) {
      post = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        post = JSON.parse(jsonMatch[0]);
      } else {
        post = { caption: content, hashtags: ["#SOLLARIS", "#SollarisJoias"], platform_tips: "", visual_suggestion: "", best_time: "" };
      }
    }

    return new Response(JSON.stringify({ post }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
