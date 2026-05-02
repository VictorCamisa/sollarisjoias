import { Truck, Shield, RefreshCcw, Sparkles } from "lucide-react";

const pillars = [
  { icon: Truck, title: "Frete grátis", subtitle: "Acima de R$ 499" },
  { icon: Shield, title: "Garantia vitalícia", subtitle: "Banho 18k · 5 micra" },
  { icon: RefreshCcw, title: "Troca em 30 dias", subtitle: "Sem complicação" },
  { icon: Sparkles, title: "Embalagem cortesia", subtitle: "Pronta pra presente" },
];

const PillarsBar = () => {
  return (
    <section className="bg-card border-y border-border">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center border border-bordeaux/20 text-bordeaux flex-shrink-0">
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-display text-[14px] sm:text-[15px] text-foreground leading-tight">
                    {p.title}
                  </p>
                  <p className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.18em] text-foreground/55 mt-0.5">
                    {p.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PillarsBar;
