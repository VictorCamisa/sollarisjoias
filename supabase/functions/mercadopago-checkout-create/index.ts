// Edge function: cria Preference do Checkout Pro do Mercado Pago (Pix + Cartão)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PrefItem {
  id?: string;
  title: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
}

interface CheckoutPayload {
  items: PrefItem[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_id?: string;
  return_base_url?: string; // URL base da loja (https://sollarisjoias.lovable.app)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const body = (await req.json()) as CheckoutPayload;

    if (!body.items?.length) {
      return new Response(JSON.stringify({ error: "Carrinho vazio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const total = body.items.reduce(
      (sum, i) => sum + Number(i.unit_price) * Number(i.quantity),
      0
    );

    const baseUrl = body.return_base_url?.replace(/\/$/, "") || "https://sollarisjoias.lovable.app";
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;

    const fullName = body.customer_name?.trim() || "Cliente Sollaris";
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || "Sollaris";

    const preference = {
      items: body.items.map((i) => ({
        id: i.id || crypto.randomUUID(),
        title: i.title,
        quantity: Number(i.quantity),
        unit_price: Number(Number(i.unit_price).toFixed(2)),
        currency_id: "BRL",
        picture_url: i.picture_url,
      })),
      payer: {
        name: firstName,
        surname: lastName,
        email: body.customer_email || undefined,
        phone: body.customer_phone
          ? { number: body.customer_phone.replace(/\D/g, "") }
          : undefined,
      },
      payment_methods: {
        // Métodos aceitos: Pix + Cartão (crédito e débito)
        excluded_payment_types: [
          { id: "ticket" }, // exclui boleto
          { id: "atm" },
        ],
        installments: 12,             // até 12 parcelas
        default_installments: 1,
      },
      back_urls: {
        success: `${baseUrl}/checkout/sucesso`,
        pending: `${baseUrl}/checkout/pendente`,
        failure: `${baseUrl}/checkout/falha`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      external_reference: body.order_id || crypto.randomUUID(),
      statement_descriptor: "SOLLARIS",
      metadata: {
        order_id: body.order_id || null,
        customer_phone: body.customer_phone || null,
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP Preference error:", JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ error: "Falha ao criar checkout MP", details: mpData }),
        { status: mpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Persiste registro no banco para rastreamento (reutiliza pix_transactions
    // como tabela de pagamentos MP genérica — método será atualizado pelo webhook)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("pix_transactions").insert({
      mp_payment_id: `pref_${mpData.id}`, // marca como preference (será sobrescrito pelo webhook com payment id real)
      order_id: body.order_id || null,
      customer_name: body.customer_name || null,
      customer_phone: body.customer_phone || null,
      customer_email: body.customer_email || null,
      amount: total,
      description: `Checkout MP (${body.items.length} itens)`,
      status: "pending",
      ticket_url: mpData.init_point,
      raw_response: { preference: mpData, external_reference: preference.external_reference },
    });

    return new Response(
      JSON.stringify({
        success: true,
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        external_reference: preference.external_reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("mercadopago-checkout-create error:", err);
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
