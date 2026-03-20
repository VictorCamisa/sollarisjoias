import { Megaphone, TrendingUp, Mail, Instagram, MousePointerClick, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const cards = [
  {
    icon: Mail,
    title: "Campanhas de E-mail",
    description: "Crie e gerencie campanhas de e-mail marketing para sua base de clientes.",
    status: "Em breve",
  },
  {
    icon: Instagram,
    title: "Redes Sociais",
    description: "Integre e programe publicações nas redes sociais da loja.",
    status: "Em breve",
  },
  {
    icon: MousePointerClick,
    title: "Anúncios Pagos",
    description: "Gerencie campanhas no Google Ads e Meta Ads diretamente pelo painel.",
    status: "Em breve",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Acompanhe o desempenho de cada ação de marketing com métricas detalhadas.",
    status: "Em breve",
  },
  {
    icon: TrendingUp,
    title: "SEO",
    description: "Otimize os títulos, descrições e URLs dos produtos para mecanismos de busca.",
    status: "Em breve",
  },
];

const AdminMarketing = () => {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Marketing</h1>
          <p className="text-xs text-muted-foreground">Gerencie campanhas e ações de marketing da loja</p>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="h-full hover:border-accent/30 transition-colors cursor-default">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{card.status}</Badge>
                </div>
                <CardTitle className="text-sm font-semibold mt-3">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminMarketing;
