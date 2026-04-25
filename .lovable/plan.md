

## Plano: Conectar Google Sheets ao Brain (OAuth + leitura/escrita)

### Visão geral
Você clica **"Conectar Google"** no admin → autoriza UMA vez → o Brain ganha acesso pra **ler e escrever** em qualquer planilha sua. Depois é só conversar: *"no meu controle de vendas, soma a coluna F do mês de março"* ou *"adiciona uma linha com a venda de hoje na planilha de caixa"*.

---

### Pré-requisitos (você precisa fazer 1 vez, ~5 min)

Vou te passar o passo a passo detalhado depois, mas o resumo é:

1. **Google Cloud Console** → criar projeto (ou usar existente)
2. **Habilitar a Google Sheets API** + **Google Drive API** (pra listar planilhas)
3. **Criar credenciais OAuth Client ID** (tipo: Web Application)
4. Adicionar como **Authorized redirect URI**: a URL da edge function `google-oauth-callback` (te passo depois de criar)
5. Copiar **Client ID** e **Client Secret** → você cola no Lovable como secrets

Custo: **R$ 0** — Google Sheets API tem cota grátis altíssima (300 requests/min).

---

### Arquitetura

**1. Tabela nova: `google_integrations`**
Armazena tokens OAuth da Ana (e futuros usuários).
- `user_id` (auth.users)
- `access_token`, `refresh_token`, `expires_at`
- `scopes`, `email_google`, `connected_at`
- RLS: cada usuário vê só os próprios tokens

**2. Edge function: `google-oauth-callback`**
Recebe o `code` do Google, troca por tokens, salva no DB.

**3. Edge function: `google-sheets-proxy`**
Proxy autenticado que o Brain chama. Renova access_token automaticamente quando expira (usa refresh_token). Endpoints:
- `list_sheets` — lista planilhas da Ana
- `read_range` — lê valores de um intervalo (ex: `Vendas!A1:F100`)
- `write_range` — escreve/sobrescreve valores
- `append_row` — adiciona linha no fim
- `update_cell` — edita célula específica
- `create_sheet` — cria planilha nova (bonus)

**4. Tools novas no Brain (`brain-nalu`)**
- `list_my_sheets` — "quais planilhas eu tenho?"
- `read_sheet` — lê dados de uma planilha (parâmetros: nome ou URL, intervalo)
- `write_sheet` — escreve (com confirmação obrigatória antes)
- `append_to_sheet` — adiciona linha
- `analyze_sheet` — lê + envia pro modelo pra análise

System prompt atualizado: *"Antes de ESCREVER em qualquer planilha, sempre mostre o que vai fazer e peça confirmação 'sim' explícita."*

**5. UI: novo card em Configurações ou no Brain**
- Botão **"Conectar Google Sheets"** (estado: desconectado / conectado como `email@gmail.com`)
- Lista das planilhas detectadas
- Botão **"Desconectar"**

**6. Secrets necessários** (você adiciona depois de criar no Google Cloud):
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

---

### Fluxo de uso (depois de conectado)

**Você no WhatsApp:** *"Brain, vê na planilha 'Caixa Mar/25' quanto entrou de PIX essa semana"*

**Brain:**
1. Chama `list_my_sheets` → acha "Caixa Mar/25"
2. Chama `read_sheet` no intervalo provável
3. Calcula e responde: *"Ana, essa semana entraram **R$ 4.230** via PIX (12 transações). Quer que eu detalhe?"*

**Você:** *"Adiciona aí a venda do colar Sol pra Maria, R$ 480, dinheiro, hoje"*

**Brain:** *"Vou adicionar na aba 'Vendas' da planilha 'Caixa Mar/25':*
*Data: 18/04/2026 | Cliente: Maria | Produto: Colar Sol | Valor: R$ 480 | Pagamento: Dinheiro*
*Confirma? (sim/não)"*

**Você:** *"sim"* → Brain executa e confirma com print da linha.

---

### Segurança
- Tokens criptografados no DB (RLS por user_id)
- Nenhum secret exposto no frontend
- Brain SEMPRE pede confirmação antes de escrever
- Refresh automático de tokens expirados
- Você pode revogar acesso a qualquer momento (botão "Desconectar" + revoga no Google)

---

### Limitações honestas
- Brain precisa do **nome da planilha ou URL** — não advinha qual planilha. Se você tiver muitas, podemos cadastrar "favoritas" depois.
- Pra planilhas MUITO grandes (>10k linhas), ler tudo é lento — usaremos ranges específicos.
- Brain não vê **gráficos** ou **formatação visual** — só dados e fórmulas.

---

### Ordem de implementação
1. Migração SQL (tabela `google_integrations`)
2. Edge functions (callback + proxy)
3. Tools no `brain-nalu` + system prompt atualizado
4. UI de conexão
5. Eu te passo o passo a passo do Google Cloud Console
6. Você adiciona os 2 secrets
7. Testa fim-a-fim

---

**Posso começar?** Se sim, eu já crio a migração e as edge functions agora, e enquanto eu faço isso te mando o tutorial do Google Cloud Console pra você ir adiantando.

