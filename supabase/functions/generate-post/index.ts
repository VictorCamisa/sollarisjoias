import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a copywriter oficial da SOLLARIS JOIAS — uma marca de joias premium brasileira que segue a filosofia "Curadoria com Intenção". 

IDENTIDADE DA MARCA:
- Nome: SOLLARIS (sempre em maiúsculas)
- Filosofia: "Curadoria, não varejo" — cada peça é selecionada com intenção e significado
- Público: Classes A e B, mulheres sofisticadas que valorizam exclusividade
- Tom de voz: Sofisticado, editorial, exclusivo, como uma revista de luxo
- Cores da marca: Preto Obsidiana, Branco, Dourado Champagne
- Valores: Autenticidade, elegância atemporal, empoderamento feminino, exclusividade

DIRETRIZES PARA POSTS:
1. Nunca use linguagem genérica ou excessivamente comercial ("compre agora!", "promoção imperdível!")
2. Use linguagem aspiracional e emocional — venda experiências e sentimentos, não apenas produtos
3. Inclua emojis com moderação e sofisticação (máximo 3-4 por post)
4. Sempre inclua hashtags relevantes e de marca (#SOLLARIS #SollarisJoias)
5. Adapte o tom para cada plataforma mantendo a essência da marca
6. Mencione materiais e acabamentos quando relevante (banho de ouro, pedras naturais, etc.)
7. Use frases curtas e impactantes, com pausas estratégicas
8. Inclua sempre um CTA sutil e elegante

FORMATO DE RESPOSTA (JSON):
{
  "caption": "texto completo da legenda/post",
  "hashtags": ["lista", "de", "hashtags"],
  "platform_tips": "dicas específicas para a plataforma escolhida",
  "visual_suggestion": "sugestão de visual/foto para acompanhar o post",
  "best_time": "melhor horário sugerido para postar"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, platform, tone, brandContext, productContext, referenceContext, generationDirectives } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const sections = [
      `Crie um post para ${platform || "Instagram"} com o seguinte tema/ideia: "${prompt}".`,
      tone ? `Tom desejado: ${tone}.` : null,
      productContext
        ? `PRODUTO REAL DISPONÍVEL:\n${productContext}\nUse apenas essas informações factuais na legenda.`
        : "Se nenhum produto real foi informado, não invente preço, material, pedra ou acabamento.",
      generationDirectives?.requireSelectedProductFidelity
        ? "O produto selecionado é obrigatório. A legenda precisa claramente falar dessa peça real, sem trocar categoria, pedra, banho, material ou benefício."
        : null,
      referenceContext
        ? `REFERÊNCIAS VISUAIS DO CLIENTE:\n${referenceContext}\nUse essas referências apenas como direção criativa (ritmo, enquadramento, atmosfera, linguagem editorial). Nunca copie literalmente texto, marca, produto, promessa ou layout.`
        : null,
      generationDirectives?.requireOfficialLogoFidelity
        ? "Considere que a arte final precisa respeitar a logo oficial da SOLLARIS. Não sugira mudar nome, tipografia ou identidade verbal."
        : null,
      brandContext
        ? `DIRETRIZES EXTRAS DA MARCA (fornecidas pelo cliente — siga rigorosamente):\n${brandContext}`
        : null,
      `Prioridades obrigatórias:\n- respeitar o branding da SOLLARIS com precisão\n- adaptar qualquer referência para SOLLARIS, nunca copiar\n- soar editorial, sofisticado e premium\n- evitar clichês de varejo, urgência barata e linguagem genérica\n- não inventar informações\n- responder APENAS com o JSON no formato especificado`,
    ].filter(Boolean);

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
              description: "Generate a branded social media post for SOLLARIS JOIAS",
              parameters: {
                type: "object",
                properties: {
                  caption: { type: "string", description: "Full post caption/text" },
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
      // Fallback: try to parse content as JSON
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
