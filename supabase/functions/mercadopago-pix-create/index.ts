// Edge function: cria pagamento Pix dinâmico via Mercado Pago
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PixPayload {
  amount: number;
  description?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_id?: string;
  expires_in_minutes?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const body = (await req.json()) as PixPayload;

    if (!body.amount || body.amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiresInMinutes = body.expires_in_minutes ?? 30;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Email é obrigatório no MP — usa fallback se não tiver
    const payerEmail = body.customer_email || "cliente@sollaris.com.br";
    const fullName = body.customer_name?.trim() || "Cliente Sollaris";
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || "Sollaris";

    // Idempotência: chave única por requisição
    const idempotencyKey = crypto.randomUUID();

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Number(body.amount.toFixed(2)),
        description: body.description || "Compra Sollaris Semijoias",
        payment_method_id: "pix",
        date_of_expiration: expiresAt.toISOString().replace("Z", "-00:00"),
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
        },
        metadata: {
          order_id: body.order_id || null,
          customer_phone: body.customer_phone || null,
        },
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP API error:", JSON.stringify(mpData));
      return new Response(
        JSON.stringify({
          error: "Falha ao criar Pix no Mercado Pago",
          details: mpData,
        }),
        { status: mpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qrCode = mpData?.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 =
      mpData?.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl =
      mpData?.point_of_interaction?.transaction_data?.ticket_url;

    // Persiste no banco com service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pixRow, error: insertErr } = await supabase
      .from("pix_transactions")
      .insert({
        mp_payment_id: String(mpData.id),
        order_id: body.order_id || null,
        customer_name: body.customer_name || null,
        customer_phone: body.customer_phone || null,
        customer_email: body.customer_email || null,
        amount: body.amount,
        description: body.description || null,
        status: mpData.status === "approved" ? "paid" : "pending",
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        expires_at: expiresAt.toISOString(),
        raw_response: mpData,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao salvar pix_transaction:", insertErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: pixRow?.id,
        mp_payment_id: mpData.id,
        status: mpData.status,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        amount: body.amount,
        expires_at: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("mercadopago-pix-create error:", err);
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
