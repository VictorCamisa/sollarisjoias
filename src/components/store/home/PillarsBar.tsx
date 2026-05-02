// Faixa fina única, estilo Cartier — sem caixinhas, sem ícones grandes
const items = [
  "Frete grátis acima de R$ 499",
  "Garantia vitalícia · Banho 18k",
  "Troca em 30 dias",
  "Embalagem cortesia",
];

const PillarsBar = () => {
  return (
    <section className="bg-bordeaux/[0.04] border-y border-bordeaux/10">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-4 sm:py-5">
        <div className="flex items-center justify-center gap-x-6 sm:gap-x-12 gap-y-2 flex-wrap">
          {items.map((text, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              <span className="w-1 h-1 rounded-full bg-bordeaux/60" />
              <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-foreground/70 whitespace-nowrap">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PillarsBar;
