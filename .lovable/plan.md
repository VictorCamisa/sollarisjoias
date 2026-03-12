

## Diagnóstico

O site atual tem três problemas principais:

1. **Sem dinamismo real** — As animações são apenas `initial/animate` do Framer Motion (rodam uma vez no load). Não há scroll-triggered animations, parallax, nem elementos que reajam ao movimento do usuário.

2. **Cards genéricos** — Os ProductCards são boxes simples com imagem + texto. Não têm hover sofisticado, nem transições premium, nem detalhes visuais que transmitam luxo.

3. **Tipografia do Hero fraca** — O título usa Gloock mas sem tratamento visual especial. Falta presença editorial: o tamanho, espaçamento e animação não impressionam.

---

## Plano de implementação

### 1. Scroll-triggered animations em toda a HomePage

- Usar `motion` do Framer Motion com `whileInView`, `viewport={{ once: true }}` para que seções apareçam conforme o scroll
- **Hero**: parallax sutil no background (a imagem se move mais devagar que o scroll) usando `useScroll` + `useTransform` do Framer Motion
- **Categorias**: cada botão entra com stagger (delay escalonado)
- **Cards de produto**: entram um a um com stagger + slide-up
- **Brand statement**: fade-in com scale sutil ao entrar no viewport

### 2. Hero redesenhado — tipografia impactante

- Título maior no desktop: `text-[5.5rem]` com `tracking-[0.08em]`
- A palavra "intenção" em itálico (Gloock italic via CSS) ou com underline animado dourado
- Linha dourada animada que se expande ao entrar
- O subtítulo "Semijoias Premium" com animação de reveal (clipPath ou slide)
- CTA com borda dourada e hover com fill animado

### 3. ProductCard premium

- **Hover**: zoom mais pronunciado na imagem (`scale-110`) + overlay escuro sutil que aparece
- **Quick-view info**: no hover, o nome e preço sobem com slide suave sobre a imagem
- **Borda dourada sutil** no hover (`border-accent/40`)
- **Logo Sollaris**: mantém como está (watermark flutuante sem fundo)
- **Transição**: cursor pointer elegante, sombra elevada no hover

### 4. Elementos de movimento contínuo

- Gold-line separators com animação de expansão ao entrar no viewport (width: 0 → 200px)
- Parallax leve no brand statement section

---

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/HomePage.tsx` | Scroll animations, parallax hero, staggered sections |
| `src/components/store/ProductCard.tsx` | Hover premium, overlay info, borda dourada |
| `src/index.css` | Eventuais keyframes auxiliares |

Nenhuma dependência nova necessária — Framer Motion já está instalado e tem `useScroll`, `useTransform`, `whileInView` nativamente.

