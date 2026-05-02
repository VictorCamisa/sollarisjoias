import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Mic, MicOff, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image: string | null;
  category?: string;
  material?: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  checkout_url?: string;
  audio?: string; // base64
}

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SUGGESTIONS = [
  "Sugira um anel pra presentear",
  "Quero algo delicado pro dia a dia",
  "Brincos pra um casamento",
];

const BrainConcierge = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [chatCart, setChatCart] = useState<{ id: string; name: string; price: number; image: string | null; quantity: number }[]>([]);

  const { addItem, setIsOpen: openMainCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Abertura via evento global (CTA na home, links etc.)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("sollaris:open-concierge", handler);
    return () => window.removeEventListener("sollaris:open-concierge", handler);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Olá! Sou a Consultora Sollaris ✨\n\nMe diga o que está procurando — uma ocasião, um estilo, ou uma faixa de preço — e eu monto uma seleção pra você direto aqui no chat.",
        },
      ]);
    }
  }, [open]);

  const playAudio = (base64: string) => {
    try {
      if (audioCtxRef.current) audioCtxRef.current.pause();
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioCtxRef.current = audio;
      audio.play().catch(() => {});
    } catch {}
  };

  const send = async (text: string, fromAudio = false) => {
    if (!text.trim() || loading) return;
    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("brain-storefront", {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          cart: chatCart,
          origin: window.location.origin,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      let audio: string | undefined;
      if (fromAudio && data.response) {
        try {
          const tts = await supabase.functions.invoke("brain-voice", {
            body: { text: data.response },
          });
          if (tts.data?.audioContent) audio = tts.data.audioContent;
        } catch {}
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "",
          products: data.products?.length ? data.products : undefined,
          checkout_url: data.checkout_url,
          audio,
        },
      ]);
      if (data.cart) setChatCart(data.cart);
      if (audio) playAudio(audio);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: e.message || "Não foi possível enviar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "audio.webm");
        setLoading(true);
        try {
          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brain-voice`, {
            method: "POST",
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: fd,
          });
          const json = await resp.json();
          setLoading(false);
          if (json.text) await send(json.text, true);
        } catch {
          setLoading(false);
          toast({ variant: "destructive", title: "Erro ao transcrever áudio" });
        }
      };
      rec.start();
      setRecording(true);
    } catch {
      toast({ variant: "destructive", title: "Permita o uso do microfone" });
    }
  };

  const stopRecording = () => mediaRecRef.current?.stop();

  const sendChatCartToMainCart = () => {
    chatCart.forEach((c) => {
      // Adiciona uma vez por unidade já no quantity correto via repetição simples
      for (let i = 0; i < c.quantity; i++) {
        addItem({ id: c.id, name: c.name, price: c.price, image: c.image });
      }
    });
    setOpen(false);
    openMainCart(true);
  };

  const removeFromChatCart = (id: string) =>
    setChatCart((prev) => prev.filter((c) => c.id !== id));

  const total = chatCart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[55] group"
        aria-label="Abrir consultora Sollaris"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-bordeaux/40 animate-ping" />
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-bordeaux to-[#5a1a1f] text-maison-creme shadow-2xl shadow-bordeaux/40 flex items-center justify-center border border-champagne/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
          </div>
        </div>
        <span className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-foreground text-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] opacity-0 group-hover:opacity-100 transition-opacity">
          Consultora Sollaris
        </span>
      </motion.button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-background z-[61] flex flex-col border-l border-border shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-bordeaux text-maison-creme flex items-center justify-center">
                    <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-display text-[15px] text-foreground leading-tight">Consultora Sollaris</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/50">
                      Online · IA + Curadoria
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-muted rounded-full"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                      <div
                        className={`px-4 py-2.5 text-[14px] leading-relaxed ${
                          m.role === "user"
                            ? "bg-bordeaux text-maison-creme rounded-2xl rounded-br-sm"
                            : "bg-card text-foreground border border-border rounded-2xl rounded-bl-sm"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Product cards */}
                      {m.products && m.products.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 w-full">
                          {m.products.map((p) => (
                            <ProductMiniCard
                              key={p.id}
                              product={p}
                              onAdd={() => send(`Adicione ${p.name} ao carrinho`)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Checkout button */}
                      {m.checkout_url && (
                        <a
                          href={m.checkout_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full block bg-foreground text-background hover:bg-bordeaux transition-colors text-center py-3 font-mono text-[11px] uppercase tracking-[0.24em]"
                        >
                          Pagar agora · {formatBRL(total)} →
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-bordeaux/60 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-bordeaux/60 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-bordeaux/60 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                {messages.length === 1 && !loading && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-[12px] px-3 py-1.5 border border-border bg-card hover:border-bordeaux hover:text-bordeaux transition-colors font-mono uppercase tracking-wider"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart preview */}
              {chatCart.length > 0 && (
                <div className="border-t border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/60">
                      Sacola da conversa · {chatCart.length} {chatCart.length === 1 ? "peça" : "peças"}
                    </p>
                    <p className="font-display text-[14px] text-bordeaux">{formatBRL(total)}</p>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto mb-2">
                    {chatCart.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-[12px]">
                        <span className="flex-1 truncate text-foreground/80">
                          {c.quantity}× {c.name}
                        </span>
                        <button
                          onClick={() => removeFromChatCart(c.id)}
                          className="text-foreground/40 hover:text-bordeaux"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={sendChatCartToMainCart}
                    className="w-full text-[11px] font-mono uppercase tracking-[0.22em] py-2 border border-border hover:border-bordeaux hover:text-bordeaux transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-3 h-3" /> Mover pra sacola do site
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border bg-background px-3 py-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Conte o que procura…"
                    disabled={loading || recording}
                    className="flex-1 bg-card border border-border px-4 py-3 text-[14px] focus:outline-none focus:border-bordeaux placeholder:text-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    disabled={loading}
                    className={`p-3 transition-colors ${
                      recording
                        ? "bg-bordeaux text-maison-creme animate-pulse"
                        : "bg-card border border-border hover:border-bordeaux text-foreground"
                    }`}
                    aria-label={recording ? "Parar gravação" : "Gravar áudio"}
                  >
                    {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-3 bg-foreground text-background disabled:opacity-30 hover:bg-bordeaux transition-colors"
                    aria-label="Enviar"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
                <p className="text-[9px] text-foreground/40 text-center mt-2 font-mono uppercase tracking-wider">
                  IA pode errar — confirme detalhes antes do pagamento
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const ProductMiniCard = ({ product, onAdd }: { product: Product; onAdd: () => void }) => (
  <div className="bg-card border border-border overflow-hidden group">
    <Link to={`/produto/${product.id}`} className="block aspect-square overflow-hidden bg-muted">
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full bg-muted" />
      )}
    </Link>
    <div className="p-2.5">
      <p className="font-display text-[12px] leading-tight text-foreground line-clamp-2 mb-1 min-h-[2em]">
        {product.name}
      </p>
      <p className="font-mono text-[11px] text-bordeaux mb-2">{formatBRL(product.price)}</p>
      <button
        onClick={onAdd}
        className="w-full text-[9px] font-mono uppercase tracking-[0.18em] py-1.5 border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
      >
        Quero essa
      </button>
    </div>
  </div>
);

export default BrainConcierge;
