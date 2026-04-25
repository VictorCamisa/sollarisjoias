import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Calendar, CreditCard, StickyNote, User, ArrowUpRight, ArrowDownRight, CheckCircle2, Trash2 } from "lucide-react";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente", paid: "Pago", overdue: "Atrasado", cancelled: "Cancelado",
};

const typeLabels: Record<string, string> = {
  income: "Receita", expense: "Despesa", purchase: "Compra", investment: "Investimento",
};

const paymentLabels: Record<string, string> = {
  pix: "PIX", cartao_credito: "Cartão de Crédito", cartao_debito: "Cartão de Débito",
  dinheiro: "Dinheiro", transferencia: "Transferência", boleto: "Boleto", crediario: "Crediário",
};

interface Props {
  transaction: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const TransactionDetailDrawer = ({ transaction: t, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();

  const markPaid = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financial_transactions")
        .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
        .eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financial-transactions"] });
      toast.success("Marcado como pago!");
      onOpenChange(false);
    },
  });

  const deleteTx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("financial_transactions").delete().eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financial-transactions"] });
      toast.success("Transação excluída!");
      onOpenChange(false);
    },
  });

  if (!t) return null;

  const isIncome = t.type === "income";
  const isCrediario = t.sub_type === "crediario" || t.payment_method === "crediario";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isIncome ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              {isIncome ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-red-400" />}
            </div>
            {t.description}
          </SheetTitle>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge className={`text-[10px] border ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge>
            <Badge variant="outline" className="text-[10px]">{typeLabels[t.type] || t.type}</Badge>
            {isCrediario && <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">Crediário</Badge>}
            {t.sub_type && t.sub_type !== t.type && (
              <Badge variant="outline" className="text-[10px] capitalize">{t.sub_type}</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Amount */}
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Valor</p>
            <p className={`text-3xl font-bold tabular-nums ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
              {isIncome ? "+" : "-"} {fmtBRL(Number(t.amount))}
            </p>
            {t.installments > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Parcela {t.installment_number}/{t.installments}
              </p>
            )}
          </div>

          {/* Customer */}
          {t.customer_name && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente / Devedor</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t.customer_name}</span>
                </div>
                {t.customer_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{t.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detalhes</h3>
            <div className="grid grid-cols-2 gap-2">
              {t.payment_method && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Pagamento</p>
                    <p className="text-xs font-medium">{paymentLabels[t.payment_method] || t.payment_method}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Vencimento</p>
                  <p className="text-xs font-medium">
                    {t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>
              {t.paid_date && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Pago em</p>
                    <p className="text-xs font-medium">
                      {new Date(t.paid_date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Criado em</p>
                  <p className="text-xs font-medium">
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {t.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <StickyNote className="h-3 w-3" />
                Observações
              </h3>
              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">{t.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          {t.status === "pending" && (
            <Button size="sm" className="flex-1 gap-1.5" onClick={() => markPaid.mutate()} disabled={markPaid.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Marcar como Pago
            </Button>
          )}
          {t.customer_phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const msg = `Olá ${t.customer_name}! Lembrete sobre o pagamento de ${fmtBRL(Number(t.amount))} referente a: ${t.description}`;
                window.open(`https://wa.me/${t.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
              }}
            >
              <Phone className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { if (confirm("Excluir esta transação?")) deleteTx.mutate(); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
