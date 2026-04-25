import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { OrderStatsCards } from "@/components/admin/orders/OrderStatsCards";
import { ProductStatsCards } from "@/components/admin/products/ProductStatsCards";

/**
 * Render real (jsdom) dos cards de KPI usados em Vendas e Produtos
 * com a classe `.dark` aplicada no <html>. Garante:
 *  - renderizam sem crashar em dark mode
 *  - nenhum elemento de texto carrega style inline `color` escuro
 *  - nenhum elemento usa className com cores fixas proibidas
 */

const FORBIDDEN_CLASS_RE =
  /\b(text-black|text-(zinc|gray|slate|neutral|stone)-(900|800|950))\b/;

function darkify() {
  document.documentElement.classList.add("dark");
}
function undarkify() {
  document.documentElement.classList.remove("dark");
}

beforeEach(darkify);
afterEach(() => {
  undarkify();
  cleanup();
});

function assertNoForbiddenColors(root: HTMLElement) {
  const all = root.querySelectorAll<HTMLElement>("*");
  const violations: string[] = [];
  all.forEach((el) => {
    const cls = el.getAttribute("class") || "";
    if (FORBIDDEN_CLASS_RE.test(cls)) {
      violations.push(`<${el.tagName.toLowerCase()} class="${cls}">`);
    }
    const style = el.getAttribute("style") || "";
    if (/color:\s*(#000|black)/i.test(style)) {
      violations.push(`<${el.tagName.toLowerCase()} style="${style}">`);
    }
  });
  expect(
    violations,
    `Encontrados elementos com cor fixa em dark mode:\n${violations.join("\n")}`,
  ).toEqual([]);
}

describe("dark mode · render smoke (Vendas)", () => {
  it("OrderStatsCards renderiza com .dark sem cor fixa", () => {
    const { container } = render(
      <OrderStatsCards
        stats={{
          total: 12,
          pending: 3,
          confirmed: 5,
          delivered: 4,
          cancelled: 0,
          revenue: 1234.56,
        }}
      />,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(container.textContent).toContain("Total de Pedidos");
    assertNoForbiddenColors(container);
  });
});

describe("dark mode · render smoke (Produtos)", () => {
  it("ProductStatsCards renderiza com .dark sem cor fixa", () => {
    const { container } = render(
      <ProductStatsCards
        stats={{
          total: 50,
          outOfStock: 2,
          lowStock: 3,
          featured: 8,
          totalValue: 9876.54,
          withPhotos: 45,
          withoutSeo: 5,
          avgPrice: 199.9,
          withDiscount: 4,
        }}
      />,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    assertNoForbiddenColors(container);
  });
});
