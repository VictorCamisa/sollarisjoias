
-- Expand suppliers with richer fields
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

-- Create supplier_quotations table
CREATE TABLE public.supplier_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  title text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  total numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  notes text,
  requested_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  valid_until date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage supplier_quotations"
  ON public.supplier_quotations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_supplier_quotations_updated_at
  BEFORE UPDATE ON public.supplier_quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
