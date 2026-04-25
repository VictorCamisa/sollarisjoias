CREATE TABLE public.pix_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mp_payment_id TEXT UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pix_mp_payment_id ON public.pix_transactions(mp_payment_id);
CREATE INDEX idx_pix_status ON public.pix_transactions(status);
CREATE INDEX idx_pix_order_id ON public.pix_transactions(order_id);

ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pix_transactions"
ON public.pix_transactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create pix_transactions"
ON public.pix_transactions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public read own pix by id"
ON public.pix_transactions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE TRIGGER update_pix_transactions_updated_at
BEFORE UPDATE ON public.pix_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();