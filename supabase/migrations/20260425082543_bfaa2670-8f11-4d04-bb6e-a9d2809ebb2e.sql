ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_cpf text,
  ADD COLUMN IF NOT EXISTS shipping_zip text,
  ADD COLUMN IF NOT EXISTS shipping_street text,
  ADD COLUMN IF NOT EXISTS shipping_number text,
  ADD COLUMN IF NOT EXISTS shipping_complement text,
  ADD COLUMN IF NOT EXISTS shipping_neighborhood text,
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_state text,
  ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_carrier text,
  ADD COLUMN IF NOT EXISTS shipping_eta_days integer;