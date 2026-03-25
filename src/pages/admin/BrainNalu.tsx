import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Brain, Send, Sparkles, ShoppingCart, Users, Calendar,
  Package, DollarSign, ListTodo, Loader2, Trash2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  timestamp: Date;
}

const ACTION_ICONS: Record<string, { icon: typeof Brain; label: string; color: string }> = {
  query_orders: { icon: ShoppingCart, label: "Pedidos", color: "text-blue-400" },
  create_order: { icon: ShoppingCart, label: "Criar Pedido", color: "text-green-400" },
  query_leads: { icon: Users, label: "Leads", color: "text-purple-400" },
  create_lead: { icon: Users, label: "Criar Lead", color: "text-purple-400" },
  update_lead_status: { icon: Users, label: "Atualizar Lead", color: "text-yellow-400" },
  create_appointment: { icon: Calendar, label: "Agendar", color: "text-pink-400" },
  query_appointments: { icon: Calendar, label: "Agenda", color: "text-pink-400" },
  query_products: { icon: Package, label: "Produtos", color: "text-amber-400" },
  query_financial_summary: { icon: DollarSign, label: "Financeiro", color: "text-emerald-400" },
  create_task: { icon: ListTodo, label: "Criar Tarefa", color: "text-cyan-400" },
};

const SUGGESTIONS = [
  "Quais foram as vendas de hoje?",
  "Quantos leads novos entraram essa semana?",
  "Qual o faturamento do mês?",
  "Quais compromissos tenho hoje?",
  "Me mostra os produtos mais caros em estoque",
  "Crie uma tarefa para ligar para o fornecedor amanhã",
];

const BrainNalu = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isLoading) return;
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: msgText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("brain-nalu", {
        body: { messages: conversationHistory },
      });

      if (error) throw error;

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "Desculpe, não consegui processar sua solicitação.",
        actions: data.actions_executed || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Brain Nalu error:", err);
      const errorMsg = err?.message || "Erro ao conectar com a Brain Nalu";
      toast.error(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `❌ ${errorMsg}. Tente novamente.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)] max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Brain Nalu</h1>
            <p className="text-[11px] text-muted-foreground">
              Assistente executiva da Sollaris · <span className="text-green-400">Online</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive h-8 px-2">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mb-5 border border-accent/10">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Olá, Ana! ✨</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
              Sou sua assistente executiva. Posso gerenciar pedidos, leads, agenda, consultar dados financeiros e muito mais. Como posso te ajudar?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-[12px] px-3 py-2.5 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${msg.role === "user" ? "" : "flex gap-2.5"}`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="h-3.5 w-3.5 text-accent" />
                  </div>
                )}
                <div>
                  {/* Action badges */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {msg.actions.map((action, i) => {
                        const info = ACTION_ICONS[action];
                        if (!info) return null;
                        const Icon = info.icon;
                        return (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[9px] gap-1 bg-secondary/50 border-border/50"
                          >
                            <Icon className={`h-2.5 w-2.5 ${info.color}`} />
                            {info.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-accent text-accent-foreground rounded-br-md"
                        : "bg-card border border-border/60 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:text-accent [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_code]:text-[11px] [&_code]:bg-secondary/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground/50 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2.5"
          >
            <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Brain className="h-3.5 w-3.5 text-accent animate-pulse" />
            </div>
            <div className="bg-card border border-border/60 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
                <span className="text-[12px] text-muted-foreground">Processando...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 pt-3 pb-1">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full min-h-[44px] max-h-[120px] px-4 py-3 pr-12 bg-card border border-border/60 rounded-2xl text-[13px] resize-none focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted-foreground/50"
              placeholder="Pergunte qualquer coisa sobre a Sollaris..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="h-[44px] w-[44px] rounded-2xl flex-shrink-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground/40 text-center mt-2">
          Brain Nalu pode executar ações reais no sistema · Dados em tempo real
        </p>
      </div>
    </div>
  );
};

export default BrainNalu;
