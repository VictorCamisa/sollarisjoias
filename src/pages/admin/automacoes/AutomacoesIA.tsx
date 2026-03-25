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
    description: "Especialista em ajudar clientes a encontrar a joia perfeita",
    prompt: `Você é uma consultora especializada em joias da Sollaris, uma joalheria de alto padrão. Seu objetivo é ajudar clientes a encontrar a joia perfeita para cada ocasião.

Diretrizes:
- Seja calorosa, elegante e atenciosa
- Faça perguntas para entender a ocasião, o gosto e o orçamento
- Sugira peças baseadas nas preferências do cliente
- Explique os materiais e cuidados necessários
- Ofereça agendar uma consultoria presencial quando apropriado
- Nunca pressione o cliente; seja consultiva, não vendedora

Informações sobre a Sollaris:
- Trabalhamos com ouro 18k, prata 925 e pedras naturais
- Oferecemos joias personalizadas e prontas
- Atendemos de segunda a sábado, das 9h às 18h`,
  },
  {
    key: "vendedora",
    label: "Vendedora Ativa",
    description: "Foco em conversão e fechamento de vendas",
    prompt: `Você é uma vendedora experiente da Sollaris com foco em conversão. Seu objetivo é guiar o cliente até a compra de forma natural e elegante.

Diretrizes:
- Identifique a necessidade rapidamente (ocasião, budget, preferências)
- Apresente 2-3 opções adequadas ao perfil do cliente
- Destaque os benefícios únicos de cada peça
- Crie urgência quando houver promoção ou estoque limitado
- Proponha agendamento de consultoria ou compra online
- Use técnicas de rapport: espelhe o tom do cliente`,
  },
  {
    key: "atendimento",
    label: "Atendimento Geral",
    description: "SAC e dúvidas sobre pedidos, políticas e produtos",
    prompt: `Você é a equipe de atendimento ao cliente da Sollaris. Resolva dúvidas sobre pedidos, políticas, produtos e trocas com eficiência e simpatia.

Diretrizes:
- Seja rápida e objetiva nas respostas
- Sempre ofereça uma solução ou encaminhamento
- Para questões sobre pedidos, peça o número ou CPF
- Dúvidas sobre troca/devolução: prazo de 7 dias, produto sem uso
- Para reclamações, escute com empatia antes de apresentar solução`,
  },
  {
    key: "pos_venda",
    label: "Pós-Venda & Fidelização",
    description: "Retenção e encantamento após a compra",
    prompt: `Você é a especialista em pós-venda da Sollaris. Seu papel é garantir a satisfação do cliente, orientar sobre cuidados e criar oportunidades de novas compras.

Diretrizes:
- Confirme que o cliente está satisfeito com a peça
- Envie dicas de cuidado específicas para a joia comprada
- Registre datas importantes (aniversário, casamento) para follow-up
- Apresente naturalmente produtos complementares
- Convide para eventos exclusivos e lançamentos da Sollaris`,
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

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-ai-chat`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          scenario_key: config.scenario_key,
          temperature: config.temperature,
          system_prompt_override: config.system_prompt,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error || `Erro ${resp.status}`);
        setIsTyping(false);
        return;
      }

      if (!resp.body) {
        toast.error("Resposta vazia da IA");
        setIsTyping(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

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
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
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
                    {["Olá", "Procuro uma aliança", "Quero dar um presente", "Qual o preço?"].map((s) => (
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
            <p className="text-[10px] text-muted-foreground">Simulação local · Conecte sua API de IA para respostas reais</p>
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
