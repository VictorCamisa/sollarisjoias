
-- Table to store Brain Nalu conversation sessions
CREATE TABLE public.brain_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store individual messages
CREATE TABLE public.brain_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.brain_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  actions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.brain_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage brain_conversations" ON public.brain_conversations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage brain_messages" ON public.brain_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_brain_conversations_updated_at BEFORE UPDATE ON public.brain_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast message lookup
CREATE INDEX idx_brain_messages_conversation ON public.brain_messages(conversation_id, created_at);
