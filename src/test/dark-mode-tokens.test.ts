import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Garante que o dark mode tem hierarquia de cores correta:
 * - foregrounds (texto) devem ser claros (lightness alto)
 * - backgrounds (superfícies) devem ser escuros (lightness baixo)
 *
 * Falha se algum token --*-foreground ficar escuro no .dark, o que causaria
 * texto preto em fundo preto nas páginas Vendas / Clientes / Produtos.
 */

const css = readFileSync(resolve(__dirname, "../index.css"), "utf-8");

function extractDarkBlock(): string {
  const match = css.match(/\.dark\s*\{([\s\S]*?)\n\s*\}/);
  if (!match) throw new Error("Bloco .dark não encontrado em index.css");
  return match[1];
}

function parseTokens(block: string): Record<string, { h: number; s: number; l: number }> {
  const tokens: Record<string, { h: number; s: number; l: number }> = {};
  // captura linhas tipo: --foreground: 36 25% 97%;
  const re = /--([a-z0-9-]+):\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\s*;/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    tokens[m[1]] = { h: +m[2], s: +m[3], l: +m[4] };
  }
  return tokens;
}

const darkBlock = extractDarkBlock();
const tokens = parseTokens(darkBlock);

const FOREGROUND_TOKENS = [
  "foreground",
  "card-foreground",
  "popover-foreground",
  "secondary-foreground",
  "sidebar-foreground",
  "sidebar-accent-foreground",
];

const SURFACE_TOKENS = [
  "background",
  "card",
  "popover",
  "secondary",
  "muted",
  "sidebar-background",
];

describe("dark mode · design tokens", () => {
  it("extrai o bloco .dark do index.css", () => {
    expect(Object.keys(tokens).length).toBeGreaterThan(10);
  });

  it.each(FOREGROUND_TOKENS)(
    "token --%s deve ser CLARO no dark mode (lightness ≥ 85%%)",
    (name) => {
      const t = tokens[name];
      expect(t, `token --${name} ausente no .dark`).toBeDefined();
      expect(
        t.l,
        `--${name} tem lightness ${t.l}% — texto ficaria escuro sobre fundo escuro`,
      ).toBeGreaterThanOrEqual(85);
    },
  );

  it("--muted-foreground deve manter contraste mínimo (≥ 60%)", () => {
    const t = tokens["muted-foreground"];
    expect(t).toBeDefined();
    expect(t.l).toBeGreaterThanOrEqual(60);
  });

  it.each(SURFACE_TOKENS)(
    "token --%s deve ser ESCURO no dark mode (lightness ≤ 20%%)",
    (name) => {
      const t = tokens[name];
      expect(t, `token --${name} ausente no .dark`).toBeDefined();
      expect(
        t.l,
        `--${name} tem lightness ${t.l}% — superfície clara demais para dark mode`,
      ).toBeLessThanOrEqual(20);
    },
  );

  it("hierarquia de superfícies: background ≤ card ≤ popover", () => {
    const bg = tokens["background"].l;
    const card = tokens["card"].l;
    const popover = tokens["popover"].l;
    expect(bg).toBeLessThanOrEqual(card);
    expect(card).toBeLessThanOrEqual(popover);
  });

  it("contraste foreground vs background ≥ 80 pontos de lightness", () => {
    const fg = tokens["foreground"].l;
    const bg = tokens["background"].l;
    expect(Math.abs(fg - bg)).toBeGreaterThanOrEqual(80);
  });

  it("contraste card-foreground vs card ≥ 80 pontos", () => {
    const fg = tokens["card-foreground"].l;
    const bg = tokens["card"].l;
    expect(Math.abs(fg - bg)).toBeGreaterThanOrEqual(80);
  });
});
