/**
 * SOLLARIS Shipping Service
 * ─────────────────────────────────────────────────────────────────
 * - Validação de CEP via ViaCEP (sem token, gratuita)
 * - Cálculo de frete por região (faixa Sudeste / outras)
 * - Frete grátis acima de R$ 500
 * - Arquitetura pronta pra plugar Melhor Envio depois
 *   (basta substituir `calculateShipping` por chamada à edge function)
 */

export interface AddressLookup {
  zip: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  ok: boolean;
  error?: string;
}

export interface ShippingQuote {
  cost: number;
  etaDays: number;
  carrier: string;
  isFree: boolean;
}

const FREE_SHIPPING_THRESHOLD = 500;

const REGION_RATES: Record<string, { cost: number; eta: number }> = {
  // Sudeste (mais barato/rápido)
  SP: { cost: 19.9, eta: 3 },
  RJ: { cost: 24.9, eta: 4 },
  MG: { cost: 24.9, eta: 4 },
  ES: { cost: 24.9, eta: 5 },
  // Sul
  PR: { cost: 29.9, eta: 5 },
  SC: { cost: 29.9, eta: 6 },
  RS: { cost: 32.9, eta: 7 },
  // Centro-Oeste
  DF: { cost: 32.9, eta: 6 },
  GO: { cost: 32.9, eta: 6 },
  MT: { cost: 36.9, eta: 8 },
  MS: { cost: 36.9, eta: 8 },
  // Nordeste
  BA: { cost: 34.9, eta: 7 },
  PE: { cost: 36.9, eta: 8 },
  CE: { cost: 36.9, eta: 8 },
  AL: { cost: 36.9, eta: 9 },
  PB: { cost: 36.9, eta: 9 },
  RN: { cost: 36.9, eta: 9 },
  SE: { cost: 36.9, eta: 9 },
  PI: { cost: 38.9, eta: 10 },
  MA: { cost: 38.9, eta: 10 },
  // Norte
  PA: { cost: 42.9, eta: 11 },
  AM: { cost: 46.9, eta: 13 },
  AC: { cost: 46.9, eta: 14 },
  RO: { cost: 44.9, eta: 12 },
  RR: { cost: 49.9, eta: 14 },
  AP: { cost: 49.9, eta: 14 },
  TO: { cost: 39.9, eta: 10 },
};

const DEFAULT_RATE = { cost: 39.9, eta: 10 };

export const maskCEP = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/**
 * Consulta endereço pelo CEP via ViaCEP (público, sem auth)
 */
export async function lookupAddress(cep: string): Promise<AddressLookup> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    return { zip: cep, street: "", neighborhood: "", city: "", state: "", ok: false, error: "CEP deve ter 8 dígitos" };
  }
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!r.ok) throw new Error("Falha ViaCEP");
    const j = await r.json();
    if (j.erro) {
      return { zip: cep, street: "", neighborhood: "", city: "", state: "", ok: false, error: "CEP não encontrado" };
    }
    return {
      zip: maskCEP(digits),
      street: j.logradouro || "",
      neighborhood: j.bairro || "",
      city: j.localidade || "",
      state: (j.uf || "").toUpperCase(),
      ok: true,
    };
  } catch (e) {
    return { zip: cep, street: "", neighborhood: "", city: "", state: "", ok: false, error: "Erro ao consultar CEP" };
  }
}

/**
 * Calcula frete pela UF + valor do pedido.
 * — Frete grátis se subtotal ≥ FREE_SHIPPING_THRESHOLD
 * — Caso contrário usa tabela regional
 *
 * Para trocar por Melhor Envio depois:
 *   const { data } = await supabase.functions.invoke("calculate-shipping", { body: { cep, items } });
 *   return { cost: data.price, etaDays: data.delivery_time, carrier: data.name, isFree: false };
 */
export function calculateShipping(state: string, subtotal: number): ShippingQuote {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    const rate = REGION_RATES[state] || DEFAULT_RATE;
    return { cost: 0, etaDays: rate.eta, carrier: "Sollaris Premium", isFree: true };
  }
  const rate = REGION_RATES[state.toUpperCase()] || DEFAULT_RATE;
  return {
    cost: rate.cost,
    etaDays: rate.eta,
    carrier: "Sollaris Standard",
    isFree: false,
  };
}

export const isValidCPF = (cpf: string): boolean => {
  const c = onlyDigits(cpf);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10]);
};

export const maskCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
