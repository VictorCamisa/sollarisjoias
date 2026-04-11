ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sale_channel text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS sold_by uuid,
  ADD COLUMN IF NOT EXISTS sold_by_name text,
  ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone DEFAULT now();