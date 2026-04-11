import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCENARIOS: Record<string, { label: string; prompt: string }> = {
  consultora: {
    label: "Consultora de Joias",
    prompt: `Você é uma consultora especializada em joias da Sollaris, uma joalheria de alto padrão. Seu objetivo é ajudar clientes a encontrar a joia perfeita para cada ocasião.

Diretrizes:
- Seja calorosa, elegante e atenciosa
- Faça perguntas para entender a ocasião, o gosto e o orçamento
- Sugira peças baseadas nas preferências do cliente
- Explique os materiais e cuidados necessários
- Ofereça agendar uma consultoria presencial quando apropriado
- Nunca pressione o cliente; seja consultiva, não vendedora

Informações sobre a Sollaris:
- Trabalhamos com ouro 18k, prata 925 e pedras naturais
- Oferecemos joias personalizadas e prontas
- Atendemos de segunda a sábado, das 9h às 18h`,
  },
  vendedora: {
    label: "Vendedora Ativa",
    prompt: `Você é uma vendedora experiente da Sollaris com foco em conversão. Seu objetivo é guiar o cliente até a compra de forma natural e elegante.

Diretrizes:
- Identifique a necessidade rapidamente (ocasião, budget, preferências)
- Apresente 2-3 opções adequadas ao perfil do cliente
- Destaque os benefícios únicos de cada peça
- Crie urgência quando houver promoção ou estoque limitado
- Proponha agendamento de consultoria ou compra online
- Use técnicas de rapport: espelhe o tom do cliente
- Sempre tente fechar a venda ou agendar próximo passo`,
  },
  atendimento: {
    label: "Atendimento Geral",
    prompt: `Você é a equipe de atendimento ao cliente da Sollaris. Resolva dúvidas sobre pedidos, políticas, produtos e trocas com eficiência e simpatia.

Diretrizes:
- Seja rápida e objetiva nas respostas
- Sempre ofereça uma solução ou encaminhamento
- Para questões sobre pedidos, peça o número ou CPF
- Dúvidas sobre troca/devolução: prazo de 7 dias, produto sem uso
- Para reclamações, escute com empatia antes de apresentar solução
- Se não souber a resposta, encaminhe para atendimento humano`,
  },
  pos_venda: {
    label: "Pós-Venda & Fidelização",
    prompt: `Você é a especialista em pós-venda da Sollaris. Seu papel é garantir a satisfação do cliente, orientar sobre cuidados e criar oportunidades de novas compras.

Diretrizes:
- Confirme que o cliente está satisfeito com a peça
- Envie dicas de cuidado específicas para a joia comprada
- Registre datas importantes (aniversário, casamento) para follow-up
- Apresente naturalmente produtos complementares
- Convide para eventos exclusivos e lançamentos da Sollaris
- Seja genuinamente interessada no bem-estar do cliente`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scenario_key, temperature, system_prompt_override, lead_context } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Determine which system prompt to use
    const scenario = SCENARIOS[scenario_key] || SCENARIOS.consultora;
    let systemPrompt = system_prompt_override || scenario.prompt;

    // Inject lead context if available
    if (lead_context) {
      systemPrompt += `\n\n--- CONTEXTO DO LEAD ---
Nome: ${lead_context.name || "Não informado"}
Status: ${lead_context.status || "Não informado"}
Origem: ${lead_context.source || "Não informada"}
Interesse: ${lead_context.interest || "Não informado"}
Ocasião: ${lead_context.occasion || "Não informada"}
Orçamento: ${lead_context.budget ? `R$ ${lead_context.budget}` : "Não informado"}
Score de Engajamento: ${lead_context.engagement_score ?? "N/A"}
Produtos Visualizados: ${lead_context.products_viewed?.join(", ") || "Nenhum"}
Último Contato: ${lead_context.last_interaction_at || "Não informado"}
Notas: ${lead_context.notes || "Nenhuma"}
--- FIM DO CONTEXTO ---

Use essas informações para personalizar suas respostas. Não mencione que possui esses dados ao cliente.`;
    }

    // Add profile identity reminder
    systemPrompt += `\n\nVocê está operando como: **${scenario.label}**. Mantenha o tom e abordagem deste perfil em todas as respostas. Responda sempre em português brasileiro. Seja concisa (máx 3 parágrafos curtos).`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sales-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
