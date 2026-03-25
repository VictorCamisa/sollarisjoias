
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pix',
  ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installment_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sub_type text;
