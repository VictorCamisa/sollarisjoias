

# LARIFA — E-commerce Premium + Painel Administrativo

## Visão Geral
Plataforma dupla para a marca de moda LARIFA: um storefront elegante com checkout via WhatsApp e um painel administrativo completo para gestão de produtos, categorias e configurações.

---

## Fase 1: Design System & Layout Base
- Configurar tema Tailwind com paleta Azul Bebê (`#E0F2FE`), Branco Puro e Slate-800
- Importar fontes Playfair Display (títulos) e Inter (corpo)
- Criar layout principal com Navbar transparente que fica sólida no scroll
- Footer elegante com informações da marca
- Design 100% responsivo (Mobile First)

## Fase 2: Banco de Dados & Backend (Lovable Cloud / Supabase)
- Criar tabelas: `categories`, `products`, `settings`
- Configurar RLS: leitura pública para produtos, escrita apenas para admins autenticados
- Configurar Supabase Auth para acesso ao painel admin
- Criar bucket de Storage para imagens dos produtos
- Criar tabela `user_roles` para controle de acesso admin

## Fase 3: Storefront (Experiência do Cliente)
- **Hero Section** impactante na home com imagem de destaque
- **Vitrine de Produtos** com cards elegantes, efeito hover, múltiplas fotos
- **Navegação por Categorias** com filtros dinâmicos vindos do banco
- **Página de Produto** com galeria de imagens, seleção de tamanho e cor
- **Busca Instantânea** com filtro em tempo real
- **Skeleton Screens** para carregamento suave
- **Seção de Produtos em Destaque** (is_featured)

## Fase 4: Carrinho & Checkout WhatsApp
- Carrinho lateral (Drawer) com gerenciamento de itens sem sair da página
- Contexto do Carrinho com persistência local (localStorage)
- Botão de checkout que gera mensagem formatada para WhatsApp contendo: nome do produto, tamanho, cor, quantidade, valor total e link da imagem

## Fase 5: Painel Administrativo
- Rota protegida `/admin` com login via Supabase Auth
- **Dashboard** com métricas: total de produtos, categorias ativas, cliques WhatsApp
- **CRUD de Produtos**: formulários com react-hook-form, upload de imagens para Supabase Storage
- **Gestão de Categorias**: criar, editar e excluir categorias
- **Configurações da Loja**: editar número do WhatsApp e textos padrão

## Fase 6: Refinamento Premium
- Micro-interações e animações suaves de entrada nas páginas
- Transições elegantes entre rotas
- Garantir responsividade perfeita em todos os dispositivos

