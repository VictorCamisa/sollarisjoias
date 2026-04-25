-- ═══════════════════════════════════════════════════════════════
-- INTEGRAÇÃO VENDAS ↔ FINANCEIRO ↔ ESTOQUE ↔ CLIENTES + CREDIÁRIO
-- ═══════════════════════════════════════════════════════════════

-- 1) Crediário: campos no profiles para limite e score
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_score integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS credit_blocked boolean DEFAULT false;

-- 2) Garantir colunas necessárias em financial_transactions (já existem, só confirma)
-- order_id, installments, installment_number, customer_name, customer_phone, due_date, paid_date, status
-- Adicionar sub_type = 'crediario' quando for venda a prazo

-- 3) Movimentações de estoque (auditoria)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  order_id uuid,
  movement_type text NOT NULL, -- 'venda', 'entrada', 'ajuste', 'devolucao'
  quantity integer NOT NULL,   -- negativo para saída
  previous_stock integer,
  new_stock integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stock_movements"
  ON public.stock_movements FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) FUNCTION: processa venda -> gera transações financeiras + baixa estoque
CREATE OR REPLACE FUNCTION public.process_order_integration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  prod_id uuid;
  qty integer;
  current_stock integer;
  installments_count integer;
  installment_value numeric;
  i integer;
  due date;
  is_credit boolean;
BEGIN
  -- Só processa em INSERT ou quando status muda para confirmado
  IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;

  -- Detecta crediário
  is_credit := (NEW.payment_method IN ('crediario', 'prazo', 'parcelado'));
  installments_count := COALESCE((NEW.items->0->>'installments')::int, 1);
  IF installments_count < 1 THEN installments_count := 1; END IF;

  -- 4a) BAIXA DE ESTOQUE (somente no INSERT)
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      prod_id := (item->>'product_id')::uuid;
      qty := COALESCE((item->>'quantity')::int, 1);
      
      IF prod_id IS NOT NULL THEN
        SELECT stock_quantity INTO current_stock FROM products WHERE id = prod_id;
        
        IF current_stock IS NOT NULL THEN
          UPDATE products
          SET stock_quantity = GREATEST(0, current_stock - qty),
              stock_status = (GREATEST(0, current_stock - qty) > 0),
              updated_at = now()
          WHERE id = prod_id;

          INSERT INTO stock_movements (product_id, order_id, movement_type, quantity, previous_stock, new_stock, notes)
          VALUES (prod_id, NEW.id, 'venda', -qty, current_stock, GREATEST(0, current_stock - qty),
                  'Venda automática #' || substring(NEW.id::text, 1, 8));
        END IF;
      END IF;
    END LOOP;

    -- 4b) GERA TRANSAÇÕES FINANCEIRAS
    IF is_credit AND installments_count > 1 THEN
      installment_value := ROUND(NEW.total / installments_count, 2);
      FOR i IN 1..installments_count LOOP
        due := (CURRENT_DATE + (i * INTERVAL '30 days'))::date;
        INSERT INTO financial_transactions (
          order_id, type, sub_type, description, amount,
          customer_name, customer_phone, payment_method,
          installments, installment_number, due_date, status
        ) VALUES (
          NEW.id, 'income', 'crediario',
          'Venda #' || substring(NEW.id::text, 1, 8) || ' - Parcela ' || i || '/' || installments_count,
          installment_value, NEW.customer_name, NEW.customer_phone, NEW.payment_method,
          installments_count, i, due, 'pending'
        );
      END LOOP;
    ELSE
      INSERT INTO financial_transactions (
        order_id, type, sub_type, description, amount,
        customer_name, customer_phone, payment_method,
        installments, installment_number, paid_date, status
      ) VALUES (
        NEW.id, 'income', 'venda',
        'Venda #' || substring(NEW.id::text, 1, 8),
        NEW.total, NEW.customer_name, NEW.customer_phone, NEW.payment_method,
        1, 1, CURRENT_DATE, 'paid'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) TRIGGER em orders
DROP TRIGGER IF EXISTS trg_process_order ON public.orders;
CREATE TRIGGER trg_process_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_order_integration();

-- 6) FUNCTION: quando uma parcela é marcada como paga, atualiza credit_score
CREATE OR REPLACE FUNCTION public.update_credit_score_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cust_id uuid;
  days_late integer;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.sub_type = 'crediario' THEN
    SELECT customer_id INTO cust_id FROM orders WHERE id = NEW.order_id;
    
    IF cust_id IS NOT NULL AND NEW.due_date IS NOT NULL THEN
      days_late := GREATEST(0, (CURRENT_DATE - NEW.due_date));
      
      UPDATE profiles
      SET credit_score = GREATEST(0, LEAST(100, credit_score + CASE
        WHEN days_late = 0 THEN 2
        WHEN days_late <= 7 THEN 0
        WHEN days_late <= 30 THEN -5
        ELSE -15
      END))
      WHERE id = cust_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_credit_score ON public.financial_transactions;
CREATE TRIGGER trg_update_credit_score
  AFTER UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_credit_score_on_payment();

-- 7) VIEW: resumo crediário por cliente
CREATE OR REPLACE VIEW public.crediario_summary AS
SELECT
  p.id AS customer_id,
  p.full_name,
  p.phone,
  p.credit_limit,
  p.credit_score,
  p.credit_blocked,
  COALESCE(SUM(CASE WHEN ft.status = 'pending' THEN ft.amount ELSE 0 END), 0) AS total_owed,
  COALESCE(SUM(CASE WHEN ft.status = 'pending' AND ft.due_date < CURRENT_DATE THEN ft.amount ELSE 0 END), 0) AS total_overdue,
  COUNT(CASE WHEN ft.status = 'pending' THEN 1 END) AS open_installments,
  COUNT(CASE WHEN ft.status = 'pending' AND ft.due_date < CURRENT_DATE THEN 1 END) AS overdue_installments,
  MIN(CASE WHEN ft.status = 'pending' THEN ft.due_date END) AS next_due_date,
  MAX(ft.paid_date) AS last_payment_date
FROM profiles p
LEFT JOIN orders o ON o.customer_id = p.id
LEFT JOIN financial_transactions ft ON ft.order_id = o.id AND ft.sub_type = 'crediario'
GROUP BY p.id, p.full_name, p.phone, p.credit_limit, p.credit_score, p.credit_blocked
HAVING COUNT(CASE WHEN ft.status = 'pending' THEN 1 END) > 0
   OR p.credit_limit > 0;

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_order ON public.financial_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_subtype_status ON public.financial_transactions(sub_type, status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);