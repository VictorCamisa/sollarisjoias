// Analytics tracker — registra sessões, pageviews, eventos e estado do carrinho
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "sollaris_session_id";
const VISITOR_KEY = "sollaris_visitor_id";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30min de inatividade encerra sessão

const uuid = () => {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const detectDevice = (): { device: string; browser: string; os: string } => {
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  let os = "other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { device, browser, os };
};

const getUtms = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
};

let currentSessionId: string | null = null;
let currentPageviewId: string | null = null;
let pageEnterTime = Date.now();
let heartbeatInterval: number | null = null;

const getOrCreateVisitor = () => {
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) {
    v = uuid();
    localStorage.setItem(VISITOR_KEY, v);
  }
  return v;
};

const getOrCreateSession = (): string => {
  if (currentSessionId) return currentSessionId;

  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.id && Date.now() - parsed.lastSeen < SESSION_TTL_MS) {
        currentSessionId = parsed.id;
        return parsed.id;
      }
    } catch {
      // ignora
    }
  }

  const id = uuid();
  currentSessionId = id;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastSeen: Date.now() }));
  return id;
};

const touchSession = () => {
  if (!currentSessionId) return;
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: currentSessionId, lastSeen: Date.now() })
  );
};

/* Inicia uma sessão (cria registro no banco se for nova) */
export const initSession = async () => {
  const sessionId = getOrCreateSession();
  const visitorId = getOrCreateVisitor();
  const { device, browser, os } = detectDevice();
  const utms = getUtms();

  // Tenta ler — se já existe atualiza last_seen, senão cria
  const { data: existing } = await supabase
    .from("analytics_sessions")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("analytics_sessions")
      .update({ last_seen_at: new Date().toISOString(), is_active: true })
      .eq("session_id", sessionId);
  } else {
    await supabase.from("analytics_sessions").insert({
      session_id: sessionId,
      visitor_id: visitorId,
      user_agent: navigator.userAgent,
      device_type: device,
      browser,
      os,
      referrer: document.referrer || null,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      landing_page: window.location.pathname,
    });
  }

  // Heartbeat: a cada 30s atualiza last_seen
  if (heartbeatInterval) window.clearInterval(heartbeatInterval);
  heartbeatInterval = window.setInterval(async () => {
    touchSession();
    await supabase
      .from("analytics_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("session_id", sessionId);
  }, 30000);

  // Encerra sessão ao sair
  window.addEventListener(
    "beforeunload",
    () => {
      // Best-effort — pode não completar
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_sessions?session_id=eq.${sessionId}`,
        new Blob(
          [JSON.stringify({ last_seen_at: new Date().toISOString() })],
          { type: "application/json" }
        )
      );
      flushPageview();
    },
    { capture: true }
  );

  return sessionId;
};

/* Registra um pageview */
export const trackPageview = async (path: string, title?: string) => {
  // Fecha o anterior
  await flushPageview();

  const sessionId = getOrCreateSession();
  pageEnterTime = Date.now();

  const { data } = await supabase
    .from("analytics_pageviews")
    .insert({
      session_id: sessionId,
      path,
      title: title || document.title,
      referrer: document.referrer || null,
    })
    .select("id")
    .single();

  currentPageviewId = data?.id || null;

  // Incrementa contador na sessão
  const { data: session } = await supabase
    .from("analytics_sessions")
    .select("pageview_count")
    .eq("session_id", sessionId)
    .maybeSingle();

  await supabase
    .from("analytics_sessions")
    .update({
      pageview_count: (session?.pageview_count || 0) + 1,
      last_seen_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);

  touchSession();
};

/* Fecha o pageview atual com duração */
export const flushPageview = async () => {
  if (!currentPageviewId) return;
  const duration = Date.now() - pageEnterTime;
  await supabase
    .from("analytics_pageviews")
    .update({ duration_ms: duration, left_at: new Date().toISOString() })
    .eq("id", currentPageviewId);
  currentPageviewId = null;
};

/* Evento genérico */
export const trackEvent = async (
  eventType: string,
  payload?: { productId?: string; productName?: string; metadata?: Record<string, unknown> }
) => {
  const sessionId = getOrCreateSession();
  await (supabase.from("analytics_events") as any).insert({
    session_id: sessionId,
    event_type: eventType,
    product_id: payload?.productId || null,
    product_name: payload?.productName || null,
    path: window.location.pathname,
    metadata: payload?.metadata || {},
  });
  touchSession();
};

/* Sincroniza estado do carrinho */
export const syncCart = async (
  items: Array<{ id: string; name: string; price: number; quantity: number; image?: string | null }>,
  customer?: { name?: string; phone?: string }
) => {
  const sessionId = getOrCreateSession();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const isOpen = itemCount > 0;

  const { data: existing } = await supabase
    .from("analytics_carts")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  const row = {
    session_id: sessionId,
    items: items,
    item_count: itemCount,
    total_value: totalValue,
    customer_name: customer?.name || null,
    customer_phone: customer?.phone || null,
    is_open: isOpen,
  };

  if (existing) {
    await (supabase.from("analytics_carts") as any).update(row).eq("session_id", sessionId);
  } else if (isOpen) {
    await (supabase.from("analytics_carts") as any).insert(row);
  }
  touchSession();
};

export const getSessionId = () => currentSessionId || getOrCreateSession();
