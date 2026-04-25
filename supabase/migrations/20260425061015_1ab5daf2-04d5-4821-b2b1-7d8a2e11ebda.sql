CREATE TABLE IF NOT EXISTS public.customer_extra_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_phone text,
  customer_email text,
  cpf text,
  full_address text,
  birthday date,
  wants_vip boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_extra_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert extra info"
  ON public.customer_extra_info FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage extra info"
  ON public.customer_extra_info FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_customer_extra_info_order ON public.customer_extra_info(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_extra_info_phone ON public.customer_extra_info(customer_phone);