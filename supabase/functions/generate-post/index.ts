import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a diretora criativa sênior e head de copy da SOLLARIS JOIAS — marca de joias premium brasileira com padrão de agência de luxo internacional.

IDENTIDADE DA MARCA:
• Nome: SOLLARIS (sempre em maiúsculas na legenda)
• Filosofia: "Curadoria com Intenção" — cada peça é escolhida com propósito e significado
• Público: Mulheres sofisticadas, classes A/B+, que valorizam exclusividade, autenticidade e estética
• Tom: Editorial de luxo — como Vogue Brasil, não como anúncio de loja. Nunca genérico.
• Valores: Elegância atemporal, empoderamento feminino, autenticidade, raridade

PADRÃO DE COPY PREMIUM:
1. Siga FIELMENTE o tema/ideia pedida pelo usuário — este é o briefing, não é sugestão
2. Se um produto real foi informado, a legenda obrigatoriamente fala DESSE produto (nome, material, pedra exatos)
3. Venda sentimentos e estilo de vida, nunca características técnicas
4. Emojis: máximo 2, refinados (✨ 🤍 🖤 💛) — nunca 🔥 🚨 💥 😍 ou clichês
5. Hashtags: inclua sempre #SOLLARIS #SollarisJoias + 4-6 relevantes e específicas
6. CTA elegante e sutil — nunca "COMPRE AGORA", "CORRE", "APROVEITA" ou urgência artificial
7. Estrutura: abertura impactante (1 linha) → desenvolvimento emocional (2-3 linhas) → encerramento/CTA (1 linha)
8. NUNCA invente dados do produto que não foram informados (preço, material, pedra)
9. Legenda CURTA e cinematográfica — máximo 5 linhas no total. Cada palavra deve ganhar seu espaço.
10. Evite repetir temas e abordagens dos posts recentes do histórico

PROIBIDO:
- Frases genéricas como "perfeito para qualquer ocasião", "a joia ideal", "presente perfeito"
- Linguagem de vendedor ou televendas
- Excesso de adjetivos sem substância
- Copiar estrutura ou tom dos posts no histórico (varie sempre)`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      prompt,
      brandContext,
      productContext,
      referenceContext,
      generationDirectives,
      historyContext,
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const sections: string[] = [`BRIEFING DO POST: "${prompt}"`];

    if (productContext) {
      sections.push(`PRODUTO (use esses dados exatos na legenda):\n${productContext}`);
    }

    if (generationDirectives?.requireSelectedProductFidelity) {
      sections.push("⚠️ OBRIGATÓRIO: a legenda DEVE falar especificamente deste produto. Não generalize.");
    }

    if (historyContext) {
      sections.push(`HISTÓRICO RECENTE (EVITE repetir temas, abordagens ou estruturas similares):\n${historyContext}`);
    }

    if (referenceContext) {
      sections.push(`REFERÊNCIAS DE ESTILO (use apenas como inspiração de tom e ritmo, não copie conteúdo):\n${referenceContext}`);
    }

    if (brandContext) {
      sections.push(`DIRETRIZES DE MARCA ATIVAS:\n${brandContext}`);
    }

    sections.push("Crie a legenda seguindo fielmente o briefing acima. Legenda CURTA, impactante e diferente dos posts recentes.");

    const userMessage = sections.join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_branded_post",
              description: "Generate a premium branded Instagram post for SOLLARIS JOIAS",
              parameters: {
                type: "object",
                properties: {
                  caption: {
                    type: "string",
                    description: "Full Instagram caption — SHORT, editorial, max 5 lines. No generic phrases.",
                  },
                  hashtags: {
                    type: "array",
                    items: { type: "string" },
                    description: "6-8 relevant hashtags including #SOLLARIS and #SollarisJoias",
                  },
                  platform_tips: {
                    type: "string",
                    description: "One specific Instagram tip for this post (story, carousel, reel, etc.)",
                  },
                  visual_suggestion: {
                    type: "string",
                    description: "Brief visual/photography direction for the image",
                  },
                  best_time: {
                    type: "string",
                    description: "Best time to post (day of week + time range)",
                  },
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
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
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
      post = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { caption: content, hashtags: ["#SOLLARIS", "#SollarisJoias"], platform_tips: "", visual_suggestion: "", best_time: "" };
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
