import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Tool definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Busca produtos no catálogo da LARIFA por nome, categoria, cor, tamanho ou preço. Use para encontrar peças que combinem com o pedido da cliente.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto de busca (nome, tipo de peça, ocasião)" },
          category: { type: "string", description: "Nome da categoria (ex: Vestidos, Blusas, Calças)" },
          max_price: { type: "number", description: "Preço máximo em reais" },
          color: { type: "string", description: "Cor desejada" },
          size: { type: "string", description: "Tamanho desejado (PP, P, M, G, GG)" },
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
      description: "Mostra um produto específico com foto para a cliente. Use após sugerir um produto para que ela veja a imagem.",
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
      description: "Adiciona um produto ao pedido da cliente. Use quando ela confirmar que quer um item.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "ID do produto" },
          size: { type: "string", description: "Tamanho escolhido" },
          color: { type: "string", description: "Cor escolhida" },
          quantity: { type: "number", description: "Quantidade (default 1)" },
        },
        required: ["product_id", "size", "color"],
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
      description: "Mostra o resumo do pedido atual da cliente com todos os itens, tamanhos, cores e total.",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "collect_customer_info",
      description: "Coleta ou atualiza as informações da cliente (nome, telefone, email). Use quando tiver essas informações.",
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
      description: "Finaliza o pedido: salva no banco de dados e gera o link do WhatsApp para a vendedora entrar em contato. Só use quando o pedido tiver itens E os dados da cliente (pelo menos nome e telefone).",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
];

