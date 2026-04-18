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
      description: "Consulta pedidos. Pode filtrar por status, nome do cliente, período.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "pending, confirmed, shipped, delivered, cancelled" },
          customer_name: { type: "string" },
          limit: { type: "number" },
          period: { type: "string", description: "today, week, month, all" },
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
          customer_name: { type: "string" },
          customer_phone: { type: "string" },
          customer_email: { type: "string" },
          items: { type: "array", items: { type: "object", properties: { product_name: { type: "string" }, quantity: { type: "number" }, price: { type: "number" } }, required: ["product_name", "quantity", "price"] } },
          notes: { type: "string" },
        },
        required: ["customer_name", "customer_phone", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_leads",
      description: "Consulta leads do CRM.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          source: { type: "string" },
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
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          source: { type: "string" },
          interest: { type: "string" },
          occasion: { type: "string" },
          budget: { type: "number" },
          notes: { type: "string" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Atualiza o status de um lead.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string" },
          status: { type: "string" },
          notes: { type: "string" },
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
          title: { type: "string" },
          client_name: { type: "string" },
          client_phone: { type: "string" },
          scheduled_at: { type: "string" },
          duration_minutes: { type: "number" },
          type: { type: "string" },
          location: { type: "string" },
          notes: { type: "string" },
        },
        required: ["title", "client_name", "scheduled_at"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_appointments",
      description: "Consulta agendamentos.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "today, week, month, all" },
          status: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_products",
      description: "Consulta produtos do catálogo.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          category: { type: "string" },
          in_stock: { type: "boolean" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_financial_summary",
      description: "Consulta resumo financeiro.",
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
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", description: "low, medium, high" },
          due_date: { type: "string", description: "ISO date string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_tasks",
      description: "Consulta tarefas existentes. Pode filtrar por status, prioridade ou período.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "todo, in_progress, done" },
          priority: { type: "string", description: "low, medium, high" },
          period: { type: "string", description: "today, week, month, all" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Atualiza uma tarefa existente (status, prioridade, etc).",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          status: { type: "string", description: "todo, in_progress, done" },
          priority: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          due_date: { type: "string" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_financial_transaction",
      description: "Cria uma transação financeira (receita ou despesa).",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "income ou expense" },
          description: { type: "string" },
          amount: { type: "number" },
          payment_method: { type: "string" },
          due_date: { type: "string" },
          customer_name: { type: "string" },
          notes: { type: "string" },
        },
        required: ["type", "description", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_marketing_post",
      description: "Gera um post completo para Instagram da SOLLARIS: cria a legenda + imagem editorial. Pergunte o estilo (claro ou escuro) se não for especificado.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Tema/assunto do post (ex: 'lançamento colar pérolas', 'promoção dia das mães')" },
          style: { type: "string", description: "dark ou light", enum: ["dark", "light"] },
          product_name: { type: "string", description: "Nome do produto para buscar no catálogo (opcional)" },
        },
        required: ["prompt", "style"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_marketing_posts",
      description: "Busca posts de marketing já gerados. Use para enviar o último post, listar posts recentes, ou buscar por tema/estilo.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Quantidade de posts para retornar (padrão: 1)" },
          style: { type: "string", description: "Filtrar por estilo: dark ou light" },
          status: { type: "string", description: "Filtrar por status: rascunho, publicado, agendado" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Busca documentos na base de conhecimento da Sollaris (sales_knowledge_docs). Use SEMPRE que a Ana pedir ajuda com Google Planilhas/Sheets, fórmulas, Excel, ou qualquer assunto que pode estar documentado (cuidados com joias, medidas, FAQ, políticas, planilhas). Filtre por categoria quando relevante.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo de busca (palavra-chave que aparece no título ou conteúdo)" },
          category: { type: "string", description: "Filtrar por categoria: planilhas, cuidados, medidas, faq, politicas, catalogo, outros" },
          limit: { type: "number", description: "Quantidade máxima de documentos (padrão: 3)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Atualiza o status de um pedido.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string" },
          status: { type: "string", description: "pending, confirmed, shipped, delivered, cancelled" },
          notes: { type: "string" },
        },
        required: ["order_id", "status"],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, any>, supabase: any): Promise<string> {
  try {
    switch (name) {
      case "query_orders": {
        let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(args.limit || 10);
        if (args.status) query = query.eq("status", args.status);
        if (args.customer_name) query = query.ilike("customer_name", `%${args.customer_name}%`);
        if (args.period === "today") { query = query.gte("created_at", new Date().toISOString().split("T")[0]); }
        else if (args.period === "week") { const d = new Date(); d.setDate(d.getDate() - 7); query = query.gte("created_at", d.toISOString()); }
        else if (args.period === "month") { const d = new Date(); d.setMonth(d.getMonth() - 1); query = query.gte("created_at", d.toISOString()); }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ orders: data, count: data?.length || 0 });
      }
      case "create_order": {
        const total = args.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
        const { data, error } = await supabase.from("orders").insert({ customer_name: args.customer_name, customer_phone: args.customer_phone, customer_email: args.customer_email || null, items: args.items, total, notes: args.notes || null, status: "pending" }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, order: data, message: `Pedido criado! Total: R$ ${total.toFixed(2)}` });
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
        const { data, error } = await supabase.from("sales_leads").insert({ name: args.name, phone: args.phone || null, email: args.email || null, source: args.source || "manual", interest: args.interest || null, occasion: args.occasion || null, budget: args.budget || null, notes: args.notes || null, status: "novo" }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, lead: data, message: `Lead "${args.name}" criado!` });
      }
      case "update_lead_status": {
        const updates: any = { status: args.status };
        if (args.notes) updates.notes = args.notes;
        const { data, error } = await supabase.from("sales_leads").update(updates).eq("id", args.lead_id).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, lead: data });
      }
      case "create_appointment": {
        const { data, error } = await supabase.from("sales_appointments").insert({ title: args.title, client_name: args.client_name, client_phone: args.client_phone || null, scheduled_at: args.scheduled_at, duration_minutes: args.duration_minutes || 60, type: args.type || "consultoria", location: args.location || null, notes: args.notes || null, status: "agendado" }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, appointment: data });
      }
      case "query_appointments": {
        let query = supabase.from("sales_appointments").select("*").order("scheduled_at", { ascending: true }).limit(20);
        if (args.status) query = query.eq("status", args.status);
        if (args.period === "today") { const t = new Date().toISOString().split("T")[0]; const tm = new Date(Date.now() + 86400000).toISOString().split("T")[0]; query = query.gte("scheduled_at", t).lt("scheduled_at", tm); }
        else if (args.period === "week") { const d = new Date(); const e = new Date(); e.setDate(e.getDate() + 7); query = query.gte("scheduled_at", d.toISOString()).lt("scheduled_at", e.toISOString()); }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ appointments: data, count: data?.length || 0 });
      }
      case "query_products": {
        let query = supabase.from("products").select("*, categories(name, slug)").order("name").limit(args.limit || 15);
        if (args.search) query = query.ilike("name", `%${args.search}%`);
        if (args.in_stock) query = query.eq("stock_status", true);
        if (args.category) { const { data: cat } = await supabase.from("categories").select("id").eq("slug", args.category).single(); if (cat) query = query.eq("category_id", cat.id); }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ products: data?.map((p: any) => ({ id: p.id, name: p.name, price: p.price, sku: p.sku, stock: p.stock_quantity, category: p.categories?.name })), count: data?.length || 0 });
      }
      case "query_financial_summary": {
        let query = supabase.from("financial_transactions").select("*");
        if (args.type && args.type !== "all") query = query.eq("type", args.type);
        if (args.period === "month") { const d = new Date(); d.setMonth(d.getMonth() - 1); query = query.gte("created_at", d.toISOString()); }
        else if (args.period === "week") { const d = new Date(); d.setDate(d.getDate() - 7); query = query.gte("created_at", d.toISOString()); }
        else if (args.period === "today") { query = query.gte("created_at", new Date().toISOString().split("T")[0]); }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        const income = (data || []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
        const expense = (data || []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
        return JSON.stringify({ income, expense, balance: income - expense, total_transactions: data?.length || 0, pending_count: (data || []).filter((t: any) => t.status === "pending").length });
      }
      case "create_task": {
        const { data, error } = await supabase.from("tasks").insert({ title: args.title, description: args.description || null, priority: args.priority || "medium", due_date: args.due_date || null, status: "todo" }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, task: data });
      }
      case "query_tasks": {
        let query = supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(args.limit || 20);
        if (args.status) query = query.eq("status", args.status);
        if (args.priority) query = query.eq("priority", args.priority);
        if (args.period === "today") { query = query.gte("due_date", new Date().toISOString().split("T")[0]); query = query.lt("due_date", new Date(Date.now() + 86400000).toISOString().split("T")[0]); }
        else if (args.period === "week") { const d = new Date(); const e = new Date(); e.setDate(e.getDate() + 7); query = query.gte("due_date", d.toISOString().split("T")[0]).lt("due_date", e.toISOString().split("T")[0]); }
        else if (args.period === "month") { const d = new Date(); const e = new Date(); e.setMonth(e.getMonth() + 1); query = query.gte("due_date", d.toISOString().split("T")[0]).lt("due_date", e.toISOString().split("T")[0]); }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ tasks: data, count: data?.length || 0 });
      }
      case "update_task": {
        const updates: any = {};
        if (args.status) updates.status = args.status;
        if (args.priority) updates.priority = args.priority;
        if (args.title) updates.title = args.title;
        if (args.description) updates.description = args.description;
        if (args.due_date) updates.due_date = args.due_date;
        const { data, error } = await supabase.from("tasks").update(updates).eq("id", args.task_id).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, task: data });
      }
      case "create_financial_transaction": {
        const { data, error } = await supabase.from("financial_transactions").insert({ type: args.type, description: args.description, amount: args.amount, payment_method: args.payment_method || "pix", due_date: args.due_date || null, customer_name: args.customer_name || null, notes: args.notes || null, status: "pending" }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, transaction: data });
      }
      case "update_order_status": {
        const upd: any = { status: args.status };
        if (args.notes) upd.notes = args.notes;
        const { data, error } = await supabase.from("orders").update(upd).eq("id", args.order_id).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, order: data });
      }
      case "generate_marketing_post": {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Find product if specified
        let productId: string | undefined;
        if (args.product_name) {
          const { data: products } = await supabase
            .from("products")
            .select("id, name")
            .ilike("name", `%${args.product_name}%`)
            .limit(1);
          if (products && products.length > 0) {
            productId = products[0].id;
          }
        }

        // Generate caption
        let caption = "";
        let hashtags: string[] = [];
        try {
          const captionResp = await fetch(`${supabaseUrl}/functions/v1/generate-post`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ prompt: args.prompt, platform: "instagram" }),
          });
          if (captionResp.ok) {
            const captionData = await captionResp.json();
            caption = captionData.post?.caption || "";
            hashtags = captionData.post?.hashtags || [];
          }
        } catch (e) {
          console.error("Caption generation error:", e);
        }

        // Generate image
        let imageUrl = "";
        try {
          const imageResp = await fetch(`${supabaseUrl}/functions/v1/generate-post-image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              prompt: args.prompt,
              style: args.style || "dark",
              productId,
            }),
          });
          if (imageResp.ok) {
            const imageData = await imageResp.json();
            imageUrl = imageData.image_url || "";
          }
        } catch (e) {
          console.error("Image generation error:", e);
        }

        // Save to marketing_posts
        if (caption || imageUrl) {
          await supabase.from("marketing_posts").insert({
            platform: "instagram",
            prompt: args.prompt,
            caption: caption || args.prompt,
            hashtags,
            style: args.style,
            image_url: imageUrl || null,
            product_id: productId || null,
            status: "draft",
          } as any);
        }

        return JSON.stringify({
          success: true,
          caption,
          hashtags,
          image_url: imageUrl,
          product_found: !!productId,
          message: imageUrl
            ? `Post gerado! Imagem: ${imageUrl}`
            : caption
            ? "Legenda gerada, mas houve erro na imagem."
            : "Erro ao gerar o post.",
        });
      }
      case "query_marketing_posts": {
        let query = supabase
          .from("marketing_posts")
          .select("id, prompt, caption, hashtags, image_url, style, status, created_at")
          .order("created_at", { ascending: false })
          .limit(args.limit || 1);

        if (args.style) query = query.eq("style", args.style);
        if (args.status) query = query.eq("status", args.status);

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
          return JSON.stringify({ success: true, message: "Nenhum post encontrado.", posts: [] });
        }

        // Format response with image markdown so whatsapp-webhook can detect and send
        const posts = data.map((p: any) => ({
          caption: p.caption,
          hashtags: p.hashtags,
          image_url: p.image_url,
          style: p.style,
          status: p.status,
          created_at: p.created_at,
        }));

        return JSON.stringify({ success: true, posts, message: `Encontrei ${data.length} post(s).` });
      }
      case "search_knowledge_base": {
        let q = supabase
          .from("sales_knowledge_docs")
          .select("title, content, category, tags, created_at")
          .order("created_at", { ascending: false })
          .limit(args.limit || 3);
        if (args.category) q = q.eq("category", args.category);
        if (args.query) q = q.or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%`);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) {
          return JSON.stringify({ success: true, message: "Nenhum documento encontrado na base.", docs: [] });
        }
        return JSON.stringify({ success: true, docs: data, count: data.length });
      }
      default:
        return JSON.stringify({ error: `Tool ${name} not found` });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}

