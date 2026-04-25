import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutItem {
  id?: string;
  title: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
}

interface StartCheckoutOptions {
  items: CheckoutItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderId?: string;
}

/**
 * Hook para iniciar o Checkout Pro do Mercado Pago.
 * Cria a preference no backend e redireciona o cliente pra página de pagamento do MP.
 */
export const useMercadoPagoCheckout = () => {
  const [loading, setLoading] = useState(false);

  const startCheckout = async (opts: StartCheckoutOptions) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "mercadopago-checkout-create",
        {
          body: {
            items: opts.items,
            customer_name: opts.customerName,
            customer_phone: opts.customerPhone,
            customer_email: opts.customerEmail,
            order_id: opts.orderId,
            return_base_url: window.location.origin,
          },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) throw new Error("URL de checkout não retornada");

      // Redireciona pro Checkout Pro do Mercado Pago
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar checkout";
      toast.error(msg);
      setLoading(false);
    }
  };

  return { startCheckout, loading };
};
