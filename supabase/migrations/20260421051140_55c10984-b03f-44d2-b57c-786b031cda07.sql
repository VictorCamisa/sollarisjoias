-- 0) Remove FK profiles.id -> auth.users para permitir clientes sem login
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 1) Coluna installments em orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS installments integer NOT NULL DEFAULT 1;

-- 2) Helper: get_or_create_customer_profile
CREATE OR REPLACE FUNCTION public.get_or_create_customer_profile(_phone text, _name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE pid uuid; digits text;
BEGIN
  IF _phone IS NULL OR length(trim(_phone)) = 0 THEN RETURN NULL; END IF;
  digits := regexp_replace(_phone, '[^0-9]', '', 'g');
  SELECT id INTO pid FROM profiles
   WHERE regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g') = digits LIMIT 1;
  IF pid IS NULL THEN
    pid := gen_random_uuid();
    INSERT INTO profiles (id, full_name, phone, credit_limit, credit_score)
    VALUES (pid, COALESCE(_name,'Cliente'), _phone, 0, 100);
  ELSE
    UPDATE profiles SET full_name = COALESCE(NULLIF(full_name,''), _name)
    WHERE id = pid AND (full_name IS NULL OR full_name = '');
  END IF;
  RETURN pid;
END;
$$;

-- 3) Reescreve trigger
CREATE OR REPLACE FUNCTION public.process_order_integration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb; prod_id uuid; qty integer; current_stock integer;
  installments_count integer; installment_value numeric; i integer; due date;
  is_credit boolean; cust_id uuid;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status AND OLD.payment_method = NEW.payment_method) THEN
    RETURN NEW;
  END IF;

  is_credit := (NEW.payment_method IN ('crediario','prazo','parcelado'));
  installments_count := COALESCE(
    NULLIF(NEW.installments, 0),
    NULLIF((NEW.items->0->>'installments')::int, 0),
    1
  );
  IF installments_count < 1 THEN installments_count := 1; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.customer_id IS NULL AND NEW.customer_phone IS NOT NULL THEN
      cust_id := public.get_or_create_customer_profile(NEW.customer_phone, NEW.customer_name);
      IF cust_id IS NOT NULL THEN
        UPDATE orders SET customer_id = cust_id WHERE id = NEW.id;
        NEW.customer_id := cust_id;
      END IF;
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      prod_id := NULLIF(item->>'product_id','')::uuid;
      qty := COALESCE((item->>'quantity')::int, 1);
      IF prod_id IS NOT NULL THEN
        SELECT stock_quantity INTO current_stock FROM products WHERE id = prod_id;
        IF current_stock IS NOT NULL THEN
          UPDATE products SET stock_quantity = GREATEST(0, current_stock - qty),
                              stock_status = (GREATEST(0, current_stock - qty) > 0),
                              updated_at = now()
           WHERE id = prod_id;
          INSERT INTO stock_movements (product_id, order_id, movement_type, quantity, previous_stock, new_stock, notes)
          VALUES (prod_id, NEW.id, 'venda', -qty, current_stock, GREATEST(0, current_stock - qty),
                  'Venda automática #' || substring(NEW.id::text,1,8));
        END IF;
      END IF;
    END LOOP;

    IF is_credit THEN
      installment_value := ROUND(NEW.total / installments_count, 2);
      FOR i IN 1..installments_count LOOP
        due := (CURRENT_DATE + (i * INTERVAL '30 days'))::date;
        INSERT INTO financial_transactions (order_id, type, sub_type, description, amount,
          customer_name, customer_phone, payment_method, installments, installment_number, due_date, status)
        VALUES (NEW.id, 'income', 'crediario',
          'Venda #' || substring(NEW.id::text,1,8) || ' - Parcela ' || i || '/' || installments_count,
          installment_value, NEW.customer_name, NEW.customer_phone, NEW.payment_method,
          installments_count, i, due, 'pending');
      END LOOP;
    ELSE
      INSERT INTO financial_transactions (order_id, type, sub_type, description, amount,
        customer_name, customer_phone, payment_method, installments, installment_number, paid_date, status)
      VALUES (NEW.id, 'income', 'venda',
        'Venda #' || substring(NEW.id::text,1,8),
        NEW.total, NEW.customer_name, NEW.customer_phone, NEW.payment_method,
        1, 1, CURRENT_DATE, 'paid');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4) BACKFILL
DO $$
DECLARE o RECORD; pid uuid;
BEGIN
  FOR o IN SELECT id, customer_name, customer_phone FROM orders WHERE customer_id IS NULL AND customer_phone IS NOT NULL LOOP
    pid := public.get_or_create_customer_profile(o.customer_phone, o.customer_name);
    IF pid IS NOT NULL THEN UPDATE orders SET customer_id = pid WHERE id = o.id; END IF;
  END LOOP;
END $$;

-- Remove transações erradas (crediário marcado como venda paga)
DELETE FROM financial_transactions
WHERE id IN (
  SELECT ft.id FROM financial_transactions ft
  JOIN orders o ON o.id = ft.order_id
  WHERE o.payment_method IN ('crediario','prazo','parcelado')
    AND (ft.sub_type = 'venda' OR ft.sub_type IS NULL)
);

-- Rosa: vence 05/05/2026
INSERT INTO financial_transactions (order_id, type, sub_type, description, amount, customer_name, customer_phone, payment_method, installments, installment_number, due_date, status)
SELECT id, 'income', 'crediario',
       'Venda #' || substring(id::text,1,8) || ' - Parcela 1/1', total,
       customer_name, customer_phone, payment_method, 1, 1, DATE '2026-05-05', 'pending'
FROM orders WHERE id = '70499a27-5557-4e95-8990-01d4b5cba5a0'
  AND NOT EXISTS (SELECT 1 FROM financial_transactions WHERE order_id = '70499a27-5557-4e95-8990-01d4b5cba5a0' AND sub_type = 'crediario');

-- Claudia: vence 02/05/2026
INSERT INTO financial_transactions (order_id, type, sub_type, description, amount, customer_name, customer_phone, payment_method, installments, installment_number, due_date, status)
SELECT id, 'income', 'crediario',
       'Venda #' || substring(id::text,1,8) || ' - Parcela 1/1', total,
       customer_name, customer_phone, payment_method, 1, 1, DATE '2026-05-02', 'pending'
FROM orders WHERE id = 'ef011a36-9fc0-45f1-b30b-c012238cefd5'
  AND NOT EXISTS (SELECT 1 FROM financial_transactions WHERE order_id = 'ef011a36-9fc0-45f1-b30b-c012238cefd5' AND sub_type = 'crediario');
