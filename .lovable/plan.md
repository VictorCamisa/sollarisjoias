

## Plano: Especialista em Google Planilhas no Brain

### Objetivo
Transformar o Brain Sollaris em especialista em Google Sheets — quando o usuário pedir ajuda com planilhas, ele coleta contexto (o que precisa, qual aba, formato dos dados) e devolve resposta completa com fórmula pronta, explicação passo a passo e dicas.

### Como funciona

**1. Base de conhecimento (Conhecimento → AutomacoesConhecimento)**
Adicionar nova categoria `planilhas` ao `CATEGORY_CONFIG` e criar 6 templates prontos que o usuário insere com 1 clique:
- Fórmulas Essenciais (SUM, AVERAGE, IF, IFS, COUNTIF, SUMIF)
- Lookups (VLOOKUP, HLOOKUP, INDEX/MATCH, XLOOKUP)
- QUERY (sintaxe SQL-like do Google Sheets — superpoder)
- ARRAYFORMULA + FILTER + SORT + UNIQUE
- Datas e Texto (TEXT, DATEDIF, REGEX, SPLIT, JOIN)
- Importação e Conexões (IMPORTRANGE, IMPORTHTML, GOOGLEFINANCE)
- Dicas avançadas (validação, formatação condicional, tabelas dinâmicas, Apps Script básico)

Cada template em markdown, com sintaxe + exemplo real + erros comuns.

**2. Comportamento do Brain (`brain-nalu/index.ts` — system prompt)**
Adicionar bloco no prompt:
- Detectar pedidos de planilha (palavras: "planilha", "sheets", "fórmula", "excel", "célula", "VLOOKUP" etc.)
- **Sempre perguntar contexto antes de responder**: estrutura dos dados (colunas, abas), o que quer obter, exemplo de 2-3 linhas se possível
- Após contexto: responder em formato fixo
  1. **Fórmula pronta** (em bloco de código, adaptada às colunas reais do usuário)
  2. **Como funciona** (explicação linha a linha)
  3. **Onde colar** (célula sugerida)
  4. **Variações úteis** (1-2 alternativas)
  5. **Erros comuns** e como evitar
- Consultar a base de conhecimento (`sales_knowledge_docs` categoria `planilhas`) via tool já existente quando precisar lembrar sintaxe específica

**3. Tool de busca na base (já existe parcialmente)**
Garantir que o Brain consulte `sales_knowledge_docs` filtrando por `category = 'planilhas'` quando o assunto for planilhas — pequeno ajuste na descrição da tool existente para reforçar o uso.

### Arquivos a editar
- `src/pages/admin/automacoes/AutomacoesConhecimento.tsx` — adicionar categoria `planilhas` + 7 templates
- `supabase/functions/brain-nalu/index.ts` — atualizar system prompt com protocolo "Especialista em Planilhas"

### O que o usuário faz depois
1. Abre **Automações → Conhecimento**
2. Clica nos templates de planilhas (1 clique adiciona cada um à base)
3. Conversa com o Brain pedindo "preciso de uma fórmula que…" — ele pergunta contexto e entrega solução completa, no chat ou WhatsApp

### Resposta direta à pergunta
**Sim, é totalmente possível** e é exatamente o padrão que já está montado: a base de conhecimento alimenta o Brain, e o system prompt define o comportamento. Não precisa de API nova, nem custo extra.

