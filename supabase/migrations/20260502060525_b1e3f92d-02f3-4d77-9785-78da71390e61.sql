
-- ===== Favoritos do cliente =====
CREATE TABLE public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_customer_favorites_user ON public.customer_favorites(user_id);
CREATE INDEX idx_customer_favorites_product ON public.customer_favorites(product_id);

ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON public.customer_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all favorites"
  ON public.customer_favorites FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== Vincular sessão anônima ao usuário ao logar =====
-- Adiciona user_id às tabelas analytics para correlação pós-cadastro
ALTER TABLE public.analytics_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.analytics_pageviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.analytics_carts ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON public.analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_user ON public.analytics_pageviews(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_carts_user ON public.analytics_carts(user_id);

-- RPC chamado pelo cliente após login/signup para vincular session_id ao user_id
CREATE OR REPLACE FUNCTION public.link_session_to_user(_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR _session_id IS NULL OR length(trim(_session_id)) = 0 THEN
    RETURN;
  END IF;

  UPDATE analytics_sessions  SET user_id = uid WHERE session_id = _session_id AND user_id IS NULL;
  UPDATE analytics_pageviews SET user_id = uid WHERE session_id = _session_id AND user_id IS NULL;
  UPDATE analytics_events    SET user_id = uid WHERE session_id = _session_id AND user_id IS NULL;
  UPDATE analytics_carts     SET user_id = uid WHERE session_id = _session_id AND user_id IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_session_to_user(text) TO authenticated;

-- View 360º do cliente (somente admin via RLS herdado das tabelas base)
CREATE OR REPLACE VIEW public.customer_360
WITH (security_invoker=on) AS
SELECT
  p.id as user_id,
  p.full_name,
  p.email,
  p.phone,
  p.cpf,
  p.birthday,
  p.created_at as signed_up_at,
  p.credit_score,
  p.credit_limit,
  (SELECT count(*) FROM orders o WHERE o.customer_id = p.id) as orders_count,
  (SELECT COALESCE(sum(total),0) FROM orders o WHERE o.customer_id = p.id AND o.status NOT IN ('cancelled','canceled')) as total_spent,
  (SELECT count(*) FROM customer_favorites f WHERE f.user_id = p.id) as favorites_count,
  (SELECT count(*) FROM customer_addresses a WHERE a.user_id = p.id) as addresses_count,
  (SELECT count(*) FROM analytics_sessions s WHERE s.user_id = p.id) as sessions_count,
  (SELECT count(*) FROM analytics_pageviews pv WHERE pv.user_id = p.id) as pageviews_count,
  (SELECT max(s.last_seen_at) FROM analytics_sessions s WHERE s.user_id = p.id) as last_seen_at,
  (SELECT s.utm_source FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at ASC LIMIT 1) as first_utm_source,
  (SELECT s.utm_medium FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at ASC LIMIT 1) as first_utm_medium,
  (SELECT s.utm_campaign FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at ASC LIMIT 1) as first_utm_campaign,
  (SELECT s.referrer FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at ASC LIMIT 1) as first_referrer,
  (SELECT s.landing_page FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at ASC LIMIT 1) as first_landing_page,
  (SELECT s.device_type FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at DESC LIMIT 1) as last_device_type,
  (SELECT s.city FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at DESC LIMIT 1) as last_city,
  (SELECT s.region FROM analytics_sessions s WHERE s.user_id = p.id ORDER BY s.started_at DESC LIMIT 1) as last_region
FROM profiles p;
