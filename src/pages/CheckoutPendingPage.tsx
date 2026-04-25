import { Link, useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";

const CheckoutPendingPage = () => {
  const [params] = useSearchParams();
  const paymentId = params.get("payment_id");

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-foreground">Pagamento em análise</h1>
          <p className="font-sans text-sm text-muted-foreground">
            Estamos aguardando a confirmação do pagamento. Você receberá uma notificação assim que for aprovado.
          </p>
        </div>

        {paymentId && (
          <p className="text-xs text-muted-foreground font-mono">ID: {paymentId}</p>
        )}

        <Link
          to="/"
          className="inline-flex w-full h-12 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase rounded-full items-center justify-center"
        >
          Voltar para a loja
        </Link>
      </div>
    </div>
  );
};

export default CheckoutPendingPage;
