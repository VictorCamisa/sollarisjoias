
CREATE TABLE public.marketing_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'Instagram',
  prompt TEXT NOT NULL,
  caption TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}'::TEXT[],
  image_url TEXT,
  style TEXT DEFAULT 'dark',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  platform_tips TEXT,
  visual_suggestion TEXT,
  best_time TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing_posts"
  ON public.marketing_posts
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_marketing_posts_updated_at
  BEFORE UPDATE ON public.marketing_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