// Execute tool calls
async function executeTool(name: string, args: any, orderState: any): Promise<{ result: any; events: any[] }> {
  const events: any[] = [];

  switch (name) {
    case "search_products": {
      let query = supabase.from("products").select("id, name, price, description, sizes, colors, images, categories(name)").eq("stock_status", true);
      if (args.query) query = query.ilike("name", `%${args.query}%`);
      if (args.category) query = query.ilike("categories.name", `%${args.category}%`);
      if (args.max_price) query = query.lte("price", args.max_price);
      if (args.color) query = query.contains("colors", [args.color]);
      if (args.size) query = query.contains("sizes", [args.size]);
      const { data } = await query.limit(3);
      
      const products = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description?.substring(0, 100),
        sizes: p.sizes,
        colors: p.colors,
        image: p.images?.[0] || null,
        category: p.categories?.name,
      }));
      
      if (products.length > 0) {
        events.push({ type: "products", data: products });
      }
      
      return { result: products.length > 0 
        ? `Encontrei ${products.length} produto(s): ${products.map((p: any) => `${p.name} (R$${p.price.toFixed(2)}, ID: ${p.id})`).join(", ")}` 
        : "Nenhum produto encontrado com esses critérios.", events };
    }

    case "show_product": {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, description, sizes, colors, images, categories(name)")
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
        image: product.images?.[0] || null,
        category: (product as any).categories?.name,
      };
      events.push({ type: "products", data: [p] });
      return { result: `Produto: ${p.name} — R$${p.price.toFixed(2)}. Tamanhos: ${(p.sizes || []).join(", ")}. Cores: ${(p.colors || []).join(", ")}.`, events };
    }

    case "add_to_order": {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("id", args.product_id)
        .single();
      
      if (!product) return { result: "Produto não encontrado.", events };
      
      const item = {
        product_id: product.id,
        name: product.name,
        price: product.price,
        size: args.size,
        color: args.color,
        quantity: args.quantity || 1,
        image: product.images?.[0] || null,
      };
      
      // Remove existing same product if any
      orderState.items = (orderState.items || []).filter((i: any) => i.product_id !== product.id);
      orderState.items.push(item);
      
      const total = orderState.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      events.push({ type: "order_update", data: { items: orderState.items, total, customer: orderState.customer } });
      
      return { result: `Adicionei "${product.name}" (Tam: ${args.size}, Cor: ${args.color}, Qtd: ${args.quantity || 1}) ao pedido. Total atual: R$${total.toFixed(2)}.`, events };
    }

    case "remove_from_order": {
      orderState.items = (orderState.items || []).filter((i: any) => i.product_id !== args.product_id);
      const total = orderState.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      events.push({ type: "order_update", data: { items: orderState.items, total, customer: orderState.customer } });
      return { result: `Item removido. Total atual: R$${total.toFixed(2)}.`, events };
    }

    case "view_order": {
      const items = orderState.items || [];
      if (items.length === 0) return { result: "O pedido está vazio. Vamos montar um look?", events };
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
      
      if (items.length === 0) return { result: "O pedido está vazio! Adicione pelo menos um item.", events };
      if (!customer.name || !customer.phone) return { result: "Preciso do nome e WhatsApp da cliente para finalizar o pedido.", events };
      
      const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      
      // Save order to database
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
      
      // Get store WhatsApp number
      const { data: settings } = await supabase.from("settings").select("whatsapp_number").limit(1).single();
      const storePhone = settings?.whatsapp_number || "";
      
      // Generate WhatsApp message
      const lines = items.map((i: any) => `• ${i.name} — Tam: ${i.size}, Cor: ${i.color}, Qtd: ${i.quantity} — R$ ${(i.price * i.quantity).toFixed(2).replace(".", ",")}`);
      const whatsappMsg = `Olá! Sou ${customer.name} e gostaria de finalizar meu pedido LARIFA 🛍️\n\n${lines.join("\n")}\n\n💰 *Total: R$ ${total.toFixed(2).replace(".", ",")}*\n\nPedido #${order.id.slice(0, 8)}`;
      const whatsappUrl = storePhone 
        ? `https://wa.me/${storePhone}?text=${encodeURIComponent(whatsappMsg)}`
        : null;
      
      events.push({ type: "order_submitted", data: { order_id: order.id, whatsapp_url: whatsappUrl, total } });
      // Clear order state
      orderState.items = [];
      orderState.customer = {};
      
      return { result: `Pedido #${order.id.slice(0, 8)} salvo com sucesso! Total: R$${total.toFixed(2)}. ${whatsappUrl ? "Link do WhatsApp gerado para a cliente finalizar com a vendedora." : "Pedido registrado, a equipe entrará em contato."}`, events };
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

    // Mutable order state
    const orderState = {
      items: clientOrderState?.items || [],
      customer: clientOrderState?.customer || {},
    };

    // Build system prompt with current order context
    const orderContext = orderState.items.length > 0
      ? `\n\nPedido atual da cliente:\n${orderState.items.map((i: any) => `• ${i.name} (Tam: ${i.size}, Cor: ${i.color}, Qtd: ${i.quantity}) — R$${(i.price * i.quantity).toFixed(2)}`).join("\n")}\nTotal: R$${orderState.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toFixed(2)}`
      : "";

    const customerContext = orderState.customer?.name
      ? `\nDados da cliente: Nome: ${orderState.customer.name}, WhatsApp: ${orderState.customer.phone || "não informado"}, Email: ${orderState.customer.email || "não informado"}`
      : "";

    const systemPrompt = `Você é a Lari, estilista virtual e vendedora da LARIFA, uma loja de moda feminina premium.

## SUA PERSONALIDADE
Você é EXTREMAMENTE simpática, carinhosa e acolhedora. Trate cada cliente como uma amiga querida. Use emojis com carinho (não exagere). Sempre elogie a cliente e faça ela se sentir especial.

## REGRA DE OURO - FLUXO OBRIGATÓRIO
Siga SEMPRE este fluxo, passo a passo. NUNCA pule etapas:

### PASSO 1: BOAS-VINDAS + NOME
Na PRIMEIRA mensagem, se apresente e pergunte o NOME da cliente. Não fale de produtos ainda.
Exemplo: "Oii! 💕 Eu sou a Lari, sua estilista virtual da LARIFA! Que bom ter você aqui! Me conta, qual seu nome, linda?"

### PASSO 2: ENTENDER O QUE ELA QUER
Depois de saber o nome, pergunte O QUE ela procura. Use o nome dela na conversa!
Exemplo: "Que prazer, [nome]! 🥰 Me conta: o que você tá buscando hoje? É pra alguma ocasião especial?"

### PASSO 3: BUSCAR E MOSTRAR PRODUTOS (POUCOS!)
- Use search_products para buscar
- Mostre NO MÁXIMO 2 produtos por vez usando show_product
- Descreva brevemente cada um e pergunte se ela gostou
- Só sugira produtos que tenham a ver com o que ela PEDIU
- NUNCA mostre mais de 2 opções de uma vez — é confuso!

### PASSO 4: MONTAR O PEDIDO
Quando ela escolher, PERGUNTE o tamanho e a cor ANTES de adicionar.
Depois de adicionar, mostre o subtotal e pergunte se quer mais alguma coisa.

### PASSO 5: FECHAR O PEDIDO
Quando ela disser que está tudo:
1. Use view_order para mostrar o RESUMO COMPLETO com todos os itens e o TOTAL
2. Pergunte: "Tudo certinho, [nome]? 💕"
3. Peça o WhatsApp dela: "Me passa seu WhatsApp que nossa vendedora vai finalizar com você por lá! 📱"

### PASSO 6: FINALIZAR
Depois de ter nome + WhatsApp + itens confirmados:
1. Use collect_customer_info com os dados
2. Use submit_order para salvar
3. Diga algo carinhoso tipo: "[nome], seu pedido tá registrado! 🎉 Nossa vendedora vai te chamar no WhatsApp pra finalizar, tá? Foi um prazer te atender! 💕"

## REGRAS IMPORTANTES
- NUNCA invente produtos. SEMPRE use search_products
- SEMPRE mostre a foto com show_product antes de sugerir
- Máximo 2 sugestões por vez. A cliente escolhe, não você
- SEMPRE some e mostre o valor total antes de fechar
- SEMPRE colete nome no início e WhatsApp no final
- Respostas CURTAS: máximo 2-3 frases por mensagem
- Responda SEMPRE em português brasileiro
- Use o NOME da cliente sempre que possível
${orderContext}${customerContext}`;

    // Agentic loop: call AI, handle tool calls, repeat until text response
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
        if (status === 429) return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("AI gateway error:", status, t);
        return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      if (!message) break;

      // If the AI wants to call tools
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
        continue; // Loop back for AI to respond with text
      }

      // AI returned a text response — we're done with the loop
      const textContent = message.content || "";
      
      // Now stream the final response for good UX
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

      // Build a custom stream that prepends our events
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Send structured events first
          for (const evt of allEvents) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
          }
          // Send order state update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "order_state", data: orderState })}\n\n`));
          
          // Then pipe the streamed text
          if (streamResponse.ok && streamResponse.body) {
            const reader = streamResponse.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } else {
            // Fallback: send the text as a single SSE event
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

    // Fallback if max iterations reached
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
