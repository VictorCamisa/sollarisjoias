// ────────────────────────────────────────────────────────────────────────
// post-sale-automation
//
// Ações automáticas após uma venda:
// 1. Cria/encontra Profile do cliente (por CPF prioritário, depois telefone)
// 2. Enriquece com cpf, endereço, aniversário, email se vieram
// 3. Vincula `orders.customer_id` ao profile
// 4. Envia mensagem de agradecimento via Evolution API (WhatsApp)
//
// Body esperado:
//   {
//     orderId?: string,
//     paymentId?: string,
//     name: string,
//     phone: string,
//     email?: string,
//     cpf?: string,
//     address?: string,
//     birthday?: string (YYYY-MM-DD),
//     wantsVip?: boolean,
//     total?: number,
//     paymentMethod?: "pix" | "cartao",
//     skipWhatsApp?: boolean
//   }
// ────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const onlyDigits = (v?: string | null) =>
  (v ?? "").replace(/\D/g, "");

const normalizePhoneE164 = (raw?: string | null) => {
  const d = onlyDigits(raw);
  if (!d) return null;
  if (d.startsWith("55") && d.length >= 12) return d;
  if (d.length === 11 || d.length === 10) return `55${d}`;
  return d;
};

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      orderId,
      paymentId,
      name,
      phone,
      email,
      cpf,
      address,
      birthday,
      wantsVip,
      total,
      paymentMethod,
      skipWhatsApp,
    } = body ?? {};

    if (!name && !phone && !cpf) {
      return new Response(
        JSON.stringify({ error: "name/phone/cpf required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── 1. Cria/encontra profile (RPC enriquecida) ───
    const { data: profileId, error: rpcErr } = await supabase.rpc(
      "get_or_create_customer_full",
      {
        _name: name ?? "Cliente",
        _phone: phone ?? null,
        _cpf: cpf ?? null,
        _email: email ?? null,
        _address: address ?? null,
        _birthday: birthday || null,
      }
    );

    if (rpcErr) {
      console.error("RPC get_or_create_customer_full erro:", rpcErr);
    }

    // ─── 2. Vincula ao pedido ───
    if (profileId && orderId) {
      const { error: linkErr } = await supabase
        .from("orders")
        .update({ customer_id: profileId })
        .eq("id", orderId);
      if (linkErr) console.error("Erro vincular order→profile:", linkErr);
    }

    // ─── 3. Salva extras (customer_extra_info) se vieram ───
    if (orderId && (cpf || address || birthday || wantsVip)) {
      const { error: extraErr } = await supabase
        .from("customer_extra_info")
        .insert({
          order_id: orderId,
          customer_phone: phone ?? null,
          customer_email: email ?? null,
          cpf: cpf ?? null,
          full_address: address ?? null,
          birthday: birthday || null,
          wants_vip: !!wantsVip,
        });
      if (extraErr) console.warn("customer_extra_info insert:", extraErr.message);
    }

    // ─── 4. Mensagem WhatsApp via Evolution API ───
    let whatsappSent = false;
    let whatsappError: string | null = null;

    if (!skipWhatsApp && phone) {
      const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
      const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

      // Pega instância configurada
      const { data: settings } = await supabase
        .from("settings")
        .select("evolution_instance, store_name")
        .limit(1)
        .maybeSingle();

      const instance = settings?.evolution_instance;
      const storeName = settings?.store_name || "SOLLARIS";

      if (EVOLUTION_API_URL && EVOLUTION_API_KEY && instance) {
        const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
        const phoneE164 = normalizePhoneE164(phone);

        const firstName = (name || "").split(" ")[0] || "";
        const orderShort = (orderId || paymentId || "").slice(0, 8).toUpperCase();
        const isPix = paymentMethod === "pix";

        const message = [
          `Olá${firstName ? `, ${firstName}` : ""}! ✨`,
          ``,
          `Seu pedido na *${storeName}* foi confirmado com muito carinho.`,
          orderShort ? `\n📦 *Pedido* #${orderShort}` : "",
          total ? `💎 *Valor* ${fmtBRL(Number(total))}` : "",
          isPix ? `💚 Pagamento via Pix recebido` : (paymentMethod === "cartao" ? `💳 Pagamento aprovado` : ""),
          ``,
          `Sua peça já está sendo preparada com a curadoria que você merece. Em breve enviaremos atualizações por aqui.`,
          ``,
          `Qualquer dúvida, é só responder esta mensagem 🤍`,
          ``,
          `— Equipe ${storeName}`,
        ].filter(Boolean).join("\n");

        try {
          const sendResp = await fetch(`${baseUrl}/message/sendText/${instance}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: phoneE164,
              text: message,
            }),
          });

          const sendData = await sendResp.json().catch(() => ({}));
          whatsappSent = sendResp.ok;
          if (!sendResp.ok) {
            whatsappError = sendData?.message || sendData?.error || `HTTP ${sendResp.status}`;
            console.error("Evolution sendText falhou:", whatsappError, sendData);
          }
        } catch (err) {
          whatsappError = err instanceof Error ? err.message : String(err);
          console.error("Evolution sendText exceção:", err);
        }
      } else {
        whatsappError = "Evolution API ou instância não configurada";
        console.warn(whatsappError);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        profile_id: profileId,
        whatsapp_sent: whatsappSent,
        whatsapp_error: whatsappError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("post-sale-automation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
