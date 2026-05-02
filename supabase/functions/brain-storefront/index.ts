// Brain Storefront — Consultora IA pública para clientes do site
// Conversa, recomenda produtos do catálogo, monta carrinho e gera link de checkout.
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
      name: "search_products",
      description:
        "Busca peças do catálogo Sollaris pelo nome, categoria, material ou pedra. Use SEMPRE que o cliente pedir sugestão, mostrar peças, falar de uma categoria (anéis, brincos, colares, choker, pulseiras, tornozeleiras) ou descrever ocasião.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto livre — nome, material, pedra, descrição" },
          category: { type: "string", description: "Slug da categoria (aneis, brincos, colares, choker, pulseiras, tornozeleiras)" },
          max_price: { type: "number" },
          min_price: { type: "number" },
          limit: { type: "number", description: "Máximo 6, padrão 4" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product",
      description: "Detalhe completo de UMA peça pelo id. Use quando precisar de descrição/medidas/estoque para responder dúvida específica.",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description: "Adiciona uma peça ao carrinho do cliente nesta sessão. Confirme com o cliente antes.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          quantity: { type: "number", description: "Padrão 1" },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_cart",
      description: "Mostra o que está atualmente no carrinho do cliente.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_cart",
      description: "Remove uma peça do carrinho.",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_checkout",
      description:
        "Gera o link final de checkout (Mercado Pago — Pix + Cartão). Use SOMENTE quando o cliente confirmar que quer fechar o pedido com o que está no carrinho.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          customer_email: { type: "string" },
          customer_phone: { type: "string" },
        },
      },
    },
  },
];

