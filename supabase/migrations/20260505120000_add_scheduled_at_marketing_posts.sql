ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

UPDATE public.marketing_posts
  SET status = 'rascunho'
  WHERE status IS NULL;
