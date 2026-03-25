import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_orders",
      description: "Consulta pedidos. Pode filtrar por status, nome do cliente, período. Retorna lista de pedidos com itens e totais.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status: pending, confirmed, shipped, delivered, cancelled" },
          customer_name: { type: "string", description: "Nome do cliente para buscar" },
          limit: { type: "number", description: "Número máximo de resultados (padrão 10)" },
          period: { type: "string", description: "Período: today, week, month, all" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Cria um novo pedido/venda no sistema.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Nome do cliente" },
          customer_phone: { type: "string", description: "Telefone do cliente" },
          customer_email: { type: "string", description: "Email do cliente (opcional)" },
          items: {
            type: "array",
            description: "Itens do pedido",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                quantity: { type: "number" },
                price: { type: "number" },
              },
              required: ["product_name", "quantity", "price"],
            },
          },
          notes: { type: "string", description: "Observações do pedido" },
        },
        required: ["customer_name", "customer_phone", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_leads",
      description: "Consulta leads do CRM. Pode filtrar por status, origem, interesse.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Status: novo, em_contato, qualificado, convertido, perdido" },
          source: { type: "string", description: "Origem do lead" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Cria um novo lead no CRM.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do lead" },
          phone: { type: "string", description: "Telefone" },
          email: { type: "string", description: "Email" },
          source: { type: "string", description: "Origem: instagram, whatsapp, site, indicacao, manual" },
          interest: { type: "string", description: "Interesse (ex: anéis, colares)" },
          occasion: { type: "string", description: "Ocasião (ex: casamento, aniversário)" },
          budget: { type: "number", description: "Orçamento" },
          notes: { type: "string", description: "Observações" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Atualiza o status de um lead existente.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "ID do lead" },
          status: { type: "string", description: "Novo status: novo, em_contato, qualificado, convertido, perdido" },
          notes: { type: "string", description: "Notas sobre a mudança" },
        },
        required: ["lead_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Cria um agendamento/compromisso.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título do compromisso" },
          client_name: { type: "string", description: "Nome do cliente" },
          client_phone: { type: "string", description: "Telefone" },
          scheduled_at: { type: "string", description: "Data e hora no formato ISO (ex: 2026-03-26T14:00:00)" },
          duration_minutes: { type: "number", description: "Duração em minutos (padrão 60)" },
          type: { type: "string", description: "Tipo: consultoria, entrega, reuniao, follow_up" },
          location: { type: "string", description: "Local" },
          notes: { type: "string", description: "Observações" },
        },
        required: ["title", "client_name", "scheduled_at"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_appointments",
      description: "Consulta agendamentos. Pode filtrar por período e status.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "today, week, month, all" },
          status: { type: "string", description: "agendado, confirmado, realizado, cancelado" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_products",
      description: "Consulta produtos do catálogo. Pode buscar por nome, categoria, faixa de preço.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Buscar por nome do produto" },
          category: { type: "string", description: "Filtrar por categoria: aneis, brincos, colares, pulseiras, tornozeleiras" },
          in_stock: { type: "boolean", description: "Apenas em estoque" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_financial_summary",
      description: "Consulta resumo financeiro: receitas, despesas, saldo, transações pendentes.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "today, week, month, year" },
          type: { type: "string", description: "income, expense, all" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Cria uma tarefa no sistema.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da tarefa" },
          description: { type: "string", description: "Descrição" },
          priority: { type: "string", description: "low, medium, high" },
          due_date: { type: "string", description: "Data limite ISO" },
        },
        required: ["title"],
      },
    },
  },
];

