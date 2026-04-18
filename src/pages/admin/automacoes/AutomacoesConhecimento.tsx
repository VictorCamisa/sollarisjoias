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
    title: "Guia de Cuidados com Joias",
    category: "cuidados",
    content: `**Cuidados com suas joias Sollaris**\n\n**Ouro:**\n- Evite contato com produtos químicos como perfumes, cloro e cremes\n- Guarde em local seco, de preferência em caixinhas individuais\n- Limpe com pano macio seco ou levemente umedecido\n\n**Prata:**\n- Guarde em saquinhos antiestáticos para evitar oxidação\n- Limpe com flanela própria para prata\n- Retire ao tomar banho e praticar esportes\n\n**Pedras:**\n- Evite impactos e pressão excessiva\n- Limpe com escova macia e água morna\n- Leve para verificação anual na Sollaris`,
  },
  {
    title: "Tabela de Numeração de Anéis",
    category: "medidas",
    content: `**Numeração de Anéis — Tabela Brasileira**\n\nNúmero 10 = 14,0 mm de diâmetro interno\nNúmero 11 = 14,5 mm\nNúmero 12 = 15,0 mm\nNúmero 13 = 15,5 mm\nNúmero 14 = 16,0 mm\nNúmero 15 = 16,5 mm\nNúmero 16 = 17,0 mm\nNúmero 17 = 17,5 mm\nNúmero 18 = 18,0 mm\nNúmero 19 = 18,5 mm\nNúmero 20 = 19,0 mm\nNúmero 21 = 19,5 mm\nNúmero 22 = 20,0 mm\n\n**Como medir em casa:**\nEnrole um papel fino no dedo, marque onde se fecha e meça o comprimento. Divida por π (3,14) para obter o diâmetro.`,
  },
  {
    title: "Perguntas Frequentes",
    category: "faq",
    content: `**Perguntas Frequentes — Sollaris Joias**\n\n**Vocês fazem joias personalizadas?**\nSim! Trabalhamos com pedidos personalizados. Agende uma consultoria para discutir o projeto.\n\n**Qual o prazo de entrega?**\nPeças em estoque: 1-3 dias úteis. Joias personalizadas: 15-30 dias úteis dependendo da complexidade.\n\n**Aceitam devolução?**\nSim, em até 7 dias após o recebimento, mediante produto sem uso e na embalagem original.\n\n**As joias são hipoalergênicas?**\nNossas joias em ouro 18k e prata 925 são indicadas para pele sensível. Temos também opções em titânio.\n\n**Fazem ajuste de tamanho?**\nSim, realizamos ajustes. O prazo é de 3-5 dias úteis.`,
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
