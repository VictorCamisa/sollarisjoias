import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, ShoppingBag, ExternalLink, MessageCircle, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Msg = { role: "user" | "assistant"; content: string };

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  sizes?: string[];
  colors?: string[];
  image?: string;
  category?: string;
};

type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image?: string;
};

type OrderState = {
  items: OrderItem[];
  customer: { name?: string; phone?: string; email?: string };
};

type ChatEvent =
  | { type: "products"; data: Product[] }
  | { type: "order_update"; data: { items: OrderItem[]; total: number; customer: any } }
  | { type: "order_submitted"; data: { order_id: string; whatsapp_url: string | null; total: number } }
  | { type: "order_state"; data: OrderState };

type RichMessage = Msg & {
  products?: Product[];
  orderSubmitted?: { order_id: string; whatsapp_url: string | null; total: number };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/style-assistant`;

async function streamChat({
  messages,
  orderState,
  onDelta,
  onEvent,
  onDone,
}: {
  messages: Msg[];
  orderState: OrderState;
  onDelta: (t: string) => void;
  onEvent: (evt: ChatEvent) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, order_state: orderState }),
  });

  if (resp.status === 429) {
    toast.error("Muitas requisições. Tente novamente em instantes.");
    throw new Error("Rate limited");
  }
  if (resp.status === 402) {
    toast.error("Serviço de IA temporariamente indisponível.");
    throw new Error("Payment required");
  }
  if (!resp.ok || !resp.body) throw new Error("Stream failed");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: rd, value } = await reader.read();
    if (rd) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const p = JSON.parse(json);
        if (p.type && ["products", "order_update", "order_submitted", "order_state"].includes(p.type)) {
          onEvent(p as ChatEvent);
          continue;
        }
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }

  if (buf.trim()) {
    for (let raw of buf.split("\n")) {
      if (!raw || !raw.startsWith("data: ")) continue;
      const json = raw.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const p = JSON.parse(json);
        if (p.type && ["products", "order_update", "order_submitted", "order_state"].includes(p.type)) {
          onEvent(p as ChatEvent);
          continue;
        }
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {}
    }
  }
  onDone();
}

const SUGGESTIONS = [
  "Oi Lari! Quero ajuda pra escolher uma semijoia 💎",
  "Tô procurando algo pra presentear ✨",
  "Me mostra as peças mais vendidas 🛍️",
];

/* ─── Product card ─── */
const ProductCard = ({ product }: { product: Product }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="group flex gap-3 p-3 rounded-xl bg-background border border-border/60 hover:border-accent/30 transition-all duration-300 hover:shadow-sm"
  >
    {product.image && (
      <img
        src={product.image}
        alt={product.name}
        className="w-20 h-20 object-cover rounded-lg shrink-0"
      />
    )}
    <div className="min-w-0 flex-1 flex flex-col justify-center">
      <p className="text-xs font-sans font-semibold text-foreground truncate">{product.name}</p>
      <p className="text-sm font-sans font-bold text-accent mt-0.5">
        R$ {product.price.toFixed(2).replace(".", ",")}
      </p>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {product.sizes?.slice(0, 4).map((s) => (
          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-sans">
            {s}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

/* ─── Order summary ─── */
const OrderSummary = ({ items, total }: { items: OrderItem[]; total: number }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    className="mx-4 mb-2 p-3 rounded-xl bg-accent/5 border border-accent/15"
  >
    <div className="flex items-center gap-1.5 mb-2">
      <ShoppingBag className="h-3.5 w-3.5 text-accent" />
      <span className="text-xs font-sans font-semibold text-accent">Seu Pedido</span>
      <span className="ml-auto text-[10px] text-muted-foreground font-sans">{items.length} {items.length === 1 ? "item" : "itens"}</span>
    </div>
    {items.map((item, i) => (
      <div key={i} className="flex justify-between items-center py-1 text-xs font-sans">
        <div className="flex items-center gap-2 min-w-0">
          {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
          <div className="min-w-0">
            <p className="truncate text-foreground">{item.name}</p>
            <p className="text-[10px] text-muted-foreground">{item.size} · {item.color}</p>
          </div>
        </div>
        <span className="shrink-0 ml-2 font-medium">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
      </div>
    ))}
    <div className="border-t border-accent/15 mt-2 pt-2 flex justify-between text-sm font-sans font-bold text-accent">
      <span>Total</span>
      <span>R$ {total.toFixed(2).replace(".", ",")}</span>
    </div>
  </motion.div>
);

const StyleAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<RichMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderState, setOrderState] = useState<OrderState>({ items: [], customer: {} });
  const [pendingOrder, setPendingOrder] = useState<{
    order_id: string;
    whatsapp_url: string | null;
    total: number;
    items: OrderItem[];
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingEventsRef = useRef<{ products: Product[]; orderSubmitted?: any }>({ products: [] });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: RichMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    let soFar = "";
    pendingEventsRef.current = { products: [] };

    const upsert = (chunk: string) => {
      soFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: soFar, products: pendingEventsRef.current.products.length > 0 ? [...pendingEventsRef.current.products] : m.products, orderSubmitted: pendingEventsRef.current.orderSubmitted || m.orderSubmitted }
              : m
          );
        }
        return [...prev, { role: "assistant", content: soFar, products: pendingEventsRef.current.products.length > 0 ? [...pendingEventsRef.current.products] : undefined, orderSubmitted: pendingEventsRef.current.orderSubmitted }];
      });
    };

    const handleEvent = (evt: ChatEvent) => {
      if (evt.type === "products") {
        pendingEventsRef.current.products = [...pendingEventsRef.current.products, ...evt.data];
      } else if (evt.type === "order_update") {
        setOrderState((prev) => ({ ...prev, items: evt.data.items, customer: evt.data.customer || prev.customer }));
      } else if (evt.type === "order_submitted") {
        pendingEventsRef.current.orderSubmitted = evt.data;
        // Show confirmation modal instead of immediately completing
        setPendingOrder({
          order_id: evt.data.order_id,
          whatsapp_url: evt.data.whatsapp_url,
          total: evt.data.total,
          items: [...orderState.items],
        });
        setOrderState({ items: [], customer: {} });
      } else if (evt.type === "order_state") {
        setOrderState(evt.data);
      }
    };

    const plainMessages: Msg[] = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChat({
        messages: plainMessages,
        orderState,
        onDelta: upsert,
        onEvent: handleEvent,
        onDone: () => {
          setLoading(false);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1
                  ? { ...m, products: pendingEventsRef.current.products.length > 0 ? pendingEventsRef.current.products : m.products, orderSubmitted: pendingEventsRef.current.orderSubmitted || m.orderSubmitted }
                  : m
              );
            }
            return prev;
          });
        },
      });
    } catch {
      setLoading(false);
    }
  };

  const orderTotal = orderState.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            data-style-assistant-trigger
            className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-foreground text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <MessageCircle className="h-6 w-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-foreground/20 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[100dvh] sm:h-[620px] sm:max-h-[calc(100vh-3rem)] bg-card sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-border/50"
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-4 bg-foreground text-primary-foreground">
              {/* Subtle pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "20px 20px" }} />
              
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold leading-tight">Lari</h3>
                    <p className="text-xs text-primary-foreground/60 font-sans mt-0.5">Consultora de semijoias LARIFA</p>
                  </div>
                </div>
                <button 
                  onClick={() => setOpen(false)} 
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary-foreground/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Online indicator */}
              <div className="relative flex items-center gap-1.5 mt-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-[10px] text-primary-foreground/50 font-sans">Online agora</span>
              </div>
            </div>

            {/* Order bar (collapsible) */}
            <AnimatePresence>
              {orderState.items.length > 0 && (
                <OrderSummary items={orderState.items} total={orderTotal} />
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center text-center pt-4 pb-2"
                >
                  <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-7 w-7 text-accent" />
                  </div>
                  <p className="font-serif text-lg font-semibold text-foreground mb-1">Oii! Eu sou a Lari 💕</p>
                  <p className="text-xs text-muted-foreground font-sans max-w-[260px] leading-relaxed mb-6">
                    Sua consultora de semijoias da LARIFA! Te ajudo a encontrar a peça perfeita e monto seu pedido completo.
                  </p>
                  <div className="w-full space-y-2">
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs font-sans px-4 py-3 rounded-xl border border-border/60 hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[82%] space-y-2">
                    {/* Avatar + bubble */}
                    <div className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      {m.role === "assistant" && (
                        <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="h-3.5 w-3.5 text-accent" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm font-sans leading-relaxed ${
                          m.role === "user"
                            ? "bg-foreground text-primary-foreground rounded-br-md"
                            : "bg-secondary/80 text-foreground rounded-bl-md"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none [&>p]:m-0 [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ol]:my-1 text-[13px]">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-[13px]">{m.content}</span>
                        )}
                      </div>
                    </div>

                    {/* Product cards */}
                    {m.role === "assistant" && m.products && m.products.length > 0 && (
                      <div className="ml-9 space-y-2">
                        {m.products.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}

                    {/* Order submitted */}
                    {m.role === "assistant" && m.orderSubmitted && (
                      <div className="ml-9">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/40"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🎉</span>
                            <p className="text-sm font-sans font-semibold text-green-700 dark:text-green-400">
                              Pedido registrado!
                            </p>
                          </div>
                          <p className="text-xs font-sans text-green-600 dark:text-green-500 mb-1">
                            #{m.orderSubmitted.order_id.slice(0, 8)}
                          </p>
                          <p className="text-sm font-sans font-bold text-green-700 dark:text-green-400 mb-3">
                            Total: R$ {m.orderSubmitted.total.toFixed(2).replace(".", ",")}
                          </p>
                          {m.orderSubmitted.whatsapp_url && (
                            <a
                              href={m.orderSubmitted.whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-sans font-semibold transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Finalizar no WhatsApp
                            </a>
                          )}
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 items-start"
                >
                  <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="bg-secondary/80 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-border/50 px-4 py-3 bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 bg-secondary/60 rounded-xl px-4 py-2.5 text-sm font-sans outline-none placeholder:text-muted-foreground/60 focus:bg-secondary transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-10 w-10 rounded-xl bg-foreground text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-90 active:scale-95 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="text-center text-[10px] text-muted-foreground/40 font-sans mt-2">
                Assistente IA · LARIFA
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StyleAssistant;
