import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpen, Plus, Search, Trash2, Eye, FileText, Tag,
  GraduationCap, ShieldCheck, Ruler, HelpCircle, Star, Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  catalogo:  { label: "Catálogo",    icon: Star,          color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  cuidados:  { label: "Cuidados",    icon: ShieldCheck,   color: "bg-green-500/10 text-green-400 border-green-500/20" },
  medidas:   { label: "Medidas",     icon: Ruler,         color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  faq:       { label: "FAQ",         icon: HelpCircle,    color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  politicas: { label: "Políticas",   icon: FileText,      color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  planilhas: { label: "Planilhas",   icon: Table2,        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  outros:    { label: "Outros",      icon: BookOpen,      color: "bg-secondary text-muted-foreground border-border" },
};

const TEMPLATES = [
  {
    title: "Catálogo de Produtos & Materiais",
    category: "catalogo",
    content: `**Catálogo Sollaris — Materiais e Linhas**

**OURO 18K**
O ouro 18k (750) significa que 75% da liga é ouro puro. É o padrão nobre da Sollaris. Disponível em:
- Ouro amarelo (clássico e atemporal)
- Ouro branco (moderno, rhodiado para maior brilho e resistência)
- Ouro rosé (romântico e contemporâneo)
Característica: não causa alergia, não escurece, mantém o brilho com cuidados básicos.

**PRATA 925**
A prata 925 contém 92,5% de prata pura. Mais acessível, igualmente elegante.
Característica: pode oxidar com o tempo (natural), recupera o brilho com flanela específica.

**PEDRAS NATURAIS**
Trabalhamos com: zircônia (brilho de diamante a custo acessível), quartzo rosa, topázio azul, esmeralda, rubi, turmalina rosa, ametista e citrino. Todas com laudo de autenticidade disponível mediante solicitação.

**LINHAS DISPONÍVEIS**
- Anéis: solitários, aparadores, cocktail, alianças, band rings
- Colares: ponto de luz, gargantilha, colar longo, pingentes, escapulários
- Brincos: argola, pressão, ear cuff, tiras, solitários com pedra
- Pulseiras: tennis, riviera, berloque, bracelete
- Alianças: lisos, cravejados, meia-cravação, com gravação personalizada
- Joias sob medida: projeto exclusivo do zero

**FAIXA DE PREÇOS (orientativa)**
- Anéis simples: R$ 350 – R$ 1.200
- Alianças (par): R$ 890 – R$ 3.500
- Colares com pedras: R$ 480 – R$ 2.200
- Brincos: R$ 280 – R$ 1.800
- Joias personalizadas: a partir de R$ 1.200 (consulta necessária)`,
  },
  {
    title: "Guia de Cuidados com Joias",
    category: "cuidados",
    content: `**Cuidados com suas joias Sollaris**

**OURO 18K:**
- Evite contato direto com perfumes, cremes, cloro e produtos químicos (aplique antes de colocar a joia)
- Retire ao praticar esportes, tomar banho e dormir
- Guarde em local seco, em caixinhas individuais ou saquinhos de flanela
- Limpe com pano macio seco — para brilho intenso, use pano de microfibra levemente umedecido
- Leve para polimento profissional uma vez por ano na Sollaris (gratuito no primeiro ano)

**PRATA 925:**
- Guarde em saquinhos antiestáticos (evita oxidação) ou caixinhas fechadas
- Limpe com flanela própria para prata — movimentos suaves em uma direção
- Retire ao tomar banho, nadar e praticar esportes
- Se escurecer: pasta específica para prata ou imersão de 5 minutos em água morna com bicarbonato
- Rhodiagem recomendada a cada 12-18 meses para manter brilho

**PEDRAS NATURAIS:**
- Evite impactos, pressão excessiva e quedas
- Limpe com escova macia de cerdas macias e água morna (nunca ultrassônico para pedras porosas)
- Evite exposição prolongada ao sol (pode desbotaralgunas pedras como ametista)
- Leve para verificação de cravação anual na Sollaris

**ALIANÇAS:**
- Retire para atividades com impacto (academia, trabalho manual)
- Rhodiagem no ouro branco: a cada 12-18 meses para manter o aspecto prateado
- Gravação interna: limpe com cotonete umedecido

**DICA GERAL:**
Guarde cada peça separadamente para evitar arranhões. Uma joia bem cuidada dura gerações.`,
  },
  {
    title: "Tabela de Numeração de Anéis",
    category: "medidas",
    content: `**Numeração de Anéis — Tabela Brasileira**

Número 10 = 14,0 mm de diâmetro interno
Número 11 = 14,5 mm
Número 12 = 15,0 mm
Número 13 = 15,5 mm
Número 14 = 16,0 mm
Número 15 = 16,5 mm
Número 16 = 17,0 mm
Número 17 = 17,5 mm
Número 18 = 18,0 mm
Número 19 = 18,5 mm
Número 20 = 19,0 mm
Número 21 = 19,5 mm
Número 22 = 20,0 mm
Número 23 = 20,5 mm
Número 24 = 21,0 mm
Número 25 = 21,5 mm

**Como medir em casa (método papel):**
1. Corte uma tira de papel fino com cerca de 0,5 cm de largura
2. Enrole confortavelmente no dedo (não muito justo, não muito folgado)
3. Marque onde o papel se sobrepõe
4. Estique o papel e meça o comprimento em mm
5. Divida por 3,14 para obter o diâmetro interno
6. Compare com a tabela acima

**Como medir com um anel existente:**
Meça o diâmetro interno do anel em mm e compare com a tabela.

**Dicas importantes:**
- Meça no final do dia (dedos incham ao longo do dia)
- Em climas frios, os dedos ficam um pouco menores
- Para alianças: recomendamos visita presencial para garantir o ajuste perfeito
- Realizamos ajuste gratuito na primeira vez para alianças compradas na Sollaris`,
  },
  {
    title: "Processo de Personalização",
    category: "catalogo",
    content: `**Joias Personalizadas Sollaris — Como Funciona**

**O QUE É POSSÍVEL PERSONALIZAR**
- Design exclusivo do zero (anel, colar, aliança, brinco, pulseira)
- Gravação interna ou externa (nomes, data, frase, coordenada GPS)
- Pedra escolhida pelo cliente (tipo, cor, tamanho, lapidação)
- Combinação de metais (bicolor: ouro amarelo + branco, por exemplo)
- Adaptação de modelo existente (adicionar pedra, mudar acabamento, ajustar design)

**PROCESSO PASSO A PASSO**
1. Consultoria inicial — presencial ou online — totalmente gratuita
2. Briefing completo: estilo desejado, ocasião, orçamento, referências (fotos ajudam!)
3. Proposta de design com arte digital enviada em até 3 dias úteis
4. Aprovação do cliente (inclui até 2 revisões sem custo adicional)
5. Produção: 15 a 30 dias úteis dependendo da complexidade
6. Controle de qualidade + fotos do produto finalizado enviadas para aprovação
7. Entrega com embalagem premium Sollaris

**INVESTIMENTO**
- Gravação em modelo existente: + R$ 80 a R$ 150
- Personalização simples (pedra diferente, ajuste de modelo): R$ 1.200 – R$ 2.000
- Design intermediário (modelo adaptado com pedra especial): R$ 2.000 – R$ 4.500
- Design exclusivo do zero: a partir de R$ 3.500

**GARANTIAS**
- 1 ano de garantia contra defeito de fabricação
- Polimento e revisão gratuitos em 6 meses
- Laudo de autenticidade das pedras incluído

**IMPORTANTE**
- Joias personalizadas não são elegíveis para devolução (apenas reparo em caso de defeito)
- Sinal de 50% confirmado o design; restante na retirada ou envio
- Cliente acompanha o processo com fotos da produção`,
  },
  {
    title: "Políticas de Troca, Devolução e Garantia",
    category: "politicas",
    content: `**Políticas Sollaris — Troca, Devolução e Garantia**

**DEVOLUÇÃO**
- Prazo: 7 dias corridos após o recebimento
- Condição: produto sem uso, na embalagem original, com nota fiscal
- Como solicitar: WhatsApp ou e-mail com fotos do produto
- Processo: equipe avalia em até 24h → autoriza devolução → cliente envia → reembolso em 5 dias úteis
- Reembolso: via Pix ou estorno no cartão (conforme forma de pagamento original)

**TROCA**
- Mesmo prazo de 7 dias e condições
- Troca por outro modelo: diferença de valor cobrada ou devolvida conforme o caso
- Troca de tamanho de anel/aliança: gratuita na primeira vez, dentro de 30 dias da compra

**GARANTIA DE QUALIDADE — 12 MESES**
Cobre:
✓ Defeito de solda ou acabamento
✓ Queda de pedra por falha de cravação (não por impacto)
✓ Deformação por defeito de fabricação

NÃO cobre:
✗ Arranhados por uso normal
✗ Oxidação por mau uso ou armazenamento inadequado
✗ Quebra ou amassado por impacto
✗ Perda de pedras por impacto ou descuido

Dentro da garantia: reparo sem custo ou substituição da peça
Fora da garantia: orçamento de reparo enviado em até 48h

**AJUSTE DE TAMANHO**
- Anéis: R$ 0 a R$ 80 dependendo do modelo e quantidade de pontos de ajuste
- Alianças: gratuito na primeira vez; subsequentes mediante orçamento
- Prazo: 3-5 dias úteis
- Nem todos os modelos permitem ajuste — verificamos caso a caso

**JOIAS PERSONALIZADAS**
- Não são elegíveis para devolução
- Defeito de fabricação coberto pela garantia de 1 ano

**CONTATO**
- WhatsApp: seg a sáb, 9h-18h
- E-mail: contato@sollaris.com.br`,
  },
  {
    title: "Perguntas Frequentes — FAQ Completo",
    category: "faq",
    content: `**Perguntas Frequentes — Sollaris Joias**

**PRODUTOS**

Vocês fazem joias personalizadas?
Sim! Trabalhamos com projetos do zero ou adaptações de modelos existentes. O processo começa com consultoria gratuita. Prazo: 15-30 dias úteis.

O ouro é garantido?
Todas as peças em ouro têm 18 quilates (750/1000), com carimbo de garantia. Fornecemos certificado mediante solicitação.

As joias são hipoalergênicas?
Ouro 18k e prata 925 são seguros para pele sensível. Para casos extremos de alergia metálica, consulte nossa equipe sobre opções em titânio.

Vocês trabalham com diamantes?
Trabalhamos com zircônia de alta qualidade (equivalente visual ao diamante) e pedras semipreciosas naturais. Para projetos com diamantes certificados, consulte nosso ateliê.

**PEDIDOS & ENTREGA**

Qual o prazo de entrega?
- Peças em estoque: 1-3 dias úteis
- Gravação personalizada: +2 dias úteis
- Joias sob medida: 15-30 dias úteis

Entregam para todo o Brasil?
Sim, via Correios (PAC e SEDEX) e transportadoras parceiras. Frete calculado no checkout ou via atendimento.

Como rastrear meu pedido?
Você receberá o código de rastreio por WhatsApp assim que o pedido for despachado.

**MEDIDAS & AJUSTES**

Como descobrir meu número de anel?
Enrole um papel fino confortavelmente no dedo, marque onde se fecha, meça o comprimento em mm e divida por 3,14. Compare com nossa tabela de numeração.

Posso presentear sem saber o tamanho?
Sim! Recomendamos consultoria prévia. Caso não seja possível, realizamos ajuste gratuito na primeira vez dentro de 30 dias.

**PAGAMENTO**

Quais formas de pagamento aceitam?
- Cartão de crédito (parcelamento disponível — juros a partir de 3x conforme operadora)
- Débito
- Pix (à vista — consulte condições especiais)
- Transferência bancária

**OUTROS**

Fazem embalagem para presente?
Sim, todas as peças saem em embalagem premium Sollaris sem custo adicional. Cartão com mensagem personalizada disponível.

Fazem conserto de joias de outras marcas?
Avaliamos caso a caso. Envie fotos pelo WhatsApp para orçamento.

Têm programa de fidelidade?
Sim! Clientes Sollaris acumulam benefícios: manutenção gratuita, acesso a lançamentos exclusivos e desconto por indicação. Consulte nossa equipe.`,
  },
  {
    title: "📊 Sheets — Fórmulas Essenciais",
    category: "planilhas",
    content: `**Fórmulas essenciais do Google Sheets**\n\n**SOMA / MÉDIA / CONTAGEM**\n- \`=SUM(A2:A100)\` — soma intervalo\n- \`=AVERAGE(A2:A100)\` — média\n- \`=COUNT(A2:A100)\` — conta números\n- \`=COUNTA(A2:A100)\` — conta tudo (texto + números)\n\n**IF — condicional**\n- \`=IF(A2>100; "Alto"; "Baixo")\`\n- Aninhado: \`=IF(A2>100; "Alto"; IF(A2>50; "Médio"; "Baixo"))\`\n\n**IFS — múltiplas condições (mais limpo que IF aninhado)**\n- \`=IFS(A2>100; "Alto"; A2>50; "Médio"; TRUE; "Baixo")\`\n\n**SUMIF / SUMIFS — soma condicional**\n- \`=SUMIF(B2:B100; "Pago"; C2:C100)\` — soma C onde B = "Pago"\n- \`=SUMIFS(C2:C100; B2:B100; "Pago"; A2:A100; ">"&DATE(2025;1;1))\`\n\n**COUNTIF / COUNTIFS**\n- \`=COUNTIF(A2:A100; "Sim")\` — conta quantas vezes "Sim" aparece\n- \`=COUNTIFS(A2:A; "Pago"; B2:B; ">100")\`\n\n**Erros comuns:**\n- Usar \`,\` em vez de \`;\` (no Brasil é ponto-e-vírgula)\n- Esquecer aspas em texto: \`"Pago"\` ✅, \`Pago\` ❌\n- Misturar tipos (texto e número) na mesma coluna`,
  },
  {
    title: "📊 Sheets — Lookups (PROCV, INDEX/MATCH, XLOOKUP)",
    category: "planilhas",
    content: `**Buscar valor em outra tabela**\n\n**VLOOKUP / PROCV** — clássico, busca da esquerda pra direita\n\`\`\`\n=VLOOKUP(A2; Produtos!A:D; 4; FALSE)\n\`\`\`\n- A2: o que buscar\n- Produtos!A:D: onde buscar (a chave PRECISA estar na 1ª coluna)\n- 4: qual coluna retornar\n- FALSE: correspondência exata (use sempre FALSE)\n\n**INDEX + MATCH** — mais flexível, busca em qualquer direção\n\`\`\`\n=INDEX(Produtos!D:D; MATCH(A2; Produtos!A:A; 0))\n\`\`\`\n- Funciona mesmo se a chave não estiver na 1ª coluna\n- Mais rápido em planilhas grandes\n\n**XLOOKUP** — o moderno (Google Sheets já suporta)\n\`\`\`\n=XLOOKUP(A2; Produtos!A:A; Produtos!D:D; "Não encontrado")\n\`\`\`\n- Sintaxe limpa\n- Retorno padrão se não achar (4º parâmetro)\n- Busca em qualquer direção\n\n**Erros comuns:**\n- #N/A → valor não existe na tabela. Envolva com IFERROR: \`=IFERROR(VLOOKUP(...); "")\`\n- Coluna errada no índice (VLOOKUP)\n- Esquecer FALSE → retorna match aproximado e quebra tudo`,
  },
  {
    title: "📊 Sheets — QUERY (o superpoder)",
    category: "planilhas",
    content: `**QUERY — SQL dentro do Google Sheets**\n\nUma das funções mais poderosas. Use sintaxe parecida com SQL.\n\n**Exemplos:**\n\n**Filtrar:**\n\`\`\`\n=QUERY(A1:E1000; "SELECT * WHERE B = 'Pago' AND C > 100")\n\`\`\`\n\n**Agrupar e somar:**\n\`\`\`\n=QUERY(A1:E1000; "SELECT B, SUM(D) WHERE C IS NOT NULL GROUP BY B LABEL SUM(D) 'Total'")\n\`\`\`\n\n**Ordenar e limitar:**\n\`\`\`\n=QUERY(A1:E1000; "SELECT A, D ORDER BY D DESC LIMIT 10")\n\`\`\`\n\n**Com referência dinâmica:**\n\`\`\`\n=QUERY(A1:E1000; "SELECT * WHERE B = '"&F1&"'")\n\`\`\`\n(F1 contém o filtro digitado pela usuária)\n\n**Funções suportadas:**\n- SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, OFFSET\n- SUM, AVG, MIN, MAX, COUNT\n- LABEL (rename), FORMAT (formatação)\n\n**Erros comuns:**\n- Aspas: use \`'\` (simples) dentro da query, \`"\` (duplas) só pra delimitar\n- Colunas se referenciam por LETRA (A, B, C...) e não pelo nome\n- Cabeçalho vai virar parte dos dados se você incluir a linha 1`,
  },
  {
    title: "📊 Sheets — ARRAYFORMULA + FILTER + SORT + UNIQUE",
    category: "planilhas",
    content: `**Trabalhar com colunas inteiras de uma vez**\n\n**ARRAYFORMULA** — aplica fórmula em toda a coluna\n\`\`\`\n=ARRAYFORMULA(IF(A2:A="";"";A2:A * B2:B))\n\`\`\`\nUma fórmula só, em vez de arrastar para 1000 linhas.\n\n**FILTER** — filtra linhas por condição\n\`\`\`\n=FILTER(A2:D1000; B2:B1000="Pago"; C2:C1000>100)\n\`\`\`\nRetorna todas as linhas onde B="Pago" E C>100.\n\n**SORT** — ordena\n\`\`\`\n=SORT(A2:C1000; 3; FALSE)\n\`\`\`\nOrdena pela coluna 3, decrescente.\n\n**UNIQUE** — valores únicos\n\`\`\`\n=UNIQUE(A2:A1000)\n\`\`\`\n\n**Combinações poderosas:**\n\`\`\`\n=SORT(UNIQUE(FILTER(A2:A; B2:B="Ativo")); 1; TRUE)\n\`\`\`\nLista única e ordenada de A onde B="Ativo".\n\n**Erros comuns:**\n- ARRAYFORMULA não funciona com toda função (ex: SUMIF precisa adaptação)\n- FILTER retorna #N/A quando nada bate → envolva com IFERROR\n- Modificar uma célula no meio do range quebra a fórmula`,
  },
  {
    title: "📊 Sheets — Datas e Texto",
    category: "planilhas",
    content: `**Manipulação de datas e texto**\n\n**Datas:**\n- \`=TODAY()\` — data de hoje\n- \`=NOW()\` — data + hora\n- \`=DATE(2025;3;15)\` — montar data\n- \`=YEAR(A2)\`, \`=MONTH(A2)\`, \`=DAY(A2)\`\n- \`=DATEDIF(A2;B2;"D")\` — dias entre datas (\`"M"\` meses, \`"Y"\` anos)\n- \`=EOMONTH(A2;0)\` — último dia do mês\n- \`=TEXT(A2;"DD/MM/YYYY")\` — formatar como texto\n- \`=TEXT(A2;"MMMM")\` — nome do mês ("março")\n\n**Texto:**\n- \`=CONCATENATE(A2;" - ";B2)\` ou \`=A2&" - "&B2\`\n- \`=UPPER(A2)\`, \`=LOWER(A2)\`, \`=PROPER(A2)\`\n- \`=LEN(A2)\` — tamanho\n- \`=LEFT(A2;3)\`, \`=RIGHT(A2;4)\`, \`=MID(A2;3;5)\`\n- \`=TRIM(A2)\` — remove espaços extras\n- \`=SUBSTITUTE(A2;"-";"")\` — substituir\n- \`=SPLIT(A2;",")\` — divide em colunas\n- \`=JOIN(", ";A2:A10)\` — junta\n\n**REGEX (poderoso):**\n- \`=REGEXEXTRACT(A2;"\\d+")\` — extrai números\n- \`=REGEXMATCH(A2;"@gmail")\` — verifica padrão\n- \`=REGEXREPLACE(A2;"\\s+";" ")\` — limpa espaços\n\n**Erros comuns:**\n- Data armazenada como texto não calcula → use DATEVALUE\n- Acentos em SUBSTITUTE: cuidado com encoding\n- TRIM não remove caracteres invisíveis (use CLEAN também)`,
  },
  {
    title: "📊 Sheets — Importação e Conexões",
    category: "planilhas",
    content: `**Importar dados de fora**\n\n**IMPORTRANGE** — puxa dados de OUTRA planilha\n\`\`\`\n=IMPORTRANGE("URL_DA_PLANILHA"; "Aba1!A1:D100")\n\`\`\`\n- Primeira vez precisa autorizar (aparece botão "Permitir acesso")\n- Combine com QUERY: \`=QUERY(IMPORTRANGE(...); "SELECT Col1 WHERE Col2='X'")\`\n\n**IMPORTHTML** — tabelas de sites\n\`\`\`\n=IMPORTHTML("https://site.com/pagina"; "table"; 1)\n\`\`\`\n\n**IMPORTXML** — qualquer dado de página web (XPath)\n\`\`\`\n=IMPORTXML("https://site.com"; "//h1")\n\`\`\`\n\n**IMPORTDATA** — CSV/TSV de URL pública\n\`\`\`\n=IMPORTDATA("https://site.com/dados.csv")\n\`\`\`\n\n**GOOGLEFINANCE** — cotações em tempo real\n\`\`\`\n=GOOGLEFINANCE("USDBRL")\n=GOOGLEFINANCE("PETR4"; "price")\n=GOOGLEFINANCE("USDBRL"; "close"; TODAY()-30; TODAY())\n\`\`\`\n\n**Erros comuns:**\n- IMPORTRANGE precisa autorização entre as planilhas\n- IMPORT* não atualiza em tempo real (cache de ~1h)\n- Sites com JavaScript não funcionam em IMPORTHTML/XML\n- Limite: máx ~50 IMPORT* por planilha sem ficar lenta`,
  },
  {
    title: "📊 Sheets — Dicas Avançadas",
    category: "planilhas",
    content: `**Recursos pro do Google Sheets**\n\n**1. Validação de Dados (dropdown)**\nDados → Validação de dados → Lista de itens\n→ Cria menu suspenso na célula. Use para padronizar entradas (status, categorias).\n\n**2. Formatação Condicional**\nFormatar → Formatação condicional\n- Pintar células > X de vermelho\n- Destacar duplicados: \`=COUNTIF(A:A;A1)>1\`\n- Linha inteira baseada em condição: \`=$B1="Pago"\` (cifrão na coluna trava)\n\n**3. Tabelas Dinâmicas (Pivot)**\nInserir → Tabela dinâmica\n- Resumo automático sem fórmula\n- Arraste campos: Linhas, Colunas, Valores, Filtros\n- Atualiza sozinha quando dados mudam\n\n**4. Intervalos Nomeados**\nDados → Intervalos nomeados\n- Em vez de \`A2:A100\`, use \`Vendas\`\n- Fórmulas ficam legíveis: \`=SUM(Vendas)\`\n\n**5. Apps Script (automação)**\nExtensões → Apps Script. JavaScript que automatiza:\n\`\`\`javascript\nfunction enviarRelatorio() {\n  const sheet = SpreadsheetApp.getActiveSheet();\n  const total = sheet.getRange("B100").getValue();\n  MailApp.sendEmail("ana@sollaris.com", "Relatório", "Total: " + total);\n}\n\`\`\`\nDá pra agendar (Acionadores → +).\n\n**6. Atalhos essenciais (Mac/Windows)**\n- \`Cmd/Ctrl + ;\` — data de hoje\n- \`Cmd/Ctrl + Shift + V\` — colar só valores\n- \`Cmd/Ctrl + Alt + V\` — colar especial\n- \`Cmd/Ctrl + K\` — inserir link\n- \`Alt + Enter\` — quebra de linha dentro da célula\n- \`Cmd/Ctrl + Shift + 5\` — formato porcentagem\n\n**7. Performance**\n- Evite IMPORTRANGE em cascata\n- Substitua arrays gigantes por ARRAYFORMULA\n- Limpe linhas vazias do final (deixa o arquivo leve)`,
  },
];

const emptyForm = { title: "", content: "", category: "outros", tags: "" };

const AutomacoesConhecimento = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["sales-knowledge"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("sales_knowledge_docs").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await (supabase.from as any)("sales_knowledge_docs").insert({
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        processed: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-knowledge"] });
      toast.success("Documento adicionado à base de conhecimento");
      setDialogOpen(false);
      setForm({ ...emptyForm });
    },
    onError: () => toast.error("Erro ao salvar documento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from as any)("sales_knowledge_docs").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-knowledge"] });
      toast.success("Documento removido");
    },
  });

  const addTemplate = (tpl: typeof TEMPLATES[0]) => {
    setForm({ title: tpl.title, content: tpl.content, category: tpl.category, tags: "" });
    setDialogOpen(true);
  };

  const filtered = docs.filter((d: any) => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.content?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || d.category === filterCat;
    return matchSearch && matchCat;
  });

  const countByCat = (cat: string) => docs.filter((d: any) => d.category === cat).length;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Base de Conhecimento</h2>
            <p className="text-[11px] text-muted-foreground">{docs.length} documentos · Alimenta a IA Vendedora</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { setForm({ ...emptyForm }); setDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo Documento
        </Button>
      </div>

      {/* Templates rápidos */}
      {docs.length === 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Começar com um template:</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl) => {
              const cfg = CATEGORY_CONFIG[tpl.category];
              return (
                <button
                  key={tpl.title}
                  onClick={() => addTemplate(tpl)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${cfg.color} hover:opacity-80 transition-opacity`}
                >
                  <cfg.icon className="h-3 w-3" /> {tpl.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${filterCat === "all" ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground"}`}
        >
          Todos ({docs.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterCat(filterCat === key ? "all" : key)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${filterCat === key ? cfg.color : "border-border text-muted-foreground"}`}
          >
            <cfg.icon className="h-3 w-3" /> {cfg.label} ({countByCat(key)})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar na base de conhecimento..." className="pl-8 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Documents grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-secondary/40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum documento encontrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Adicione documentos para treinar a IA com o conhecimento da Sollaris</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((doc: any, i: number) => {
            const cfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.outros;
            const CatIcon = cfg.icon;
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="hover:border-accent/30 transition-colors group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${cfg.color}`}>
                        <CatIcon className="h-2.5 w-2.5" /> {cfg.label}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewDoc(doc)} className="text-muted-foreground hover:text-foreground">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { if (confirm("Remover?")) deleteMutation.mutate(doc.id); }} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <CardTitle className="text-sm font-semibold leading-snug mt-1">{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">{doc.content?.replace(/\*\*/g, "").replace(/\n/g, " ")}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[10px] bg-secondary px-1.5 py-0 rounded">{tag}</span>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(doc.created_at), "dd/MM/yy")}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setForm({ ...emptyForm }); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Título *</Label>
                <Input className="mt-1 h-8 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Guia de Cuidados com Joias" />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tags (separadas por vírgula)</Label>
                <Input className="mt-1 h-8 text-sm" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ouro, prata, anel..." />
              </div>
            </div>
            <div>
              <Label className="text-xs">Conteúdo *</Label>
              <Textarea
                className="mt-1 text-sm resize-none font-mono"
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Escreva o conteúdo do documento. Use **negrito**, listas com - e títulos com #..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">{form.content.length} caracteres · Suporta Markdown</p>
            </div>
            {/* Quick templates */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Usar template:</p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((tpl) => (
                  <button key={tpl.title} onClick={() => setForm({ title: tpl.title, content: tpl.content, category: tpl.category, tags: "" })}
                    className="text-[10px] px-2 py-0.5 border border-border rounded hover:border-accent/40 transition-colors text-muted-foreground">
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || !form.content.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Adicionar à Base"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      {viewDoc && (
        <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewDoc.title}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={`text-[10px] ${CATEGORY_CONFIG[viewDoc.category]?.color}`}>
                  {CATEGORY_CONFIG[viewDoc.category]?.label}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{format(new Date(viewDoc.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">{viewDoc.content}</pre>
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" size="sm" onClick={() => { deleteMutation.mutate(viewDoc.id); setViewDoc(null); }}>Remover</Button>
              <Button variant="outline" size="sm" onClick={() => setViewDoc(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AutomacoesConhecimento;
