-- Tabela para respostas do quiz de boas-vindas
CREATE TABLE public.welcome_quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  name TEXT,
  email TEXT,
  whatsapp TEXT,
  occasion TEXT,
  style_preference TEXT,
  category_interest TEXT,
  budget_range TEXT,
  coupon_code TEXT,
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit welcome quiz"
ON public.welcome_quiz_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins view all quiz responses"
ON public.welcome_quiz_responses
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view their own quiz responses"
ON public.welcome_quiz_responses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_welcome_quiz_email ON public.welcome_quiz_responses(email);
CREATE INDEX idx_welcome_quiz_user_id ON public.welcome_quiz_responses(user_id);
CREATE INDEX idx_welcome_quiz_created_at ON public.welcome_quiz_responses(created_at DESC);

-- Cupom de boas-vindas 10% off (criado se não existir)
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, is_active)
VALUES ('BEMVINDA10', 'percentage', 10, 0, true)
ON CONFLICT (code) DO NOTHING;