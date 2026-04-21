---
name: Integração Vendas-Financeiro-Estoque + Crediário
description: Triggers automáticos no banco que conectam toda venda → baixa estoque + gera transação financeira + parcelas de crediário. Módulo /admin/crediario gerencia tudo.
type: feature
---

**Triggers automáticos (no banco):**
- `process_order_integration` (AFTER INSERT em orders): para cada item, decrementa `stock_quantity`, registra em `stock_movements`, e gera `financial_transactions` (1 paga se à vista; N pendentes a cada 30 dias se crediário). Detecta crediário via `payment_method IN ('crediario','prazo','parcelado')` e `items[0].installments`.
- `update_credit_score_on_payment` (AFTER UPDATE em financial_transactions): quando parcela `crediario` vira `paid`, ajusta `profiles.credit_score` (+2 se em dia, 0 se ≤7d atraso, -5 se ≤30d, -15 se >30d).

**Schema novo:**
- `profiles`: + `credit_limit numeric`, `credit_score integer DEFAULT 100`, `credit_blocked boolean`.
- `stock_movements`: auditoria de toda saída/entrada (product_id, order_id, movement_type, quantity, previous/new_stock).
- View `crediario_summary` (security_invoker=on): agrega total devido, atraso, parcelas abertas, próximo vencimento por cliente.

**Página `/admin/crediario`** (hub Finanças, ícone CreditCard):
- KPIs: total a receber, em atraso, clientes ativos, ticket médio.
- Tab Clientes: tabela com saldo devedor, score colorido (≥80 success, ≥50 warning, <50 destructive), badge "Excelente/Regular/Baixo/Crítico". Ação: editar limite + bloquear novo crediário.
- Tab Parcelas: todas pending por vencimento. Ações: "Cobrar" (WhatsApp pré-formatado) e "Quitar" (marca paid → dispara trigger de score).

**Importante:** crediário sempre passa pelo banco (gatilho), nunca pela aplicação. Toda integração futura (PDV, importação) herda o comportamento.
