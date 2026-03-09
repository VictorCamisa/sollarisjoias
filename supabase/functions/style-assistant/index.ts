import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Busca semijoias no catálogo da LARIFA por nome, categoria, material, banho, pedra ou preço. Use para encontrar peças que combinem com o que a cliente procura.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto de busca livre (nome da peça, tipo, ocasião, estilo)" },
          category: { type: "string", description: "Categoria (ex: Anéis, Colares, Brincos, Pulseiras, Conjuntos)" },
          max_price: { type: "number", description: "Preço máximo em reais" },
          banho: { type: "string", description: "Tipo de banho (ex: Ouro 18k, Ródio, Ouro Rosé)" },
          pedra: { type: "string", description: "Tipo de pedra (ex: Zircônia, Cristal, Pérola)" },
          color: { type: "string", description: "Cor desejada" },
          size: { type: "string", description: "Tamanho desejado" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_product",
      description: "Mostra uma semijoia específica com foto e detalhes completos para a cliente.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "ID do produto" },
        },
        required: ["product_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_order",
      description: "Adiciona uma semijoia ao pedido da cliente. Use quando ela confirmar que quer o item.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "ID do produto" },
          size: { type: "string", description: "Tamanho escolhido (se aplicável, senão 'Único')" },
          color: { type: "string", description: "Cor/variação escolhida (se aplicável, senão a cor principal)" },
          quantity: { type: "number", description: "Quantidade (default 1)" },
        },
        required: ["product_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_order",
      description: "Remove um item do pedido da cliente.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "ID do produto a remover" },
        },
        required: ["product_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_order",
      description: "Mostra o resumo do pedido atual com todos os itens e total.",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "collect_customer_info",
      description: "Coleta ou atualiza informações da cliente (nome, telefone, email).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da cliente" },
          phone: { type: "string", description: "WhatsApp/telefone da cliente" },
          email: { type: "string", description: "Email da cliente (opcional)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_order",
      description: "Finaliza o pedido: salva no banco de dados e gera link do WhatsApp. Só use quando tiver itens + nome + telefone confirmados.",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
];

const PRODUCT_FIELDS = "id, name, price, original_price, description, sizes, colors, images, banho, pedra, material, internal_notes, foto_frontal, foto_lateral, foto_lifestyle, foto_detalhe, categories(name)";

function getProductImage(p: any): string | null {
  return p.foto_frontal || p.foto_lifestyle || p.images?.[0] || p.foto_lateral || p.foto_detalhe || null;
}

function formatProductForAI(p: any): string {
  const parts = [`${p.name} (R$${p.price.toFixed(2)}, ID: ${p.id})`];
  if (p.banho) parts.push(`Banho: ${p.banho}`);
  if (p.pedra) parts.push(`Pedra: ${p.pedra}`);
  if (p.material) parts.push(`Material: ${p.material}`);
  if (p.sizes?.length) parts.push(`Tamanhos: ${p.sizes.join(", ")}`);
  if (p.colors?.length) parts.push(`Cores: ${p.colors.join(", ")}`);
  if (p.description) parts.push(`Descrição: ${p.description.substring(0, 150)}`);
  if (p.internal_notes) parts.push(`Dica de venda: ${p.internal_notes}`);
  return parts.join(" | ");
}

