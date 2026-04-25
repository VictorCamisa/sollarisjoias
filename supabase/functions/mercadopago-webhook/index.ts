// Webhook: recebe notificações do Mercado Pago e atualiza status do Pix
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const url = new URL(req.url);
    let paymentId: string | null = url.searchParams.get("data.id") || url.searchParams.get("id");
    let topic = url.searchParams.get("type") || url.searchParams.get("topic");

    // Body pode vir tbm
    if (req.method === "POST") {
      try {
        const body = await req.json();
        paymentId = paymentId || body?.data?.id?.toString() || body?.id?.toString();
        topic = topic || body?.type || body?.topic;
      } catch {
        // sem body, segue
      }
    }

    console.log("MP Webhook received:", { paymentId, topic });

    if (!paymentId || (topic && topic !== "payment")) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca detalhes do pagamento na API MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });

    if (!mpRes.ok) {
      console.error("Erro ao buscar pagamento MP:", mpRes.status);
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await mpRes.json();
    const mpStatus = payment.status; // approved, pending, rejected, cancelled, refunded

    let localStatus = "pending";
    if (mpStatus === "approved") localStatus = "paid";
    else if (mpStatus === "rejected" || mpStatus === "cancelled") localStatus = "cancelled";
    else if (mpStatus === "refunded") localStatus = "refunded";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const updates: Record<string, unknown> = {
      status: localStatus,
      raw_response: payment,
      mp_payment_id: String(paymentId),
    };
    if (localStatus === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    // Tenta localizar pelo payment_id direto OU pelo external_reference (Checkout Pro)
    const externalRef = payment.external_reference;
    let pixRow: any = null;

    const { data: byPaymentId } = await supabase
      .from("pix_transactions")
      .select("*")
      .eq("mp_payment_id", String(paymentId))
      .maybeSingle();

    if (byPaymentId) {
      const { data } = await supabase
        .from("pix_transactions")
        .update(updates)
        .eq("id", byPaymentId.id)
        .select()
        .single();
      pixRow = data;
    } else if (externalRef) {
      // Busca pelo external_reference (Checkout Pro grava como order_id ou no raw_response)
      const { data: byOrder } = await supabase
        .from("pix_transactions")
        .select("*")
        .or(`order_id.eq.${externalRef},mp_payment_id.eq.pref_${externalRef}`)
        .maybeSingle();
      if (byOrder) {
        const { data } = await supabase
          .from("pix_transactions")
          .update(updates)
          .eq("id", byOrder.id)
          .select()
          .single();
        pixRow = data;
      }
    }

    // Se pago e tem order vinculada, marca order como paga
    if (localStatus === "paid" && pixRow?.order_id) {
      await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", pixRow.order_id);
    }

    return new Response(JSON.stringify({ ok: true, status: localStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("mercadopago-webhook error:", err);
    // Retorna 200 pra MP não ficar reenviando indefinidamente
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
