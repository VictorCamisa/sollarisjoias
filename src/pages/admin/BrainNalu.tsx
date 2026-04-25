import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Brain, Send, Sparkles, ShoppingCart, Users, Calendar,
  Package, DollarSign, ListTodo, Loader2, Trash2, Plus,
  MessageSquare, Clock, Mic, MicOff, Volume2, VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  timestamp: Date;
  audioUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
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
  generate_marketing_post: { icon: Sparkles, label: "Gerar Post", color: "text-rose-400" },
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("brain_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadConversation = async (convId: string) => {
    setActiveConversationId(convId);
    const { data } = await supabase
      .from("brain_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        actions: m.actions || [],
        timestamp: new Date(m.created_at),
      })));
    }
  };

  const startNewConversation = async () => {
    const { data } = await supabase
      .from("brain_conversations")
      .insert({ title: "Nova conversa" })
      .select()
      .single();

    if (data) {
      setActiveConversationId(data.id);
      setMessages([]);
      await loadConversations();
    }
  };

  // ── TTS: play assistant response as audio ──
  const playAudio = async (text: string, msgId: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsSpeaking(true);
    setPlayingMsgId(msgId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brain-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) throw new Error("TTS failed");

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setPlayingMsgId(null);
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      toast.error("Erro ao reproduzir áudio");
      setIsSpeaking(false);
      setPlayingMsgId(null);
    }
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
    setPlayingMsgId(null);
  };

  // ── Recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAndSend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const transcribeAndSend = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brain-voice`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      const text = data.text?.trim();

      if (!text) {
        toast.error("Não consegui entender o áudio");
        return;
      }

      // Send as message (voice mode auto-plays reply)
      await sendMessage(text, true);
    } catch (err) {
      console.error("STT error:", err);
      toast.error("Erro na transcrição do áudio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const sendMessage = async (text?: string, autoPlayReply = false) => {
    const msgText = text || input.trim();
    if (!msgText || isLoading) return;
    setInput("");

    let convId = activeConversationId;
    if (!convId) {
      const { data } = await supabase
        .from("brain_conversations")
        .insert({ title: msgText.substring(0, 40) + (msgText.length > 40 ? "..." : "") })
        .select()
        .single();
      if (data) {
        convId = data.id;
        setActiveConversationId(data.id);
        loadConversations();
      }
    }

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
        body: {
          messages: conversationHistory,
          conversation_id: convId,
          save_messages: true,
        },
      });

      if (error) throw error;

      const replyText = data.response || "Desculpe, não consegui processar.";
      const assistantMsgId = crypto.randomUUID();

      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: replyText,
        actions: data.actions_executed || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      loadConversations();

      // Auto-play TTS if voice mode is on
      if (voiceMode && autoPlayReply) {
        setTimeout(() => playAudio(replyText, assistantMsgId), 300);
      }
    } catch (err: any) {
      console.error("Brain Sollaris error:", err);
      toast.error(err?.message || "Erro ao conectar com a Brain Sollaris");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `❌ ${err?.message || "Erro"}. Tente novamente.`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("brain_conversations").delete().eq("id", convId);
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    loadConversations();
    toast.success("Conversa removida");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Hoje";
    if (diff < 172800000) return "Ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r border-border/50 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border/50">
            <Button onClick={startNewConversation} className="w-full gap-2 h-9 text-xs" size="sm">
              <Plus className="h-3.5 w-3.5" /> Nova conversa
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs group flex items-start gap-2 transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-accent/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{conv.title}</p>
                    <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5" /> {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-[11px] text-muted-foreground/50 text-center py-8">Nenhuma conversa ainda</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col max-w-[1000px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-b border-border/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-muted-foreground hover:text-foreground p-1">
              <MessageSquare className="h-4 w-4" />
            </button>
            <div className="relative">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                <Brain className="h-4 w-4 text-accent" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Brain Sollaris</h1>
              <p className="text-[10px] text-muted-foreground">
                {voiceMode ? "Modo voz ativado 🎙️" : "Assistente com memória"} · <span className="text-green-400">Online</span>
              </p>
            </div>
          </div>

          {/* Voice mode toggle */}
          <Button
            variant={voiceMode ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => {
              setVoiceMode(!voiceMode);
              if (isSpeaking) stopAudio();
              toast.success(voiceMode ? "Modo texto ativado" : "Modo voz ativado 🎙️");
            }}
          >
            {voiceMode ? <Volume2 className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {voiceMode ? "Voz ON" : "Voz"}
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4 scrollbar-hide">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mb-5 border border-accent/10">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Olá, Ana! ✨</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                {voiceMode
                  ? "Modo bate-papo por voz ativado! Toque no microfone e fale comigo."
                  : "Sou sua assistente com memória. Lembro de tudo que conversamos para te ajudar melhor a cada dia."
                }
              </p>

              {voiceMode ? (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing || isLoading}
                    className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? "bg-red-500/20 border-2 border-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                        : "bg-accent/10 border-2 border-accent/30 hover:border-accent hover:bg-accent/20 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]"
                    }`}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-8 w-8 text-accent animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-8 w-8 text-red-500" />
                    ) : (
                      <Mic className="h-8 w-8 text-accent" />
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {isTranscribing ? "Transcrevendo..." : isRecording ? "Gravando... toque para parar" : "Toque para falar"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)} className="text-left text-[12px] px-3 py-2.5 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:border-accent/30 hover:bg-accent/5 transition-all duration-200">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "" : "flex gap-2.5"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain className="h-3.5 w-3.5 text-accent" />
                    </div>
                  )}
                  <div>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {msg.actions.map((action, i) => {
                          const info = ACTION_ICONS[action];
                          if (!info) return null;
                          const Icon = info.icon;
                          return (
                            <Badge key={i} variant="secondary" className="text-[9px] gap-1 bg-secondary/50 border-border/50">
                              <Icon className={`h-2.5 w-2.5 ${info.color}`} />
                              {info.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.role === "user" ? "bg-accent text-accent-foreground rounded-br-md" : "bg-card border border-border/60 rounded-bl-md"}`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:text-primary [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_code]:text-[11px] [&_code]:bg-secondary/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans">
                          <ReactMarkdown
                            components={{
                              img: ({ src, alt }) => (
                                <a href={src} target="_blank" rel="noopener noreferrer" className="block my-2">
                                  <img
                                    src={src}
                                    alt={alt || "Post gerado"}
                                    className="rounded-xl max-w-[280px] w-full border border-border/40 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                  />
                                </a>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <p className="text-[9px] text-muted-foreground/50">
                        {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {msg.role === "assistant" && voiceMode && (
                        <button
                          onClick={() => playingMsgId === msg.id ? stopAudio() : playAudio(msg.content, msg.id)}
                          className="text-muted-foreground/50 hover:text-accent transition-colors"
                          title={playingMsgId === msg.id ? "Parar" : "Ouvir"}
                        >
                          {playingMsgId === msg.id ? (
                            <VolumeX className="h-3 w-3 text-accent" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
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

        {/* Input */}
        <div className="border-t border-border/50 pt-3 pb-1 px-4">
          <div className="flex gap-2 items-end">
            {/* Mic button (always visible in voice mode) */}
            {voiceMode && messages.length > 0 && (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing || isLoading}
                variant={isRecording ? "destructive" : "outline"}
                className={`h-[44px] w-[44px] rounded-2xl flex-shrink-0 ${isRecording ? "animate-pulse" : ""}`}
                size="icon"
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                className="w-full min-h-[44px] max-h-[120px] px-4 py-3 pr-12 bg-card border border-border/60 rounded-2xl text-[13px] resize-none focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted-foreground/50"
                placeholder={voiceMode ? "Ou digite aqui..." : "Pergunte qualquer coisa sobre a Sollaris..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
            </div>
            <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} className="h-[44px] w-[44px] rounded-2xl flex-shrink-0" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground/40 text-center mt-2">
            {voiceMode ? "Modo bate-papo · Fale ou digite" : "Brain Sollaris com memória persistente · Lembra de todas as conversas"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrainNalu;
