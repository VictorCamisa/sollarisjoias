import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, ShoppingBag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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

// A message can have embedded rich content
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
        // Check if it's a structured event
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
  "Me ajuda a montar um look para um jantar romântico",
  "Quero um outfit casual de fim de semana",
  "Preciso de um look para reunião de trabalho",
];

// Product card component
const ProductCard = ({ product }: { product: Product }) => (
  <div className="flex gap-2 p-2 rounded-lg bg-background/50 border border-border/50">
    {product.image && (
      <img
        src={product.image}
        alt={product.name}
        className="w-16 h-16 object-cover rounded-md shrink-0"
      />
    )}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold truncate">{product.name}</p>
      <p className="text-xs text-accent font-bold">R$ {product.price.toFixed(2).replace(".", ",")}</p>
      {product.sizes && <p className="text-[10px] text-muted-foreground">Tam: {product.sizes.join(", ")}</p>}
      {product.colors && <p className="text-[10px] text-muted-foreground">Cores: {product.colors.join(", ")}</p>}
    </div>
  </div>
);

// Order summary mini-component
const OrderSummary = ({ items, total }: { items: OrderItem[]; total: number }) => (
  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
    <div className="flex items-center gap-1 mb-1">
      <ShoppingBag className="h-3 w-3 text-accent" />
      <span className="text-[10px] font-semibold text-accent">Seu Pedido</span>
    </div>
    {items.map((item, i) => (
      <div key={i} className="flex justify-between text-[10px] py-0.5">
        <span className="truncate">{item.name} ({item.size}/{item.color})</span>
        <span className="shrink-0 ml-2">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
      </div>
    ))}
    <div className="border-t border-accent/20 mt-1 pt-1 flex justify-between text-xs font-bold">
      <span>Total</span>
      <span>R$ {total.toFixed(2).replace(".", ",")}</span>
    </div>
  </div>
);

const StyleAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<RichMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderState, setOrderState] = useState<OrderState>({ items: [], customer: {} });
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ref to accumulate events during a single response
  const pendingEventsRef = useRef<{ products: Product[]; orderSubmitted?: any }>({ products: [] });

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

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
        setOrderState({ items: [], customer: {} });
      } else if (evt.type === "order_state") {
        setOrderState(evt.data);
      }
    };

    // Build plain messages for API (strip rich content)
    const plainMessages: Msg[] = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChat({
        messages: plainMessages,
        orderState,
        onDelta: upsert,
        onEvent: handleEvent,
        onDone: () => {
          setLoading(false);
          // Final update with all events
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
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[580px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="font-serif text-sm font-semibold">Lari — Estilista & Vendedora IA</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Order bar */}
            {orderState.items.length > 0 && (
              <div className="px-3 py-2 bg-accent/5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium">{orderState.items.length} {orderState.items.length === 1 ? "item" : "itens"}</span>
                </div>
                <span className="text-xs font-bold text-accent">R$ {orderTotal.toFixed(2).replace(".", ",")}</span>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Sparkles className="h-8 w-8 text-accent mx-auto mb-3" />
                  <p className="font-serif text-sm font-semibold mb-1">Olá! Eu sou a Lari ✨</p>
                  <p className="text-xs text-muted-foreground mb-1">
                    Sua estilista virtual e vendedora da LARIFA.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Eu busco, mostro fotos, monto seu look, crio o pedido e envio pro WhatsApp!
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs text-left px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-accent text-accent-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>

                  {/* Product cards */}
                  {m.role === "assistant" && m.products && m.products.length > 0 && (
                    <div className="max-w-[85%] mt-2 space-y-1.5 w-full">
                      {m.products.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}

                  {/* Order submitted */}
                  {m.role === "assistant" && m.orderSubmitted && (
                    <div className="max-w-[85%] mt-2 w-full">
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                          ✅ Pedido #{m.orderSubmitted.order_id.slice(0, 8)} criado!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500 mb-2">
                          Total: R$ {m.orderSubmitted.total.toFixed(2).replace(".", ",")}
                        </p>
                        {m.orderSubmitted.whatsapp_url && (
                          <a
                            href={m.orderSubmitted.whatsapp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Finalizar no WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-3 py-2 text-sm text-muted-foreground">
                    <span className="animate-pulse">Lari está trabalhando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Descreva o que procura..."
                  className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl h-9 w-9 shrink-0"
                  disabled={loading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StyleAssistant;
