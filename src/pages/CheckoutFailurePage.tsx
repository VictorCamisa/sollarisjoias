import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";

const CheckoutFailurePage = () => {
  const [params] = useSearchParams();
  const paymentId = params.get("payment_id");

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-destructive" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-foreground">Pagamento não concluído</h1>
          <p className="font-sans text-sm text-muted-foreground">
            Houve um problema ao processar seu pagamento. Os itens da sacola foram mantidos para você tentar novamente.
          </p>
        </div>

        {paymentId && (
          <p className="text-xs text-muted-foreground font-mono">ID: {paymentId}</p>
        )}

        <div className="flex flex-col gap-2 pt-4">
          <Link
            to="/"
            className="w-full h-12 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full flex items-center justify-center"
          >
            Tentar novamente
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

export default CheckoutFailurePage;