async function executeTool(name: string, args: any, orderState: any): Promise<{ result: any; events: any[] }> {
  const events: any[] = [];

  switch (name) {
    case "search_products": {
      let query = supabase.from("products").select(PRODUCT_FIELDS).eq("stock_status", true);
      
      if (args.category) {
        // First find category ID, then filter
        const { data: cats } = await supabase.from("categories").select("id").ilike("name", `%${args.category}%`);
        const catIds = (cats || []).map((c: any) => c.id);
        if (catIds.length > 0) {
          query = query.in("category_id", catIds);
        }
      }
      if (args.query) {
        query = query.or(`name.ilike.%${args.query}%,description.ilike.%${args.query}%,tags_seo.ilike.%${args.query}%`);
      }
      if (args.max_price) query = query.lte("price", args.max_price);
      if (args.banho) query = query.ilike("banho", `%${args.banho}%`);
      if (args.pedra) query = query.ilike("pedra", `%${args.pedra}%`);
      if (args.color) query = query.contains("colors", [args.color]);
      if (args.size) query = query.contains("sizes", [args.size]);
      
      const { data } = await query.order("is_featured", { ascending: false }).limit(2);

      const products = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description?.substring(0, 120),
        sizes: p.sizes,
        colors: p.colors,
        image: getProductImage(p),
        category: p.categories?.name,
      }));

      if (products.length > 0) {
        events.push({ type: "products", data: products });
      }

      return {
        result: products.length > 0
          ? `Encontrei ${products.length} peça(s):\n${(data || []).map((p: any) => formatProductForAI(p)).join("\n")}`
          : "Nenhuma peça encontrada com esses critérios. Tente buscar de outra forma ou sugira algo diferente à cliente.",
        events,
      };
    }

    case "show_product": {
      const { data: product } = await supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("id", args.product_id)
        .single();

      if (!product) return { result: "Produto não encontrado.", events };

      const p = {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        sizes: product.sizes,
        colors: product.colors,
        image: getProductImage(product),
        category: (product as any).categories?.name,
      };
      events.push({ type: "products", data: [p] });
      return { result: formatProductForAI(product), events };
    }

    case "add_to_order": {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, images, foto_frontal, foto_lifestyle, sizes, colors")
        .eq("id", args.product_id)
        .single();

      if (!product) return { result: "Produto não encontrado.", events };

      const size = args.size || (product.sizes?.length ? product.sizes[0] : "Único");
      const color = args.color || (product.colors?.length ? product.colors[0] : "Padrão");

      const item = {
        product_id: product.id,
        name: product.name,
        price: product.price,
        size,
        color,
        quantity: args.quantity || 1,
        image: (product as any).foto_frontal || (product as any).foto_lifestyle || product.images?.[0] || null,
      };

      orderState.items = (orderState.items || []).filter((i: any) => i.product_id !== product.id);
      orderState.items.push(item);

      const total = orderState.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      events.push({ type: "order_update", data: { items: orderState.items, total, customer: orderState.customer } });

      return { result: `Adicionei "${product.name}" (Tam: ${size}, Cor: ${color}, Qtd: ${args.quantity || 1}) ao pedido. Total atual: R$${total.toFixed(2)}.`, events };
    }

    case "remove_from_order": {
      orderState.items = (orderState.items || []).filter((i: any) => i.product_id !== args.product_id);
      const total = orderState.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      events.push({ type: "order_update", data: { items: orderState.items, total, customer: orderState.customer } });
      return { result: `Item removido. Total atual: R$${total.toFixed(2)}.`, events };
    }

    case "view_order": {
      const items = orderState.items || [];
      if (items.length === 0) return { result: "O pedido está vazio. Vamos escolher umas peças lindas?", events };
      const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      const summary = items.map((i: any) => `• ${i.name} — Tam: ${i.size}, Cor: ${i.color}, Qtd: ${i.quantity} — R$${(i.price * i.quantity).toFixed(2)}`).join("\n");
      events.push({ type: "order_update", data: { items, total, customer: orderState.customer } });
      return { result: `Pedido atual:\n${summary}\n\nTotal: R$${total.toFixed(2)}`, events };
    }

    case "collect_customer_info": {
      if (!orderState.customer) orderState.customer = {};
      if (args.name) orderState.customer.name = args.name;
      if (args.phone) orderState.customer.phone = args.phone;
      if (args.email) orderState.customer.email = args.email;
      events.push({ type: "order_update", data: { items: orderState.items || [], total: (orderState.items || []).reduce((s: number, i: any) => s + i.price * i.quantity, 0), customer: orderState.customer } });
      return { result: `Dados atualizados: Nome: ${orderState.customer.name || "?"}, WhatsApp: ${orderState.customer.phone || "?"}, Email: ${orderState.customer.email || "-"}.`, events };
    }

    case "submit_order": {
      const items = orderState.items || [];
      const customer = orderState.customer || {};

      if (items.length === 0) return { result: "O pedido está vazio! Adicione pelo menos uma peça.", events };
      if (!customer.name || !customer.phone) return { result: "Preciso do nome e WhatsApp da cliente para finalizar o pedido.", events };

      const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

      const { data: order, error } = await supabase.from("orders").insert({
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        items: items,
        total: total,
        status: "pending",
        notes: "Pedido via Assistente Lari",
      }).select().single();

      if (error) {
        console.error("Order insert error:", error);
        return { result: "Erro ao salvar o pedido. Tente novamente.", events };
      }

      const { data: settings } = await supabase.from("settings").select("whatsapp_number").limit(1).single();
      const storePhone = settings?.whatsapp_number || "";

      const lines = items.map((i: any) => `• ${i.name} — Tam: ${i.size}, Cor: ${i.color}, Qtd: ${i.quantity} — R$ ${(i.price * i.quantity).toFixed(2).replace(".", ",")}`);
      const whatsappMsg = `Olá! Sou ${customer.name} e gostaria de finalizar meu pedido LARIFA 💎\n\n${lines.join("\n")}\n\n💰 *Total: R$ ${total.toFixed(2).replace(".", ",")}*\n\nPedido #${order.id.slice(0, 8)}`;
      const whatsappUrl = storePhone
        ? `https://wa.me/${storePhone}?text=${encodeURIComponent(whatsappMsg)}`
        : null;

      events.push({ type: "order_submitted", data: { order_id: order.id, whatsapp_url: whatsappUrl, total } });
      orderState.items = [];
      orderState.customer = {};

      return { result: `Pedido #${order.id.slice(0, 8)} salvo com sucesso! Total: R$${total.toFixed(2)}. ${whatsappUrl ? "Link do WhatsApp gerado." : "Pedido registrado, a equipe entrará em contato."}`, events };
    }

    default:
      return { result: "Ferramenta não reconhecida.", events };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, order_state: clientOrderState } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const orderState = {
      items: clientOrderState?.items || [],
      customer: clientOrderState?.customer || {},
    };

    const orderContext = orderState.items.length > 0
      ? `\n\nPedido atual da cliente:\n${orderState.items.map((i: any) => `• ${i.name} (Tam: ${i.size}, Cor: ${i.color}, Qtd: ${i.quantity}) — R$${(i.price * i.quantity).toFixed(2)}`).join("\n")}\nTotal: R$${orderState.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toFixed(2)}`
      : "";

    const customerContext = orderState.customer?.name
      ? `\nDados da cliente: Nome: ${orderState.customer.name}, WhatsApp: ${orderState.customer.phone || "não informado"}, Email: ${orderState.customer.email || "não informado"}`
      : "";

    const systemPrompt = `Você é a Lari, consultora de estilo e vendedora virtual da LARIFA — uma marca de SEMIJOIAS premium. 

## SOBRE A LARIFA
A LARIFA vende SEMIJOIAS: anéis, colares, brincos, pulseiras, correntes, pingentes e conjuntos. NÃO vendemos roupas, sapatos ou acessórios de moda em geral. Nossos produtos são semijoias com banhos nobres (ouro 18k, ródio, ouro rosé) e pedras (zircônia, cristal, pérola, etc).

## SUA PERSONALIDADE
- Simpática, carinhosa e acolhedora — trate cada cliente como amiga
- Especialista em semijoias: saiba falar sobre banhos, pedras, materiais
- Use emojis com moderação (💎 ✨ 💕 🥰)
- Elogie o gosto da cliente e faça ela se sentir especial
- Respostas CURTAS: máximo 2-3 frases por mensagem

## CONHECIMENTO TÉCNICO
Quando o campo "internal_notes" de um produto tiver dicas, USE-AS na venda! São informações estratégicas sobre como vender aquela peça.
- Saiba explicar diferenças entre banhos (ouro 18k vs ródio)
- Sugira combinações de peças (brinco + colar, anel + pulseira)
- Saiba recomendar por ocasião: casual, festa, trabalho, presente

## FLUXO DE ATENDIMENTO

### PASSO 1: BOAS-VINDAS + NOME
Se apresente e pergunte o nome da cliente. Não fale de produtos ainda.
"Oii! 💎 Eu sou a Lari, consultora de estilo da LARIFA! Me conta, qual seu nome, linda?"

### PASSO 2: ENTENDER O QUE ELA BUSCA
Pergunte o que ela procura: ocasião, tipo de peça, para presente ou uso próprio, preferências de estilo.
"Que prazer, [nome]! ✨ Me conta: tá buscando algo pra você ou pra presentear? Tem alguma peça em mente?"

### PASSO 3: BUSCAR E MOSTRAR PEÇAS
- Use search_products para buscar no catálogo real
- Mostre NO MÁXIMO 2 peças por vez
- Use as dicas de internal_notes para argumentar a venda
- Pergunte se gostou antes de sugerir mais
- NUNCA invente produtos — só mostre o que existe no banco

### PASSO 4: MONTAR O PEDIDO
Quando ela escolher, pergunte tamanho/cor SE houver variações.
Adicione ao pedido e mostre o subtotal. Pergunte se quer mais.
Sugira peças complementares: "Esse colar fica perfeito com o brinco X!"

### PASSO 5: FECHAR O PEDIDO
1. Mostre o resumo completo com view_order
2. Confirme: "Tudo certinho, [nome]? 💎"
3. Peça o WhatsApp: "Me passa seu WhatsApp que nossa equipe finaliza por lá! 📱"

### PASSO 6: FINALIZAR
Com nome + WhatsApp + itens confirmados: collect_customer_info → submit_order

## REGRAS IMPORTANTES
- NUNCA invente produtos. SEMPRE busque com search_products
- NUNCA diga que vende roupas, sapatos ou qualquer coisa que não seja semijoia
- Máximo 2 sugestões por vez — NUNCA mostre mais que 2 produtos de uma vez
- Quando falar "encontrei X opções", o número X DEVE corresponder EXATAMENTE ao número de produtos que você vai mostrar
- Se a busca retornar 2 produtos, diga "encontrei 2 opções". Se retornar 1, diga "encontrei 1 opção"
- SEMPRE colete nome no início e WhatsApp no final
- Use o nome da cliente sempre que possível
- Responda SEMPRE em português brasileiro
- Se a cliente perguntar algo fora do escopo (roupas, etc), diga gentilmente que a LARIFA é especializada em semijoias
${orderContext}${customerContext}`;

    let aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const allEvents: any[] = [];
    let maxIterations = 8;

    while (maxIterations > 0) {
      maxIterations--;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools,
          stream: false,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Muitas requisições." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("AI gateway error:", status, t);
        return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      if (!message) break;

      if (message.tool_calls && message.tool_calls.length > 0) {
        aiMessages.push(message);

        for (const tc of message.tool_calls) {
          const fnName = tc.function.name;
          let fnArgs = {};
          try { fnArgs = JSON.parse(tc.function.arguments || "{}"); } catch {}

          const { result, events } = await executeTool(fnName, fnArgs, orderState);
          allEvents.push(...events);

          aiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      const textContent = message.content || "";

      // Stream the final response
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Repita exatamente o texto a seguir, sem alterar nada:" },
            { role: "user", content: textContent },
          ],
          stream: true,
        }),
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for (const evt of allEvents) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "order_state", data: orderState })}\n\n`));

          if (streamResponse.ok && streamResponse.body) {
            const reader = streamResponse.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } else {
            const fakeSSE = `data: ${JSON.stringify({ choices: [{ delta: { content: textContent } }] })}\n\ndata: [DONE]\n\n`;
            controller.enqueue(encoder.encode(fakeSSE));
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(JSON.stringify({ error: "A assistente não conseguiu completar a ação. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("style-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
