import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

export interface TransactionForm {
  type: string;
  sub_type: string;
  description: string;
  amount: string;
  due_date: string;
  paid_date: string;
  status: string;
  notes: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  installments: string;
  installment_number: string;
}

export const emptyTransactionForm: TransactionForm = {
  type: "expense", sub_type: "", description: "", amount: "",
  due_date: "", paid_date: "", status: "pending", notes: "",
  customer_name: "", customer_phone: "", payment_method: "pix",
  installments: "1", installment_number: "1",
};

const typeOptions = [
  { value: "income", label: "💰 Receita" },
  { value: "expense", label: "💸 Despesa" },
  { value: "purchase", label: "🛒 Compra" },
  { value: "investment", label: "📈 Investimento" },
  { value: "crediario", label: "📋 Crediário" },
];

const subTypeOptions: Record<string, { value: string; label: string }[]> = {
  income: [
    { value: "venda", label: "Venda" },
    { value: "servico", label: "Serviço" },
    { value: "comissao", label: "Comissão" },
    { value: "outro", label: "Outro" },
  ],
  expense: [
    { value: "aluguel", label: "Aluguel" },
    { value: "salario", label: "Salário" },
    { value: "marketing", label: "Marketing" },
    { value: "embalagem", label: "Embalagem" },
    { value: "frete", label: "Frete" },
    { value: "imposto", label: "Imposto" },
    { value: "outro", label: "Outro" },
  ],
  purchase: [
    { value: "material", label: "Material" },
    { value: "produto", label: "Produto para revenda" },
    { value: "equipamento", label: "Equipamento" },
    { value: "outro", label: "Outro" },
  ],
  investment: [
    { value: "marketing", label: "Marketing" },
    { value: "infraestrutura", label: "Infraestrutura" },
    { value: "educacao", label: "Educação/Curso" },
    { value: "outro", label: "Outro" },
  ],
  crediario: [
    { value: "parcela", label: "Parcela" },
  ],
};

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "crediario", label: "Crediário" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: TransactionForm;
  setForm: (f: TransactionForm) => void;
}

export const NewTransactionDialog = ({ open, onOpenChange, form, setForm }: Props) => {
  const queryClient = useQueryClient();

  const set = (key: keyof TransactionForm, value: string) => setForm({ ...form, [key]: value });

  const isCrediario = form.type === "crediario";
  const hasCustomer = isCrediario || form.type === "income";

  const createMutation = useMutation({
    mutationFn: async () => {
      const installments = parseInt(form.installments) || 1;

      if (isCrediario && installments > 1) {
        // Create multiple installment entries
        const totalAmount = parseFloat(form.amount) || 0;
        const installmentAmount = totalAmount / installments;
        const baseDate = form.due_date ? new Date(form.due_date + "T12:00:00") : new Date();

        const entries = Array.from({ length: installments }, (_, i) => {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          return {
            type: "income" as const,
            sub_type: "crediario",
            description: `${form.description} (${i + 1}/${installments})`,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split("T")[0],
            status: "pending",
            notes: form.notes || null,
            customer_name: form.customer_name || null,
            customer_phone: form.customer_phone || null,
            payment_method: "crediario",
            installments,
            installment_number: i + 1,
          };
        });

        const { error } = await supabase.from("financial_transactions").insert(entries);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("financial_transactions").insert({
          type: form.type === "crediario" ? "income" : form.type === "purchase" || form.type === "investment" ? "expense" : form.type,
          sub_type: form.sub_type || form.type,
          description: form.description,
          amount: parseFloat(form.amount) || 0,
          due_date: form.due_date || null,
          paid_date: form.paid_date || null,
          status: form.status,
          notes: form.notes || null,
          customer_name: form.customer_name || null,
          customer_phone: form.customer_phone || null,
          payment_method: form.payment_method,
          installments: 1,
          installment_number: 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financial-transactions"] });
      toast.success("Transação registrada!");
      onOpenChange(false);
      setForm(emptyTransactionForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Nova Transação
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo de transação *</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.value, sub_type: "" })}
                  className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-colors border ${
                    form.type === opt.value
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-type */}
          {subTypeOptions[form.type] && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subcategoria</Label>
              <Select value={form.sub_type} onValueChange={(v) => set("sub_type", v)}>
                <SelectTrigger className="admin-input"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {subTypeOptions[form.type].map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description & Amount */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição *</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} className="admin-input" placeholder="Ex: Compra de materiais" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {isCrediario ? "Valor Total *" : "Valor (R$) *"}
              </Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="admin-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
              <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v)}>
                <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Installments for crediário */}
          {isCrediario && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nº de Parcelas</Label>
                <Input type="number" min="1" value={form.installments} onChange={(e) => set("installments", e.target.value)} className="admin-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor por parcela</Label>
                <p className="text-sm font-semibold text-primary pt-2 tabular-nums">
                  {((parseFloat(form.amount) || 0) / (parseInt(form.installments) || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
          )}

          {/* Customer info */}
          {hasCustomer && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isCrediario ? "Nome do devedor" : "Nome do cliente"}
                </Label>
                <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} className="admin-input" placeholder="Nome" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</Label>
                <Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} className="admin-input" placeholder="(00) 00000-0000" />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {isCrediario ? "1ª Parcela em" : "Vencimento"}
              </Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className="admin-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="admin-input min-h-[60px] resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" disabled={!form.description || !form.amount || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? "Salvando..." : isCrediario ? `Criar ${form.installments} parcela(s)` : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
