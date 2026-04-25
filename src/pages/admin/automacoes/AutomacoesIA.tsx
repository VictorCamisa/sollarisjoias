import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Bot, Save, Send, RefreshCw, Sparkles, Settings, MessageSquare, Clock, Route, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SCENARIOS = [
  {
    key: "consultora",
    label: "Consultora de Joias",
    description: "Especialista em descobrir a peça perfeita para cada momento",
    prompt: `Você é Sofia, consultora especializada em joias da Sollaris — uma joalheria de alto padrão. Você tem anos de experiência ajudando clientes a encontrar a peça certa para cada momento especial da vida.

IDENTIDADE:
- Nome: Sofia (da Sollaris)
- Tom: Calorosa, elegante, atenciosa — como uma amiga especialista em joias
- Nunca apressada; sempre consultiva e genuína
- Linguagem formal-descontraída: sem gírias, mas sem frieza

OBJETIVO:
Guiar o cliente de forma natural até a descoberta da peça ideal — e convertê-lo em agendamento de consultoria ou compra.

METODOLOGIA:
1. Cumprimente com carinho e apresente-se brevemente
2. Descubra a ocasião: "É para presente ou uso próprio? Tem alguma data especial?"
3. Se for presente: perfil da pessoa (estilo, idade, peças que já usa)
4. Explore o orçamento com delicadeza: "Você tem alguma faixa de investimento em mente?"
5. Sugira 2-3 peças com justificativa emocional ("Esse colar ficaria perfeito porque...")
6. Explique o material, a qualidade e os cuidados básicos
7. Feche com CTA: agendar consultoria, visitar a loja ou enviar link

PORTFÓLIO SOLLARIS:
- Anéis: solitários, aparadores, alianças, cocktail — ouro 18k amarelo/branco/rosé
- Colares & gargantilhas: pingentes, ponto de luz, escapulários, correntes
- Brincos: argolas, tiras, pressão, ear cuff — dia a dia e ocasiões especiais
- Pulseiras: riviera, tennis, berloque, braceletes
- Alianças: noivado e casamento, lisos ou cravejados, com gravação personalizada
- Joias personalizadas: projeto exclusivo do zero (aprox. 30 dias úteis)
- Faixa de preços: R$ 350 a R$ 8.000+ conforme material e pedras

REGRAS DE OURO:
- Nunca dê preço sem antes entender o que o cliente precisa
- Sempre justifique a sugestão com contexto emocional
- Se o cliente resistir, ofereça consultoria gratuita como próximo passo
- Mencione a garantia de 1 ano e ajustes gratuitos como diferenciais
- Para aniversários ou datas próximas, crie urgência gentil: "Para garantir a entrega a tempo..."
- Se houver dúvida de tamanho, oriente a medir em casa com papel e barbante`,
  },
  {
    key: "vendedora",
    label: "Vendedora Ativa",
    description: "Conversão elegante com foco em fechar vendas rapidamente",
    prompt: `Você é Valentina, especialista em vendas da Sollaris. Você domina o catálogo completo e sabe identificar oportunidades e fechar com sofisticação — sem forçar, sem pressão.

IDENTIDADE:
- Nome: Valentina (da Sollaris)
- Tom: Dinâmica, confiante, direta — sempre elegante
- Usa técnicas de rapport e escuta ativa
- Cria urgência de forma natural, não invasiva

OBJETIVO:
Converter o interesse do cliente em compra ou agendamento no menor número de mensagens possível.

FLUXO DE ABORDAGEM:
1. Identificação rápida: "O que você está procurando?" + "É para presente ou uso próprio?"
2. Apresente 2-3 opções concretas (nunca mais) com preço e benefício principal
3. Destaque o diferencial emocional de cada opção
4. Use prova social quando relevante: "Essa aliança é nossa mais pedida para noivado"
5. Crie urgência natural: estoque limitado, data próxima, promoção vigente
6. Feche com CTA claro: "Quer garantir hoje?" / "Posso separar para você?"

TRATAMENTO DE OBJEÇÕES:
- "Está caro": Apresente opção mais acessível + custo-benefício da qualidade Sollaris
- "Vou pensar": "Claro! Posso te enviar as fotos das peças para você decidir com calma?"
- "Não sei o tamanho": "Sem problema — basta enrolar um papel no dedo e medir"
- "Não estou com pressa": Mencione datas relevantes, lançamentos ou estoque limitado

PREÇOS ORIENTATIVOS:
- Anéis simples: a partir de R$ 350
- Aliança de casamento: R$ 890 a R$ 3.500/par
- Colares com pedras: R$ 480 a R$ 2.200
- Brincos clássicos: R$ 280 a R$ 1.800
- Joias personalizadas: consulta obrigatória (a partir de R$ 1.200)

REGRAS:
- Máximo 3 opções por vez — mais do que isso confunde e trava a decisão
- Sempre termine com pergunta ou CTA clara
- Use emojis com moderação: 💎 ✨ 💍 (máximo 2 por mensagem)
- Não ofereça desconto direto — proponha frete grátis ou brinde como alternativa`,
  },
  {
    key: "atendimento",
    label: "Atendimento Geral",
    description: "SAC ágil para pedidos, políticas, trocas e dúvidas",
    prompt: `Você é a equipe de Atendimento ao Cliente da Sollaris. Resolve dúvidas, problemas e solicitações com rapidez, empatia e clareza.

IDENTIDADE:
- Represente a equipe Sollaris (não use nome próprio — fale "nossa equipe")
- Tom: Profissional, simpático e resolutivo
- Resposta direta: 3-4 linhas no máximo por mensagem

PEDIDOS & ENTREGA:
- Prazo em estoque: 1-3 dias úteis | Personalizadas: 15-30 dias úteis
- Rastreamento: solicite número do pedido ou CPF cadastrado
- Problemas: colha detalhes e informe que a equipe retorna em até 2h

TROCAS & DEVOLUÇÕES:
- Prazo: 7 dias corridos após o recebimento
- Condição: produto sem uso, embalagem original, com NF
- Processo: cliente envia fotos → equipe avalia → autoriza devolução/troca
- Defeito de fabricação: garantia 1 ano → reparo ou troca sem custo

AJUSTE DE TAMANHO:
- Anéis: 3-5 dias úteis (verificação se o modelo permite)
- Alianças: primeira vez gratuito
- Pulseiras/colares: avaliação caso a caso

DÚVIDAS GERAIS:
- Materiais: ouro 18k = 75% ouro puro; prata 925 = 92,5% prata pura
- Hipoalergênico: ouro 18k e prata 925 são seguros para pele sensível
- Gravação: disponível em alianças e modelos selecionados (+2 dias úteis)
- Presente: embalagem premium inclusa + mensagem personalizada gratuita

REGRAS:
- Nunca deixe o cliente sem próxima etapa clara
- Se não souber: "Vou verificar e retorno em breve" (nunca invente informação)
- Para reclamações: valide a insatisfação PRIMEIRO, depois apresente a solução
- Jamais minimize ou discuta um problema relatado`,
  },
  {
    key: "pos_venda",
    label: "Pós-Venda & Fidelização",
    description: "Encantamento pós-compra e retenção de longo prazo",
    prompt: `Você é Camila, especialista em experiência do cliente da Sollaris. Seu papel é transformar compradores em fãs da marca — e garantir que cada cliente se sinta especial muito além da data da compra.

IDENTIDADE:
- Nome: Camila (da Sollaris)
- Tom: Calorosa, genuína, atenciosa — como uma consultora pessoal
- Celebra cada compra como se fosse a mais importante do dia

OBJETIVO:
Aumentar retenção, lifetime value e indicações orgânicas através de uma experiência pós-compra impecável.

FLUXO PÓS-COMPRA:

1. CONFIRMAÇÃO (1-3 dias após entrega):
   "Olá! A sua [peça] chegou bem? Estamos curiosas para saber o que acharam! 💎"

2. DICAS DE CUIDADO (personalize por material):
   OURO: evite perfume direto na peça; limpe com pano macio; guarde em caixinha individual
   PRATA: saquinho antiestático; flanela própria; retire ao dormir e tomar banho
   PEDRAS: evite impactos; leve para revisão anual na Sollaris

3. COLETA DE DATAS IMPORTANTES:
   "Para te lembrar de momentos especiais no futuro — quando é seu aniversário? E da pessoa presenteada?"

4. CROSS-SELL NATURAL (30-60 dias após):
   "Vi que você levou a aliança de noivado — temos as de casamento combinando! Quer conhecer?"
   "Sua amiga também pode se apaixonar — que tal um vale-presente Sollaris?"

5. CONVITE PARA A COMUNIDADE:
   - Eventos exclusivos de lançamento de coleção
   - Programa de indicação: desconto para quem traz uma amiga
   - Avaliação no Google/Instagram em troca de voucher de manutenção gratuita

REGRAS:
- Sempre mencione a peça específica comprada — nunca seja genérica
- Celebre a decisão: "Que escolha incrível — ela vai amar!"
- Se houve problema: resolva ANTES de qualquer cross-sell
- Ofereça polimento/verificação gratuita aos 6 meses da compra`,
  },
];

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Message { role: "user" | "assistant"; content: string; }

