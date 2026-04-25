// Processa pagamentos do Checkout Bricks (Pix + Cartão tokenizado) — fluxo nativo no site
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentPayload {
  // Dados vindos do Brick
  formData: {
    token?: string;
    issuer_id?: string;
    payment_method_id: string; // 'pix' | 'visa' | 'master' | etc
    transaction_amount: number;
    installments?: number;
    payer: {
      email: string;
      identification?: { type: string; number: string };
      first_name?: string;
      last_name?: string;
    };
  };
  // Contexto adicional
  description?: string;
  order_id?: string;
  customer_name?: string;
  customer_phone?: string;
  items?: Array<{ id?: string; title: string; quantity: number; unit_price: number }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const body = (await req.json()) as PaymentPayload;
    const { formData } = body;

    if (!formData?.payment_method_id || !formData?.transaction_amount) {
      return new Response(
        JSON.stringify({ error: "Dados de pagamento inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`;
    const externalRef = body.order_id || crypto.randomUUID();
    const isPix = formData.payment_method_id === "pix";

    // Monta payload pra API MP
    const mpPayload: Record<string, unknown> = {
      transaction_amount: Number(formData.transaction_amount),
      payment_method_id: formData.payment_method_id,
      payer: {
        email: formData.payer.email,
        first_name: formData.payer.first_name,
        last_name: formData.payer.last_name,
        identification: formData.payer.identification,
      },
      description: body.description || `Pedido Sollaris (${body.items?.length || 1} itens)`,
      external_reference: externalRef,
      notification_url: webhookUrl,
      statement_descriptor: "SOLLARIS",
      metadata: {
        order_id: body.order_id || null,
        customer_phone: body.customer_phone || null,
      },
    };

    if (isPix) {
      // Pix expira em 30 min
      const expires = new Date(Date.now() + 30 * 60 * 1000);
      mpPayload.date_of_expiration = expires.toISOString();
    } else {
      // Cartão: token + parcelas
      mpPayload.token = formData.token;
      mpPayload.installments = Number(formData.installments) || 1;
      if (formData.issuer_id) mpPayload.issuer_id = formData.issuer_id;
      mpPayload.capture = true;
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP Payment error:", JSON.stringify(mpData));
      return new Response(
        JSON.stringify({
          error: mpData?.message || "Falha ao processar pagamento",
          details: mpData,
        }),
        { status: mpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Persiste no banco
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const localStatus =
      mpData.status === "approved"
        ? "paid"
        : mpData.status === "rejected" || mpData.status === "cancelled"
        ? "cancelled"
        : "pending";

    const transactionRow = {
      mp_payment_id: String(mpData.id),
      order_id: body.order_id || null,
      customer_name: body.customer_name || null,
      customer_phone: body.customer_phone || null,
      customer_email: formData.payer.email || null,
      amount: Number(formData.transaction_amount),
      description: mpPayload.description as string,
      status: localStatus,
      qr_code: isPix ? mpData.point_of_interaction?.transaction_data?.qr_code || null : null,
      qr_code_base64: isPix
        ? mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null
        : null,
      ticket_url: isPix
        ? mpData.point_of_interaction?.transaction_data?.ticket_url || null
        : null,
      expires_at: isPix ? mpPayload.date_of_expiration as string : null,
      paid_at: localStatus === "paid" ? new Date().toISOString() : null,
      raw_response: mpData,
    };

    await supabase.from("pix_transactions").insert(transactionRow);

    // Se cartão aprovado e tem order, marca como paga
    if (localStatus === "paid" && body.order_id) {
      await supabase.from("orders").update({ status: "paid" }).eq("id", body.order_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: mpData.status, // approved, pending, rejected
        status_detail: mpData.status_detail,
        payment_id: mpData.id,
        // Pix specific
        qr_code: isPix ? mpData.point_of_interaction?.transaction_data?.qr_code : undefined,
        qr_code_base64: isPix
          ? mpData.point_of_interaction?.transaction_data?.qr_code_base64
          : undefined,
        ticket_url: isPix
          ? mpData.point_of_interaction?.transaction_data?.ticket_url
          : undefined,
        expires_at: isPix ? mpPayload.date_of_expiration : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("mercadopago-process-payment error:", err);
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
