---
name: Admin Boutique Light v5
description: Nova identidade do admin (v5): tema claro creme, Inter Tight, navegação 3 hubs + Brain FAB, motion-rich.
type: design
---
O Admin Sollaris foi refundado em v5 com a identidade "Boutique Light":

**Paleta (light):**
- Background: creme off-white (36 24% 97%)
- Card: branco puro (sombras Notion)
- Foreground: obsidiana (234 22% 9%)
- Accent/Primary: champagne saturado (36 60% 46%) — funciona em fundo claro
- Sidebar: levemente mais creme (36 22% 95%) pra delimitar do conteúdo

**Tipografia:** Inter Tight única família no admin (400/500/600/700). Gloock fica reservada exclusivamente para storefront via `font-display`/`font-serif`.

**Navegação:** sidebar 240px com 3 hubs sempre expandidos:
- Comercial (indigo `--hub-comercial`): Vendas, Clientes, Marketing, Dept. Comercial
- Operação (emerald `--hub-operacao`): Estoque, Categorias, Fornecedores, Tarefas, Notas, Newsletter
- Finanças (amber `--hub-financas`): Financeiro, Cupons

Dashboard fica no topo, Configurações em "Sistema" no final. Brain Sollaris virou FAB flutuante bottom-right (gradiente champagne, pulse sutil, esconde na própria rota).

**Topbar:** breadcrumb dinâmico (Hub / Página) com bullet colorido do hub.

**Motion:** page transitions (fade+slide), KpiCard com CountUp animado, stagger nos headers e KPIs, hover-lift nos cards interativos. Presets em `src/lib/motion.ts`.

**Componentes-base:** `src/components/admin/ui/{PageHeader,KpiCard,CountUp}.tsx` + `BrainFAB.tsx`.

**Sombras:** `shadow-notion-{sm,md,lg}` substituem o sistema antigo.