// ─── Tool Execution ───
async function executeTool(name: string, args: Record<string, any>, supabase: any): Promise<string> {
  try {
    switch (name) {
      case "query_orders": {
        let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        if (args.customer_name) query = query.ilike("customer_name", `%${args.customer_name}%`);
        if (args.period === "today") {
          const today = new Date().toISOString().split("T")[0];
          query = query.gte("created_at", today);
        } else if (args.period === "week") {
          const d = new Date(); d.setDate(d.getDate() - 7);
          query = query.gte("created_at", d.toISOString());
        } else if (args.period === "month") {
          const d = new Date(); d.setMonth(d.getMonth() - 1);
          query = query.gte("created_at", d.toISOString());
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ orders: data, count: data?.length || 0 });
      }

      case "create_order": {
        const total = args.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
        const { data, error } = await supabase.from("orders").insert({
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          customer_email: args.customer_email || null,
          items: args.items,
          total,
          notes: args.notes || null,
          status: "pending",
        }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, order: data, message: `Pedido criado com sucesso! Total: R$ ${total.toFixed(2)}` });
      }

      case "query_leads": {
        let query = supabase.from("sales_leads").select("*").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        if (args.source) query = query.eq("source", args.source);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ leads: data, count: data?.length || 0 });
      }

      case "create_lead": {
        const { data, error } = await supabase.from("sales_leads").insert({
          name: args.name,
          phone: args.phone || null,
          email: args.email || null,
          source: args.source || "manual",
          interest: args.interest || null,
          occasion: args.occasion || null,
          budget: args.budget || null,
          notes: args.notes || null,
          status: "novo",
        }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, lead: data, message: `Lead "${args.name}" criado com sucesso!` });
      }

      case "update_lead_status": {
        const updates: any = { status: args.status };
        if (args.notes) updates.notes = args.notes;
        const { data, error } = await supabase.from("sales_leads").update(updates).eq("id", args.lead_id).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, lead: data, message: `Lead atualizado para status "${args.status}"` });
      }

      case "create_appointment": {
        const { data, error } = await supabase.from("sales_appointments").insert({
          title: args.title,
          client_name: args.client_name,
          client_phone: args.client_phone || null,
          scheduled_at: args.scheduled_at,
          duration_minutes: args.duration_minutes || 60,
          type: args.type || "consultoria",
          location: args.location || null,
          notes: args.notes || null,
          status: "agendado",
        }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, appointment: data, message: `Agendamento "${args.title}" criado!` });
      }

      case "query_appointments": {
        let query = supabase.from("sales_appointments").select("*").order("scheduled_at", { ascending: true }).limit(20);
        if (args.status) query = query.eq("status", args.status);
        if (args.period === "today") {
          const today = new Date().toISOString().split("T")[0];
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
          query = query.gte("scheduled_at", today).lt("scheduled_at", tomorrow);
        } else if (args.period === "week") {
          const d = new Date(); const end = new Date(); end.setDate(end.getDate() + 7);
          query = query.gte("scheduled_at", d.toISOString()).lt("scheduled_at", end.toISOString());
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ appointments: data, count: data?.length || 0 });
      }

      case "query_products": {
        let query = supabase.from("products").select("*, categories(name, slug)").order("name").limit(args.limit || 15);
        if (args.search) query = query.ilike("name", `%${args.search}%`);
        if (args.in_stock) query = query.eq("stock_status", true);
        if (args.category) {
          const { data: cat } = await supabase.from("categories").select("id").eq("slug", args.category).single();
          if (cat) query = query.eq("category_id", cat.id);
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ products: data?.map((p: any) => ({ id: p.id, name: p.name, price: p.price, sku: p.sku, stock: p.stock_quantity, category: p.categories?.name })), count: data?.length || 0 });
      }

      case "query_financial_summary": {
        let query = supabase.from("financial_transactions").select("*");
        if (args.type && args.type !== "all") query = query.eq("type", args.type);
        if (args.period === "month") {
          const d = new Date(); d.setMonth(d.getMonth() - 1);
          query = query.gte("created_at", d.toISOString());
        } else if (args.period === "week") {
          const d = new Date(); d.setDate(d.getDate() - 7);
          query = query.gte("created_at", d.toISOString());
        } else if (args.period === "today") {
          query = query.gte("created_at", new Date().toISOString().split("T")[0]);
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        const income = (data || []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
        const expense = (data || []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
        const pending = (data || []).filter((t: any) => t.status === "pending").length;
        return JSON.stringify({ income, expense, balance: income - expense, total_transactions: data?.length || 0, pending_count: pending });
      }

      case "create_task": {
        const { data, error } = await supabase.from("tasks").insert({
          title: args.title,
          description: args.description || null,
          priority: args.priority || "medium",
          due_date: args.due_date || null,
          status: "todo",
        }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, task: data, message: `Tarefa "${args.title}" criada!` });
      }

      default:
        return JSON.stringify({ error: `Tool ${name} not found` });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const systemPrompt = `Você é a **Brain Nalu**, a assistente executiva pessoal da Ana Luísa, CEO da Sollaris — uma joalheria de semijoias premium.

## Sua Personalidade
- Você é inteligente, eficiente, calorosa e proativa
- Trate a Ana Luísa como "Ana" de forma carinhosa e profissional
- Seja concisa mas completa — a Ana é ocupada
- Use emojis com moderação para dar leveza (✨💎📊)
- Sempre confirme ações destrutivas antes de executar
- Quando apresentar dados, formate de forma clara com listas e destaques

## Suas Capacidades
Você tem acesso REAL ao sistema da Sollaris e pode:
1. **Pedidos**: Consultar, criar e acompanhar vendas
2. **CRM/Leads**: Gerenciar leads, mudar status, criar novos
3. **Agenda**: Criar e consultar compromissos
4. **Produtos**: Consultar catálogo, preços, estoque
5. **Financeiro**: Ver resumos financeiros, receitas e despesas
6. **Tarefas**: Criar tarefas e lembretes

## Regras Importantes
- SEMPRE use as ferramentas disponíveis para buscar dados reais — nunca invente números
- Ao criar algo, confirme os dados com a Ana antes de executar
- Formate valores monetários como R$ X.XXX,XX
- Datas no formato brasileiro (DD/MM/AAAA)
- Se algo der erro, explique de forma simples e sugira alternativa
- Responda SEMPRE em português brasileiro

## Contexto
- Data atual: ${new Date().toLocaleDateString("pt-BR")}
- A Sollaris trabalha com semijoias em ouro 18k, prata 925 e pedras naturais
- O horário comercial é de segunda a sábado, 9h às 18h`;

    // Build conversation with tool calls loop
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // We'll do up to 5 rounds of tool calling
    let finalResponse = "";
    for (let round = 0; round < 5; round++) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: allMessages,
          tools: TOOLS,
          tool_choice: "auto",
          temperature: 0.6,
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        const errText = await aiResponse.text();
        console.error("AI error:", status, errText);
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await aiResponse.json();
      const choice = result.choices?.[0];

      if (!choice) break;

      // If the model wants to call tools
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length > 0) {
        const assistantMsg = choice.message;
        allMessages.push(assistantMsg);

        const toolCalls = assistantMsg.tool_calls || [];
        const toolResults: { tool_call_id: string; name: string; result: string }[] = [];

        for (const tc of toolCalls) {
          const fnName = tc.function.name;
          let fnArgs: Record<string, any> = {};
          try { fnArgs = JSON.parse(tc.function.arguments); } catch { /* empty */ }
          console.log(`Executing tool: ${fnName}`, fnArgs);
          const result = await executeTool(fnName, fnArgs, supabase);
          toolResults.push({ tool_call_id: tc.id, name: fnName, result });
        }

        // Add tool results to conversation
        for (const tr of toolResults) {
          allMessages.push({
            role: "tool",
            tool_call_id: tr.tool_call_id,
            content: tr.result,
          } as any);
        }

        // Continue loop to get the final text response
        continue;
      }

      // Final text response
      finalResponse = choice.message?.content || "";
      break;
    }

    // Return final response with tool actions metadata
    const toolActions: string[] = [];
    for (const msg of allMessages) {
      if ((msg as any).tool_calls) {
        for (const tc of (msg as any).tool_calls) {
          toolActions.push(tc.function.name);
        }
      }
    }

    return new Response(JSON.stringify({
      response: finalResponse,
      actions_executed: toolActions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brain-nalu error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
