-- Sessões anônimas de visitantes
CREATE TABLE public.analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  visitor_id text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  region text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_page text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  pageview_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_analytics_sessions_active ON public.analytics_sessions(is_active, last_seen_at DESC);
CREATE INDEX idx_analytics_sessions_started ON public.analytics_sessions(started_at DESC);

-- Pageviews
CREATE TABLE public.analytics_pageviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL,
  title text,
  referrer text,
  duration_ms integer DEFAULT 0,
  entered_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);

CREATE INDEX idx_analytics_pageviews_session ON public.analytics_pageviews(session_id);
CREATE INDEX idx_analytics_pageviews_entered ON public.analytics_pageviews(entered_at DESC);
CREATE INDEX idx_analytics_pageviews_path ON public.analytics_pageviews(path);

-- Eventos diversos (cliques, adições ao carrinho, etc)
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  product_id uuid,
  product_name text,
  path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_product ON public.analytics_events(product_id);

-- Snapshot de carrinhos ativos
CREATE TABLE public.analytics_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count integer NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  customer_name text,
  customer_phone text,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_carts_open ON public.analytics_carts(is_open, updated_at DESC);

-- RLS
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_carts ENABLE ROW LEVEL SECURITY;

-- Policies: público pode inserir/atualizar (tracking funciona pra anônimos)
CREATE POLICY "Public insert sessions" ON public.analytics_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update sessions" ON public.analytics_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins read sessions" ON public.analytics_sessions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public insert pageviews" ON public.analytics_pageviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update pageviews" ON public.analytics_pageviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins read pageviews" ON public.analytics_pageviews FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public insert events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read events" ON public.analytics_events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public insert carts" ON public.analytics_carts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update carts" ON public.analytics_carts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins read carts" ON public.analytics_carts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at em carts
CREATE TRIGGER update_analytics_carts_updated_at
  BEFORE UPDATE ON public.analytics_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_pageviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_carts;

-- Função de cleanup: marca sessões inativas após 5min sem pageview
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE analytics_sessions
  SET is_active = false, ended_at = last_seen_at
  WHERE is_active = true AND last_seen_at < now() - interval '5 minutes';

  UPDATE analytics_carts
  SET is_open = false
  WHERE is_open = true AND updated_at < now() - interval '30 minutes';
END;
$$;