// ─────────────────────────────────────────────
// Tool execution
// ─────────────────────────────────────────────
async function executeTool(
  name: string,
  args: any,
  supabase: any,
  ctx: { cart: CartItem[]; origin: string }
): Promise<{ result: string; cart_update?: CartItem[]; checkout_url?: string }> {
  try {
    if (name === "search_products") {
      let q = supabase
        .from("products")
        .select("id, name, price, original_price, images, foto_frontal, material, pedra, banho, description, stock_quantity, categories!inner(name, slug)")
        .eq("stock_status", true)
        .gt("stock_quantity", 0)
        .limit(Math.min(args.limit || 4, 6));

      if (args.category) q = q.eq("categories.slug", args.category);
      if (args.max_price) q = q.lte("price", args.max_price);
      if (args.min_price) q = q.gte("price", args.min_price);
      if (args.query) {
        const term = String(args.query).trim();
        q = q.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,material.ilike.%${term}%,pedra.ilike.%${term}%`
        );
      }

      const { data, error } = await q;
      if (error) return { result: `Erro: ${error.message}` };
      if (!data || data.length === 0) return { result: "Nenhuma peça encontrada com esses critérios." };

      const items = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        original_price: p.original_price,
        image: p.foto_frontal || p.images?.[0] || null,
        category: p.categories?.name,
        material: p.material,
        pedra: p.pedra,
        banho: p.banho,
        description: p.description?.slice(0, 200),
      }));
      return { result: JSON.stringify({ products: items }) };
    }

    if (name === "get_product") {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("id", args.product_id)
        .maybeSingle();
      if (error || !data) return { result: "Peça não encontrada." };
      return {
        result: JSON.stringify({
          id: data.id, name: data.name, price: data.price, original_price: data.original_price,
          description: data.description, material: data.material, pedra: data.pedra, banho: data.banho,
          weight_g: data.weight_g, stock: data.stock_quantity, sizes: data.sizes,
          image: data.foto_frontal || data.images?.[0],
          category: data.categories?.name,
        }),
      };
    }

    if (name === "add_to_cart") {
      const { data: p } = await supabase
        .from("products").select("id, name, price, foto_frontal, images, stock_quantity")
        .eq("id", args.product_id).maybeSingle();
      if (!p) return { result: "Peça não encontrada." };
      const qty = Math.max(1, args.quantity || 1);
      const newCart = [...ctx.cart];
      const existing = newCart.find((c) => c.id === p.id);
      if (existing) existing.quantity += qty;
      else newCart.push({
        id: p.id, name: p.name, price: Number(p.price),
        image: p.foto_frontal || p.images?.[0] || null, quantity: qty,
      });
      return {
        result: JSON.stringify({ ok: true, message: `${p.name} adicionada ao carrinho`, cart: newCart }),
        cart_update: newCart,
      };
    }

    if (name === "view_cart") {
      const total = ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      return { result: JSON.stringify({ items: ctx.cart, total, count: ctx.cart.reduce((s, i) => s + i.quantity, 0) }) };
    }

    if (name === "remove_from_cart") {
      const newCart = ctx.cart.filter((c) => c.id !== args.product_id);
      return { result: JSON.stringify({ ok: true, cart: newCart }), cart_update: newCart };
    }

    if (name === "create_checkout") {
      if (ctx.cart.length === 0) return { result: "Carrinho vazio — adicione peças antes." };
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/mercadopago-checkout-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          items: ctx.cart.map((i) => ({
            id: i.id, title: i.name, quantity: i.quantity,
            unit_price: i.price, picture_url: i.image || undefined,
          })),
          customer_name: args.customer_name,
          customer_email: args.customer_email,
          customer_phone: args.customer_phone,
          return_base_url: ctx.origin,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) return { result: `Erro ao gerar checkout: ${json.error || resp.status}` };
      const url = json.init_point || json.sandbox_init_point;
      return {
        result: JSON.stringify({ ok: true, checkout_url: url, message: "Link de pagamento gerado" }),
        checkout_url: url,
      };
    }

    return { result: `Ferramenta desconhecida: ${name}` };
  } catch (e) {
    return { result: `Erro: ${e instanceof Error ? e.message : String(e)}` };
  }
}

interface CartItem { id: string; name: string; price: number; image: string | null; quantity: number; }

// ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurado");

    const body = await req.json();
    const { messages = [], cart = [], origin = "https://sollarisjoias.com" } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const systemPrompt = `Você é a **Consultora Sollaris**, vendedora pessoal IA da Sollaris Joias — uma joalheria de semijoias premium (banho 18k, 5 micra, pedras naturais, garantia vitalícia).

## Personalidade
- Calorosa, sofisticada, próxima — como uma amiga elegante que entende de joia.
- Concisa, sem tecnicismo. Frases curtas. Português brasileiro.
- Use no máximo 1 emoji por resposta (✨ 💎). Nunca seja "vendedora agressiva".
- Tom editorial, jamais "varejão".

## Sua missão
Conduzir o cliente do "oi" até o checkout SEM ele precisar sair do chat:
1. Entenda a ocasião / estilo / faixa de preço (pergunte 1-2 coisas, no máximo).
2. Use **search_products** para mostrar 3-4 peças reais. NUNCA invente nomes ou preços.
3. Se ele pedir detalhes, use **get_product**.
4. Quando ele disser "quero" / "essa" / "vou levar" → **add_to_cart** e CONFIRME.
5. Mostre o carrinho com **view_cart** quando relevante.
6. Quando confirmar fechamento → peça nome, email e telefone, depois **create_checkout** e entregue o link.

## Regras de ouro
- SEMPRE busque produtos reais. Nunca cite peça que não veio de search_products.
- Formate preço como R$ X.XXX,XX (use vírgula).
- Quando mostrar produtos, descreva 1 frase poética + preço. O sistema renderiza os cards automaticamente — NÃO repita IDs ou URLs no texto.
- Quando entregar o checkout, diga "Pronto! Seu link de pagamento está aqui ↓" — o sistema mostra o botão.
- Se o cliente pedir algo que não temos, sugira o mais próximo do catálogo.
- Nunca prometa prazo de entrega exato — diga "frete grátis acima de R$ 499, prazo de 5 a 10 dias úteis".

## Contexto vivo
- Carrinho atual: ${cart.length === 0 ? "vazio" : `${cart.length} peça(s), total R$ ${cart.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toFixed(2)}`}
- Categorias: Anéis, Brincos, Colares, Choker, Pulseiras, Tornozeleiras.
- Data: ${new Date().toLocaleDateString("pt-BR")}`;

    const allMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    let ctx = { cart: [...cart] as CartItem[], origin };
    let finalText = "";
    let checkoutUrl: string | undefined;
    const productsShown: any[] = [];

    for (let round = 0; round < 6; round++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: allMessages,
          tools: TOOLS,
          tool_choice: "auto",
        }),
      });

      if (!aiResp.ok) {
        const status = aiResp.status;
        const errText = await aiResp.text();
        console.error("AI error:", status, errText);
        if (status === 429) return new Response(JSON.stringify({ error: "Muitas mensagens. Tente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados — avise o time." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await aiResp.json();
      const choice = result.choices?.[0];
      if (!choice) break;

      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length > 0) {
        allMessages.push(choice.message);
        for (const tc of choice.message.tool_calls || []) {
          let fnArgs: any = {};
          try { fnArgs = JSON.parse(tc.function.arguments); } catch (_) {}
          const r = await executeTool(tc.function.name, fnArgs, supabase, ctx);
          if (r.cart_update) ctx.cart = r.cart_update;
          if (r.checkout_url) checkoutUrl = r.checkout_url;
          if (tc.function.name === "search_products") {
            try {
              const parsed = JSON.parse(r.result);
              if (parsed.products) productsShown.push(...parsed.products);
            } catch (_) {}
          }
          allMessages.push({ role: "tool", tool_call_id: tc.id, content: r.result });
        }
        continue;
      }

      finalText = choice.message?.content || "";
      break;
    }

    return new Response(
      JSON.stringify({
        response: finalText,
        cart: ctx.cart,
        products: productsShown,
        checkout_url: checkoutUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("brain-storefront error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
