import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const CheckoutSuccessPage = () => {
  const [params] = useSearchParams();
  const { clearCart } = useCart();
  const paymentId = params.get("payment_id");
  const status = params.get("status");

  useEffect(() => {
    // Limpa carrinho ao chegar com sucesso
    clearCart();
  }, []);

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-accent" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-foreground">Pagamento confirmado</h1>
          <p className="font-sans text-sm text-muted-foreground">
            Recebemos seu pagamento. Em breve você receberá os detalhes do pedido por WhatsApp.
          </p>
        </div>

        {paymentId && (
          <p className="text-xs text-muted-foreground font-mono">
            ID: {paymentId} {status && `· ${status}`}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-4">
          <Link
            to="/"
            className="w-full h-12 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full flex items-center justify-center"
          >
            Continuar comprando
          </Link>
          <a
            href="https://wa.me/5512991895250"
            target="_blank"
            rel="noopener"
            className="w-full h-12 border border-border text-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full flex items-center justify-center"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
