---
name: index
description: Memory index for Sollaris project
type: reference
---
# Project Memory

## Core
- Admin v5 BOUTIQUE LIGHT: fundo creme, Inter Tight, accent champagne saturado. Storefront permanece dark + Gloock.
- Tipografia admin: Inter Tight única família. Gloock SÓ no storefront via font-display/font-serif.
- Navegação admin: 3 hubs (Comercial indigo, Operação emerald, Finanças amber) + Dashboard topo + Brain Sollaris como FAB flutuante.
- Motion-rich: page transitions, CountUp em KPIs, stagger, hover-lift. Presets em src/lib/motion.ts.
- Tone: "Curadoria com Intenção", classes A/B. Wide-spaced uppercase. No retail jargon.
- Mobile: 100dvh/100svh, viewport-fit=cover. `overflow-x: hidden` ONLY on body, never html.
- AI Generation: GPT-4o com visual context injection. NEVER include text/slogans/typography in images.
- Voice: Must respond in audio via Evolution API if user sends audio.

## Memories
- [Admin Design Tokens v5](mem://style/admin-design-system-tokens) — Boutique Light, Inter Tight, hubs, motion
- [User Management](mem://auth/user-management) — Roles (Sócia, Operacional, Desenvolvimento)
- [Visual Identity](mem://brand/identidade-visual) — Storefront premium aesthetic
- [Typography](mem://brand/tipografia) — Gloock storefront, Inter Tight admin
- [Creative Direction](mem://brand/direcao-criativa-visual) — Rule of thirds, wide-spaced uppercase, minimal luxury
- [Editorial Philosophy](mem://brand/filosofia-editorial) — Brand positioning, target audience, sophisticated tone
- [Admin Naming](mem://brand/nomenclatura-admin) — Official names for admin modules
- [Logo Watermark](mem://brand/logo-watermark) — Watermark opacity levels and card behavior
- [Image Standards](mem://content/image-standards) — 4-photo requirement per product
- [Catalog Structure](mem://data/catalog-structure) — The 5 main categories and 'is_featured' flag priority
- [Hero Carousel](mem://features/hero-carousel) — Editorial slide transitions, Ken Burns effect
- [Product Cards](mem://features/product-cards-premium) — Hover interactions, gold borders, pill buttons
- [Lookbook Editorial](mem://features/lookbook-editorial) — /vitrine layout and WhatsApp integration
- [Share Vitrine](mem://features/share-vitrine) — OG metadata and edge function sharing details
- [Admin Navigation](mem://features/admin-navigation-system) — 3 hubs + Brain FAB
- [AI Routing](mem://features/admin-ai-automation-routing) — Context Router and 4 AI profiles
- [Customer War Room](mem://features/admin-customer-war-room) — Customer segmentation rules
- [Finance Command Center](mem://features/admin-finance-command-center) — Financial pillars and crediário tracking
- [Categories Management](mem://features/admin-categories-management) — Prevention of non-empty category deletion
- [AI Post Generator](mem://features/admin-marketing-ai-post-generator) — Post generation logic and styles
- [WhatsApp Management](mem://features/admin-whatsapp-instance-management) — Evolution API handling
- [Brain Sollaris Assistant](mem://features/brain-sollaris-assistant) — Tool calling implementation details
- [Brain Sollaris WA](mem://features/brain-sollaris-whatsapp-integration) — Evolution API remote setup
- [Voice Interaction](mem://features/brain-sollaris-voice-interaction) — Audio response rules and fallbacks
- [AI Infrastructure](mem://tech/ai-infrastructure) — OpenAI and ElevenLabs model utilization
- [Marketing Assets](mem://features/admin-marketing-brand-assets) — Visual truth injection rules
- [Sales Management](mem://features/admin-sales-management) — Online vs Presencial flow differences
- [AI Image Logic](mem://features/admin-marketing-ai-image-logic) — Visual Context Injection details
- [Mobile Tech Standards](mem://constraints/mobile-technical-standards) — Viewport and scroll setup
- [Scroll Behavior](mem://constraints/scroll-behavior-standards) — overflow-x rules
- [Admin Dark Mode](mem://style/admin-dark-mode) — Toggle claro/escuro na topbar, tokens .dark obsidiana
- [Sales-Finance-Stock Integration](mem://features/sales-finance-stock-integration) — Triggers DB: venda→estoque→financeiro→crediário
