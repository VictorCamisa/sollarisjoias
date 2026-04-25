import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

/**
 * Smoke test estático para Vendas (Orders), Clientes (Customers) e Produtos (Products)
 * + componentes filhos. Falha se houver classes Tailwind ou inline-styles que forçam
 * texto escuro, o que quebraria a leitura no dark mode.
 *
 * Por que estático e não render full?
 * - As páginas usam Supabase + react-query + router, custoso de mockar em jsdom.
 * - jsdom não aplica CSS computado, então um render não detectaria contraste real.
 * - Esta varredura captura o padrão concreto de bug observado: `text-black`,
 *   `text-zinc-900`, inline `color: #000`, etc.
 */

const ROOT = resolve(__dirname, "..");

const TARGETS = [
  "pages/admin/AdminOrders.tsx",
  "pages/admin/AdminCustomers.tsx",
  "pages/admin/AdminProducts.tsx",
  "components/admin/orders",
  "components/admin/products",
];

// Classes proibidas — forçariam texto escuro independente do tema (causa real do bug)
const FORBIDDEN_CLASS_PATTERNS = [
  /\btext-black\b/,
  /\btext-zinc-(900|800|950)\b/,
  /\btext-gray-(900|800|950)\b/,
  /\btext-slate-(900|800|950)\b/,
  /\btext-neutral-(900|800|950)\b/,
  /\btext-stone-(900|800|950)\b/,
];

// Inline styles proibidos — forçam preto fixo
const FORBIDDEN_INLINE_PATTERNS = [
  /color:\s*['"]?#000(?:000)?['"]?/i,
  /color:\s*['"]?black['"]?/i,
];

function collectFiles(target: string): string[] {
  const abs = join(ROOT, target);
  if (!existsSync(abs)) return [];
  const stat = statSync(abs);
  if (stat.isFile()) return [abs];
  // dir → recursivo
  const out: string[] = [];
  for (const entry of readdirSync(abs)) {
    out.push(...collectFiles(join(target, entry)));
  }
  return out.filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
}

const allFiles = TARGETS.flatMap(collectFiles);

describe("dark mode · scan estático de páginas críticas", () => {
  it("encontra os arquivos alvo (Vendas, Clientes, Produtos)", () => {
    expect(allFiles.length).toBeGreaterThan(0);
    expect(allFiles.some((f) => f.endsWith("AdminOrders.tsx"))).toBe(true);
    expect(allFiles.some((f) => f.endsWith("AdminCustomers.tsx"))).toBe(true);
    expect(allFiles.some((f) => f.endsWith("AdminProducts.tsx"))).toBe(true);
  });

  it("nenhum arquivo usa classes Tailwind de cor fixa proibidas", () => {
    const violations: string[] = [];
    for (const file of allFiles) {
      const src = readFileSync(file, "utf-8");
      // remove comentários de linha e bloco
      const cleaned = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      for (const pat of FORBIDDEN_CLASS_PATTERNS) {
        const m = cleaned.match(pat);
        if (m) {
          const lineIdx = cleaned.slice(0, m.index ?? 0).split("\n").length;
          violations.push(
            `${file.replace(ROOT + "/", "")}:${lineIdx} → "${m[0]}"`,
          );
        }
      }
    }
    expect(
      violations,
      `Use tokens semânticos (text-foreground / text-muted-foreground) em vez de cor fixa.\n` +
        violations.join("\n"),
    ).toEqual([]);
  });

  it("nenhum arquivo usa inline color preto/branco fixo", () => {
    const violations: string[] = [];
    for (const file of allFiles) {
      const src = readFileSync(file, "utf-8");
      for (const pat of FORBIDDEN_INLINE_PATTERNS) {
        if (pat.test(src)) {
          violations.push(`${file.replace(ROOT + "/", "")} → ${pat}`);
        }
      }
    }
    expect(
      violations,
      `Use semantic tokens via className em vez de inline color.\n` +
        violations.join("\n"),
    ).toEqual([]);
  });
});
