import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch products catalog for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, description, sizes, colors, images, categories(name)")
      .eq("stock_status", true)
      .limit(50);

    const catalog = (products || []).map((p: any) => 
      `- ${p.name} (R$${p.price.toFixed(2)}) | Cat: ${p.categories?.name || 'Sem categoria'} | Tamanhos: ${(p.sizes || []).join(', ')} | Cores: ${(p.colors || []).join(', ')} | ID: ${p.id}`
    ).join("\n");

    const systemPrompt = `Você é a estilista virtual da LARIFA, uma marca de moda feminina AI-First premium. Seu nome é Lari.

Personalidade: Sofisticada, acolhedora, expert em moda. Use emojis com moderação. Seja concisa mas encantadora.

Seu papel:
- Sugerir looks completos baseados na ocasião, estilo ou preferência da cliente
- Combinar peças do catálogo da loja
- Dar dicas de estilo e tendências
- Sempre mencionar os produtos pelo nome e preço

Catálogo atual da LARIFA:
${catalog}

Regras:
- Sempre sugira produtos que existem no catálogo acima
- Monte looks combinando 2-4 peças
- Mencione o preço total do look
- Se não tiver peças adequadas, sugira as mais próximas
- Responda SEMPRE em português brasileiro
- Seja breve: máximo 3-4 parágrafos por resposta`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("style-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
