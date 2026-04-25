
-- Sales Leads (CRM)
CREATE TABLE public.sales_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'novo',
  interest TEXT,
  budget NUMERIC,
  occasion TEXT,
  notes TEXT,
  ai_profile_override TEXT,
  last_interaction_at TIMESTAMPTZ,
  engagement_score INTEGER DEFAULT 0,
  products_viewed TEXT[] DEFAULT '{}',
  campaigns_received TEXT[] DEFAULT '{}',
  avg_response_time_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales_leads" ON public.sales_leads
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sales Appointments
CREATE TABLE public.sales_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'consultoria',
  status TEXT NOT NULL DEFAULT 'agendado',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales_appointments" ON public.sales_appointments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sales_appointments_updated_at
  BEFORE UPDATE ON public.sales_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sales Campaigns
CREATE TABLE public.sales_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  message_template TEXT,
  segment_status TEXT[] DEFAULT '{}',
  segment_interest TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'rascunho',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales_campaigns" ON public.sales_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sales_campaigns_updated_at
  BEFORE UPDATE ON public.sales_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sales Opportunities (Pipeline)
CREATE TABLE public.sales_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE NOT NULL,
  stage_key TEXT NOT NULL DEFAULT 'novo',
  value NUMERIC,
  notes TEXT,
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales_opportunities" ON public.sales_opportunities
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sales_opportunities_updated_at
  BEFORE UPDATE ON public.sales_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sales AI Config
CREATE TABLE public.sales_ai_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  system_prompt TEXT,
  temperature NUMERIC DEFAULT 0.7,
  scenario_key TEXT DEFAULT 'consultora',
  schedule_start TEXT DEFAULT '09:00',
  schedule_end TEXT DEFAULT '18:00',
  schedule_days INTEGER[] DEFAULT '{1,2,3,4,5,6}',
  only_outside_hours BOOLEAN DEFAULT false,
  routing_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales_ai_config" ON public.sales_ai_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sales_ai_config_updated_at
  BEFORE UPDATE ON public.sales_ai_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sales Knowledge Docs
CREATE TABLE public.sales_knowledge_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'outros',
  tags TEXT[] DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_knowledge_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales_knowledge_docs" ON public.sales_knowledge_docs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sales_knowledge_docs_updated_at
  BEFORE UPDATE ON public.sales_knowledge_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
