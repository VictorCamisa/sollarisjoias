
-- Make supplier_id nullable so quotations can exist without a supplier
ALTER TABLE public.supplier_quotations ALTER COLUMN supplier_id DROP NOT NULL;

-- Add external supplier name for quotations without registered supplier
ALTER TABLE public.supplier_quotations ADD COLUMN IF NOT EXISTS supplier_name_external text;

-- Add category to group quotations for comparison
ALTER TABLE public.supplier_quotations ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral';