const AutomacoesIA = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState("config");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState({
    enabled: false,
    system_prompt: SCENARIOS[0].prompt,
    temperature: 0.7,
    scenario_key: "consultora",
    schedule_start: "09:00",
    schedule_end: "18:00",
    schedule_days: [1, 2, 3, 4, 5, 6] as number[],
    only_outside_hours: false,
  });

  const { data: savedConfig } = useQuery({
    queryKey: ["sales-ai-config"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_ai_config").select("*").single();
      return data;
    },
    onSuccess: (data: any) => {
      if (data) {
        setConfig({
          enabled: data.enabled ?? false,
          system_prompt: data.system_prompt ?? SCENARIOS[0].prompt,
          temperature: data.temperature ?? 0.7,
          scenario_key: data.scenario_key ?? "consultora",
          schedule_start: data.schedule_start ?? "09:00",
          schedule_end: data.schedule_end ?? "18:00",
          schedule_days: data.schedule_days ?? [1, 2, 3, 4, 5, 6],
          only_outside_hours: data.only_outside_hours ?? false,
        });
      }
    },
  } as any);

  const { data: knowledgeDocs = [] } = useQuery({
    queryKey: ["sales-knowledge"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_knowledge_docs").select("title, content, category");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await (supabase.from as any)("sales_ai_config").select("id").single();
      if (existing?.id) {
        await (supabase.from as any)("sales_ai_config").update({
          enabled: config.enabled,
          system_prompt: config.system_prompt,
          temperature: config.temperature,
          scenario_key: config.scenario_key,
          schedule_start: config.schedule_start,
          schedule_end: config.schedule_end,
          schedule_days: config.schedule_days,
          only_outside_hours: config.only_outside_hours,
        }).eq("id", existing.id);
      } else {
        await (supabase.from as any)("sales_ai_config").insert({
          enabled: config.enabled,
          system_prompt: config.system_prompt,
          temperature: config.temperature,
          scenario_key: config.scenario_key,
          schedule_start: config.schedule_start,
          schedule_end: config.schedule_end,
          schedule_days: config.schedule_days,
          only_outside_hours: config.only_outside_hours,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-ai-config"] });
      toast.success("Configuração da IA salva");
    },
    onError: () => toast.error("Erro ao salvar configuração"),
  });

  const applyScenario = (key: string) => {
    const scenario = SCENARIOS.find((s) => s.key === key);
    if (scenario) {
      setConfig({ ...config, scenario_key: key, system_prompt: scenario.prompt });
    }
  };

  const toggleDay = (day: number) => {
    const days = config.schedule_days.includes(day)
      ? config.schedule_days.filter((d) => d !== day)
      : [...config.schedule_days, day].sort();
    setConfig({ ...config, schedule_days: days });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    // Build context from knowledge base
    const context = knowledgeDocs.slice(0, 5).map((d: any) => `[${d.title}]: ${d.content.slice(0, 200)}`).join("\n");

    // Simulate response (in production: call edge function or OpenAI API)
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let reply = "";

      if (lower.includes("oi") || lower.includes("olá") || lower.includes("ola") || lower.includes("bom dia") || lower.includes("boa tarde")) {
        reply = "Olá! Aqui é a Sofia da Sollaris 💎 Que prazer falar com você! Está procurando uma peça especial ou posso te ajudar com alguma dúvida?";
      } else if (lower.includes("aliança") || lower.includes("casamento") || lower.includes("noivado")) {
        reply = "Que momento especial! 💍 Trabalhamos com alianças em ouro 18k amarelo, branco e rosé — lisas, cravejadas ou com gravação personalizada. Os pares começam em R$ 890 e cada detalhe pode ser personalizado. Posso agendar uma consultoria gratuita para vocês escolherem juntos?";
      } else if (lower.includes("preço") || lower.includes("valor") || lower.includes("quanto")) {
        reply = "Nosso portfólio começa em torno de R$ 350 para peças em prata 925 e vai até joias exclusivas em ouro 18k com pedras naturais. Para te indicar as melhores opções: qual é a ocasião e você tem alguma faixa de investimento em mente?";
      } else if (lower.includes("anel")) {
        reply = "Anéis são uma das nossas especialidades! 💍 Temos em ouro 18k (amarelo, branco e rosé) e prata 925, com ou sem pedras naturais. Para acertar o tamanho: você sabe seu número? Se não, é fácil medir em casa — posso explicar como!";
      } else if (lower.includes("presente") || lower.includes("presentear") || lower.includes("gift")) {
        reply = "Que linda ideia presentear alguém especial! ✨ Para te ajudar a escolher a peça perfeita: é para quem? (mãe, namorada, amiga...) E você tem ideia do estilo dela — mais clássico, delicado ou moderno?";
      } else if (lower.includes("colar") || lower.includes("gargantilha") || lower.includes("pingente")) {
        reply = "Nossos colares são lindíssimos! Temos de pingentes delicados a gargantilhas statement, em ouro 18k ou prata 925, com ou sem pedras. É para uso próprio ou presente? Assim consigo te indicar o estilo certo 💛";
      } else if (lower.includes("brinco") || lower.includes("argola")) {
        reply = "Temos brincos para todos os momentos — argolas clássicas, ear cuffs modernos, tiras elegantes e solitários de pedra. Em ouro 18k ou prata 925. Para que tipo de ocasião você está procurando? Dia a dia ou algo mais especial?";
      } else if (lower.includes("personaliz") || lower.includes("customiz") || lower.includes("exclusiv")) {
        reply = "Amamos projetos personalizados! ✨ Você descreve o que imagina e nossa equipe cria do zero — design digital em até 3 dias, produção em 15 a 30 dias úteis. O investimento começa em R$ 1.200. Quer marcar uma consultoria gratuita para discutir o projeto?";
      } else if (lower.includes("troca") || lower.includes("devolução") || lower.includes("devolver")) {
        reply = "Aceitamos trocas e devoluções em até 7 dias após o recebimento, com produto sem uso e na embalagem original. Para defeito de fabricação, temos garantia de 1 ano completa. Posso te ajudar com mais algum detalhe?";
      } else if (lower.includes("tamanho") || lower.includes("numero") || lower.includes("número") || lower.includes("medida")) {
        reply = "Para descobrir seu número de anel em casa: enrole um papel fino confortavelmente no dedo, marque onde se fecha, meça o comprimento e divida por 3,14 — esse é o diâmetro. Preciso de ajuda para encontrar o número na tabela?";
      } else if (lower.includes("ouro") || lower.includes("prata") || lower.includes("material")) {
        reply = "Trabalhamos com ouro 18k (75% de ouro puro — não alerg e não escurece) e prata 925 (92,5% prata pura). O ouro vem em amarelo, branco e rosé. Todas as pedras naturais têm laudo de autenticidade. Alguma dúvida específica sobre os materiais?";
      } else if (lower.includes("prazo") || lower.includes("entrega") || lower.includes("quando")) {
        reply = "Para peças em estoque: 1 a 3 dias úteis. Gravação personalizada: +2 dias. Joias sob medida: 15 a 30 dias úteis. Você tem alguma data limite? Assim garanto que sua peça chega a tempo! 📦";
      } else {
        reply = `Entendi! Para te ajudar da melhor forma: você está procurando uma joia para uso próprio ou para presentear alguém especial? Com essa informação já consigo te indicar as peças certas da nossa coleção 💎`;
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const currentText = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentText } : m);
                }
                return [...prev, { role: "assistant", content: currentText }];
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error("AI chat error:", err);
      toast.error("Erro ao conectar com a IA");
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold">IA Vendedora</h2>
            <p className="text-[11px] text-muted-foreground">Configure o assistente inteligente da Sollaris</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(v) => setConfig({ ...config, enabled: v })}
            />
            <span className="text-xs font-medium">{config.enabled ? <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-[10px]">Ativa</Badge> : <Badge variant="secondary" className="text-[10px]">Inativa</Badge>}</span>
          </div>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-8">
          <TabsTrigger value="config" className="text-xs h-6"><Settings className="h-3 w-3 mr-1" />Configuração</TabsTrigger>
          <TabsTrigger value="routing" className="text-xs h-6"><Route className="h-3 w-3 mr-1" />Roteamento</TabsTrigger>
          <TabsTrigger value="test" className="text-xs h-6"><MessageSquare className="h-3 w-3 mr-1" />Simular Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-5 mt-4">
          {/* Scenarios */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perfil da IA</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => applyScenario(s.key)}
                  className={`text-left p-3 rounded-xl border transition-all ${config.scenario_key === s.key ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className={`h-3 w-3 ${config.scenario_key === s.key ? "text-accent" : "text-muted-foreground"}`} />
                    <span className={`text-[12px] font-semibold ${config.scenario_key === s.key ? "text-accent" : ""}`}>{s.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* System prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prompt do Sistema</Label>
              <button onClick={() => applyScenario(config.scenario_key)} className="text-[10px] text-accent hover:underline flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5" /> Restaurar do perfil
              </button>
            </div>
            <Textarea
              className="text-xs resize-none font-mono leading-relaxed"
              rows={12}
              value={config.system_prompt}
              onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
              placeholder="Instruções do sistema para a IA..."
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">{config.system_prompt.length} caracteres</p>
              <p className="text-[10px] text-muted-foreground">{knowledgeDocs.length} documentos na base de conhecimento</p>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Criatividade da IA</Label>
              <span className="text-xs font-mono text-accent">{config.temperature.toFixed(1)}</span>
            </div>
            <Slider
              min={0} max={1} step={0.1}
              value={[config.temperature]}
              onValueChange={([v]) => setConfig({ ...config, temperature: v })}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Preciso e direto</span>
              <span className="text-[10px] text-muted-foreground">Criativo e variado</span>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Horário de Atendimento</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input type="time" className="h-8 text-xs w-28" value={config.schedule_start} onChange={(e) => setConfig({ ...config, schedule_start: e.target.value })} />
                <span className="text-xs text-muted-foreground">até</span>
                <Input type="time" className="h-8 text-xs w-28" value={config.schedule_end} onChange={(e) => setConfig({ ...config, schedule_end: e.target.value })} />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Switch checked={config.only_outside_hours} onCheckedChange={(v) => setConfig({ ...config, only_outside_hours: v })} />
                <span className="text-[11px] text-muted-foreground">Responder apenas fora do horário</span>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Dias da Semana</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`h-8 w-10 rounded-lg text-[11px] font-medium border transition-all ${config.schedule_days.includes(i) ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Knowledge base summary */}
          {knowledgeDocs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base de Conhecimento Ativa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {knowledgeDocs.map((doc: any) => (
                    <Badge key={doc.title} variant="secondary" className="text-[10px]">{doc.title}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="routing" className="space-y-5 mt-4">
          {/* Routing explanation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistema de Roteamento Híbrido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                O roteamento híbrido combina <strong>regras automáticas</strong> baseadas nos dados do lead com a <strong>classificação da IA</strong> que analisa a intenção da mensagem. O admin também pode forçar um perfil específico na ficha do lead.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold mb-1">1. Override Manual</p>
                  <p className="text-[10px] text-muted-foreground">Se o lead tem um perfil forçado na ficha, esse é usado diretamente.</p>
                </div>
                <div className="border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold mb-1">2. Regras por Dados</p>
                  <p className="text-[10px] text-muted-foreground">Status, origem, engajamento e métricas determinam o perfil padrão.</p>
                </div>
                <div className="border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold mb-1">3. Classificação da IA</p>
                  <p className="text-[10px] text-muted-foreground">A IA pode trocar o perfil se detectar uma intenção diferente na mensagem.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Routing rules table */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regras de Roteamento Automático</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">Avaliadas em ordem de prioridade. A primeira regra que corresponder define o perfil.</p>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground text-[11px]">Condição do Lead</th>
                    <th className="text-center px-4 py-2 font-semibold text-muted-foreground text-[11px]"></th>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground text-[11px]">Perfil IA Usado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { condition: "Override manual definido na ficha", profile: "Perfil escolhido pelo admin", priority: "Máxima" },
                    { condition: "Mensagem contém reclamação / problema", profile: "Atendimento Geral", priority: "Alta" },
                    { condition: 'Status = "convertido" ou pedido recente', profile: "Pós-Venda & Fidelização", priority: "Alta" },
                    { condition: 'Status = "qualificado" + budget definido', profile: "Vendedora Ativa", priority: "Média" },
                    { condition: 'Status = "novo" ou "em_contato"', profile: "Consultora de Joias", priority: "Normal" },
                    { condition: "Nenhuma regra corresponde", profile: "Consultora de Joias (fallback)", priority: "Baixa" },
                  ].map((rule, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5 text-[12px]">{rule.condition}</td>
                      <td className="px-2 py-2.5 text-center"><ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" /></td>
                      <td className="px-4 py-2.5">
                        <Badge variant="secondary" className="text-[10px]">{rule.profile}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Context data used */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados do Lead Enviados como Contexto</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">Esses dados são injetados no prompt junto com o perfil selecionado para personalizar a resposta.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { label: "Identificação", items: "Nome, telefone, e-mail" },
                { label: "Perfil", items: "Status, origem, interesse, ocasião" },
                { label: "Financeiro", items: "Orçamento, ticket médio, valor total gasto" },
                { label: "Histórico", items: "Última compra, pedidos anteriores, preferências" },
                { label: "Engajamento", items: "Score, tempo de resposta, produtos visualizados" },
                { label: "Campanhas", items: "Campanhas recebidas, interações, conversões" },
              ].map((g) => (
                <div key={g.label} className="border border-border rounded-lg p-2.5">
                  <p className="text-[11px] font-semibold mb-0.5">{g.label}</p>
                  <p className="text-[10px] text-muted-foreground">{g.items}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How IA classification works */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classificação pela IA (Camada Inteligente)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                Mesmo com as regras definindo o perfil padrão, a IA analisa cada mensagem do lead e pode <strong>trocar o perfil em tempo real</strong> se detectar uma intenção diferente:
              </p>
              <div className="space-y-1.5">
                {[
                  { from: "Vendedora", trigger: "Lead faz reclamação", to: "Atendimento" },
                  { from: "Consultora", trigger: "Lead pede preço/desconto", to: "Vendedora" },
                  { from: "Atendimento", trigger: "Lead mostra interesse em nova peça", to: "Consultora" },
                  { from: "Qualquer", trigger: "Lead menciona compra recente", to: "Pós-Venda" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <Badge variant="outline" className="text-[10px] min-w-[80px] justify-center">{e.from}</Badge>
                    <span className="text-muted-foreground">+</span>
                    <span className="text-muted-foreground flex-1">"{e.trigger}"</span>
                    <ArrowRight className="h-3 w-3 text-accent" />
                    <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] min-w-[80px] justify-center">{e.to}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="mt-4">
          <div className="border border-border rounded-xl overflow-hidden" style={{ height: 520 }}>
            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card/50">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-[12px] font-semibold">Sollaris — {SCENARIOS.find((s) => s.key === config.scenario_key)?.label}</p>
                <p className="text-[10px] text-green-400">● Simulação ativa</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ height: 400 }}>
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Envie uma mensagem para simular o atendimento</p>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                    {["Olá!", "Procuro uma aliança de noivado", "Quero dar um presente", "Qual o preço?", "Fazem joias personalizadas?", "Qual o prazo de entrega?"].map((s) => (
                      <button key={s} onClick={() => { setInput(s); }} className="text-[11px] px-2.5 py-1 border border-border rounded-full text-muted-foreground hover:border-accent/40 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${msg.role === "user" ? "bg-accent text-accent-foreground rounded-br-none" : "bg-secondary text-foreground rounded-bl-none"}`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-secondary px-3 py-2 rounded-xl rounded-bl-none">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-border bg-card/30">
              <Input
                className="h-8 text-xs flex-1"
                placeholder="Digite uma mensagem para simular..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <Button size="sm" className="h-8 px-3" onClick={sendMessage} disabled={!input.trim() || isTyping}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">Simulação com IA real · Perfil: {SCENARIOS.find((s) => s.key === config.scenario_key)?.label}</p>
            <button onClick={() => setMessages([])} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw className="h-2.5 w-2.5" /> Limpar chat
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomacoesIA;
