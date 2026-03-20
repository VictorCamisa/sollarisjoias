import { Zap, Bell, RefreshCw, MessageSquare, ShoppingCart, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const automacoes = [
  {
    icon: ShoppingCart,
    title: "Carrinho Abandonado",
    description: "Envie e-mails automáticos para clientes que abandonaram o carrinho de compras.",
    status: "Em breve",
  },
  {
    icon: Bell,
    title: "Notificações de Pedido",
    description: "Notifique clientes automaticamente sobre atualizações no status do pedido.",
    status: "Em breve",
  },
  {
    icon: MessageSquare,
    title: "Respostas Automáticas",
    description: "Configure respostas automáticas para perguntas frequentes via WhatsApp ou e-mail.",
    status: "Em breve",
  },
  {
    icon: RefreshCw,
    title: "Sincronização de Estoque",
    description: "Atualize automaticamente o estoque a partir de integrações com fornecedores.",
    status: "Em breve",
  },
  {
    icon: Clock,
    title: "Tarefas Agendadas",
    description: "Agende relatórios, backups e outras tarefas para serem executadas automaticamente.",
    status: "Em breve",
  },
];

const AdminAutomacoes = () => {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Automações</h1>
          <p className="text-xs text-muted-foreground">Configure fluxos automáticos para otimizar a operação</p>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {automacoes.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="h-full hover:border-accent/30 transition-colors cursor-default">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{item.status}</Badge>
                </div>
                <CardTitle className="text-sm font-semibold mt-3">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminAutomacoes;
