
-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text UNIQUE,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_seo text,
  ADD COLUMN IF NOT EXISTS banho text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS pedra text,
  ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight_g numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Média',
  ADD COLUMN IF NOT EXISTS foto_frontal text,
  ADD COLUMN IF NOT EXISTS foto_lateral text,
  ADD COLUMN IF NOT EXISTS foto_lifestyle text,
  ADD COLUMN IF NOT EXISTS foto_detalhe text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- Add pix discount config to settings
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS pix_discount_percent numeric DEFAULT 5;

-- Delete existing categories
DELETE FROM public.categories;

-- Insert the 6 new categories
INSERT INTO public.categories (name, slug) VALUES
  ('Brincos', 'brincos'),
  ('Colares', 'colares'),
  ('Anéis', 'aneis'),
  ('Pulseiras', 'pulseiras'),
  ('Conjuntos', 'conjuntos'),
  ('Piercings', 'piercings');
