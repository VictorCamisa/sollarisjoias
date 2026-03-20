-- ============================================================
-- SOLLARIS - Sales Automation Module
-- ============================================================

-- Leads (prospects da Sollaris)
CREATE TABLE public.sales_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  source text DEFAULT 'manual' CHECK (source IN ('whatsapp','instagram','indicacao','site','loja','manual','outro')),
  status text DEFAULT 'novo' CHECK (status IN ('novo','em_contato','qualificado','convertido','descartado')),
  interest text CHECK (interest IN ('anel','colar','brinco','pulseira','alianca','relogio','conjunto','personalizado','outro')),
  budget numeric,
  occasion text, -- 'casamento', 'noivado', 'presente', 'uso_proprio', etc.
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pipeline stages
CREATE TABLE public.sales_pipeline_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  stage_order integer NOT NULL,
  stage_key text NOT NULL UNIQUE,
  color text DEFAULT '#6366f1'
);

INSERT INTO public.sales_pipeline_stages (name, stage_order, stage_key, color) VALUES
  ('Novo Lead',       1, 'novo',        '#6366f1'),
  ('Em Contato',      2, 'em_contato',  '#3b82f6'),
  ('Consultoria',     3, 'consultoria', '#8b5cf6'),
  ('Orçamento',       4, 'orcamento',   '#f59e0b'),
  ('Proposta',        5, 'proposta',    '#f97316'),
  ('Ganho',           6, 'ganho',       '#10b981'),
  ('Perdido',         7, 'perdido',     '#ef4444');

-- Pipeline opportunities (kanban cards)
CREATE TABLE public.sales_opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  stage_key text NOT NULL DEFAULT 'novo',
  value numeric,
  probability integer DEFAULT 20,
  notes text,
  stage_entered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Base de conhecimento (RAG)
CREATE TABLE public.sales_knowledge_docs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'outros' CHECK (category IN ('catalogo','cuidados','medidas','faq','politicas','outros')),
  tags text[] DEFAULT '{}',
  processed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campanhas / Broadcasts
CREATE TABLE public.sales_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  channel text DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','email')),
  status text DEFAULT 'rascunho' CHECK (status IN ('rascunho','agendada','ativa','pausada','concluida','cancelada')),
  message_template text,
  segment_status text[] DEFAULT '{}',
  segment_interest text[] DEFAULT '{}',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  replied_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agendamentos
CREATE TABLE public.sales_appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.sales_leads(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text,
  title text NOT NULL,
  type text DEFAULT 'consultoria' CHECK (type IN ('consultoria','ajuste','personalizado','retirada')),
  status text DEFAULT 'agendado' CHECK (status IN ('agendado','confirmado','concluido','cancelado','nao_compareceu')),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Configuração da IA Vendedora
CREATE TABLE public.sales_ai_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean DEFAULT false,
  system_prompt text DEFAULT 'Você é uma consultora especializada em joias da Sollaris. Seja elegante, atenciosa e ajude os clientes a encontrar a joia perfeita para cada ocasião.',
  temperature numeric DEFAULT 0.7,
  scenario_key text DEFAULT 'consultora',
  schedule_start time,
  schedule_end time,
  schedule_days integer[] DEFAULT '{1,2,3,4,5}',
  only_outside_hours boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default AI config
INSERT INTO public.sales_ai_config (id) VALUES (gen_random_uuid());

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.handle_sales_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sales_leads_updated_at BEFORE UPDATE ON public.sales_leads FOR EACH ROW EXECUTE FUNCTION public.handle_sales_updated_at();
CREATE TRIGGER sales_opportunities_updated_at BEFORE UPDATE ON public.sales_opportunities FOR EACH ROW EXECUTE FUNCTION public.handle_sales_updated_at();
CREATE TRIGGER sales_knowledge_docs_updated_at BEFORE UPDATE ON public.sales_knowledge_docs FOR EACH ROW EXECUTE FUNCTION public.handle_sales_updated_at();
CREATE TRIGGER sales_campaigns_updated_at BEFORE UPDATE ON public.sales_campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_sales_updated_at();
CREATE TRIGGER sales_appointments_updated_at BEFORE UPDATE ON public.sales_appointments FOR EACH ROW EXECUTE FUNCTION public.handle_sales_updated_at();
CREATE TRIGGER sales_ai_config_updated_at BEFORE UPDATE ON public.sales_ai_config FOR EACH ROW EXECUTE FUNCTION public.handle_sales_updated_at();
