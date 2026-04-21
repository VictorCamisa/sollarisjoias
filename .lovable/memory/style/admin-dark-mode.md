---
name: Dark mode admin toggle
description: Admin tem toggle claro/escuro persistido em localStorage. Boutique Light é padrão; dark é Obsidiana profunda + Champagne luminoso.
type: design
---

**Implementação:**
- `src/contexts/ThemeContext.tsx`: provider com `theme: "light"|"dark"`, persistência em `localStorage["sollaris-admin-theme"]`. Aplica classe `.light`/`.dark` em `document.documentElement`.
- `src/components/admin/ThemeToggle.tsx`: botão Sun/Moon na topbar (desktop + mobile) com swap animado (rotate+scale).
- Provider envolve `<App />` no `main.tsx`.

**Tokens dark (`.dark` em index.css):**
- Background: `234 18% 7%` (obsidiana profunda)
- Card: `234 16% 10%`
- Foreground: `36 18% 94%` (creme suave)
- Accent/Primary: `36 70% 60%` (champagne luminoso — mais saturado que no light)
- Sidebar: `234 20% 5%` (mais escuro que o conteúdo)
- Hubs intensificados: comercial `245 80% 68%`, operacao `158 65% 50%`, financas `38 95% 58%`
- Sombras pretas profundas (alpha 0.3-0.55)

**Tailwind:** `darkMode: ["class"]` já configurado.