// Build a memory summary from recent conversations
async function buildMemoryContext(supabase: any, currentConversationId?: string): Promise<string> {
  // Get last 10 conversations (excluding current) with their messages
  let convQuery = supabase
    .from("brain_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (currentConversationId) {
    convQuery = convQuery.neq("id", currentConversationId);
  }

  const { data: conversations } = await convQuery;
  if (!conversations || conversations.length === 0) return "";

  // Get last 3 messages from each of the last 5 conversations for context
  const summaries: string[] = [];
  const recentConvs = conversations.slice(0, 5);

  for (const conv of recentConvs) {
    const { data: msgs } = await supabase
      .from("brain_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(4);

    if (msgs && msgs.length > 0) {
      const date = new Date(conv.updated_at).toLocaleDateString("pt-BR");
      const preview = msgs.reverse().map((m: any) => `${m.role === "user" ? "Ana" : "Sollaris"}: ${m.content.substring(0, 200)}`).join("\n");
      summaries.push(`📅 ${date} — "${conv.title}"\n${preview}`);
    }
  }

  if (summaries.length === 0) return "";

  return `\n\n## Memória — Conversas Recentes\nEstas foram suas últimas conversas com a Ana. Use esse contexto para ter continuidade, lembrar de problemas anteriores, decisões tomadas e compromissos feitos:\n\n${summaries.join("\n\n---\n\n")}`;
}

// Generate a title from the first user message
async function generateTitle(firstMessage: string): Promise<string> {
  const msg = firstMessage.substring(0, 100);
  if (msg.length <= 40) return msg;
  return msg.substring(0, 40) + "...";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversation_id, save_messages } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build memory context from past conversations
    const memoryContext = await buildMemoryContext(supabase, conversation_id);

    const systemPrompt = `Você é a **Brain Sollaris**, a assistente executiva pessoal da Ana Luísa, CEO da Sollaris — uma joalheria de semijoias premium.

## Sua Personalidade
- Você é inteligente, eficiente, calorosa e proativa
- Trate a Ana Luísa como "Ana" de forma carinhosa e profissional
- Seja concisa mas completa — a Ana é ocupada
- Use emojis com moderação para dar leveza (✨💎📊)
- Sempre confirme ações destrutivas antes de executar
- Quando apresentar dados, formate de forma clara com listas e destaques

## Suas Capacidades
Você tem acesso REAL ao sistema da Sollaris e pode:
1. **Pedidos**: Consultar, criar, atualizar status de vendas
2. **CRM/Leads**: Gerenciar leads, mudar status, criar novos
3. **Agenda**: Criar e consultar compromissos
4. **Produtos**: Consultar catálogo, preços, estoque
5. **Financeiro**: Ver resumos financeiros, criar transações
6. **Tarefas**: Criar, consultar e atualizar tarefas
7. **Marketing**: Gerar posts completos para Instagram (legenda + imagem editorial)

## Marketing / Posts
Quando a Ana pedir para criar um post:
- Pergunte APENAS o estilo: "claro" (light) ou "escuro" (dark) — se ela não especificou
- Use a ferramenta generate_marketing_post com o tema que ela pediu
- Depois de gerar, mostre a legenda e inclua o link da imagem no formato: ![Post](URL)
- Se ela mencionar um produto específico, busque pelo nome para vincular ao post

Quando a Ana pedir para VER ou ENVIAR um post já gerado (ex: "me manda o último post", "mostra o post que fizemos"):
- Use a ferramenta query_marketing_posts para buscar
- SEMPRE inclua a imagem no formato markdown: ![Post](URL_DA_IMAGEM)
- Isso é OBRIGATÓRIO para que a imagem seja enviada pelo WhatsApp
- Mostre também a legenda e hashtags

## Memória e Contexto
Você tem acesso ao histórico de conversas passadas. Use essa memória para:
- Dar continuidade a assuntos anteriores sem que a Ana precise repetir
- Lembrar de decisões, problemas reportados e compromissos feitos
- Conectar informações de diferentes conversas para insights mais ricos
- Se a Ana mencionar algo que foi discutido antes, referencie naturalmente
${memoryContext}

## Regras
- SEMPRE use as ferramentas para buscar dados reais — nunca invente
- Confirme dados com a Ana antes de executar ações
- Formate valores como R$ X.XXX,XX
- Datas no formato DD/MM/AAAA
- Se algo der erro, explique de forma simples
- Responda SEMPRE em português brasileiro

## Contexto
- Data atual: ${new Date().toLocaleDateString("pt-BR")}
- A Sollaris trabalha com semijoias em ouro 18k, prata 925 e pedras naturais
- Horário comercial: segunda a sábado, 9h às 18h`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    let finalResponse = "";
    for (let round = 0; round < 5; round++) {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await aiResponse.json();
      const choice = result.choices?.[0];
      if (!choice) break;

      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length > 0) {
        const assistantMsg = choice.message;
        allMessages.push(assistantMsg);
        const toolCalls = assistantMsg.tool_calls || [];
        for (const tc of toolCalls) {
          const fnName = tc.function.name;
          let fnArgs: Record<string, any> = {};
          try { fnArgs = JSON.parse(tc.function.arguments); } catch { /* empty */ }
          console.log(`Executing tool: ${fnName}`, fnArgs);
          const result = await executeTool(fnName, fnArgs, supabase);
          allMessages.push({ role: "tool", tool_call_id: tc.id, content: result } as any);
        }
        continue;
      }

      finalResponse = choice.message?.content || "";
      break;
    }

    const toolActions: string[] = [];
    for (const msg of allMessages) {
      if ((msg as any).tool_calls) {
        for (const tc of (msg as any).tool_calls) {
          toolActions.push(tc.function.name);
        }
      }
    }

    // Save messages to database if conversation_id provided
    if (save_messages && conversation_id) {
      const userMsg = messages[messages.length - 1];
      if (userMsg) {
        await supabase.from("brain_messages").insert({
          conversation_id,
          role: "user",
          content: userMsg.content,
          actions: [],
        });
      }
      if (finalResponse) {
        await supabase.from("brain_messages").insert({
          conversation_id,
          role: "assistant",
          content: finalResponse,
          actions: toolActions,
        });
      }
      // Update conversation title from first user message
      const { data: msgCount } = await supabase
        .from("brain_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversation_id);

      if ((msgCount as any)?.length <= 2 || !msgCount) {
        const title = await generateTitle(messages[0]?.content || "Nova conversa");
        await supabase.from("brain_conversations").update({ title }).eq("id", conversation_id);
      }
    }

    return new Response(JSON.stringify({ response: finalResponse, actions_executed: toolActions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brain-nalu error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
