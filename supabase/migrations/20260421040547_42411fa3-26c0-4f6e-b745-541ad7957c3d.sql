ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_unit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_packaging numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_shipping numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_taxes numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_fees numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS supplier_code text,
  ADD COLUMN IF NOT EXISTS supplier_name text;