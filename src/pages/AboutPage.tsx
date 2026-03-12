import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Gem, Sparkles, Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Reveal ─── */
const Reveal = ({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial =
    direction === "up" ? { opacity: 0, y: 50 } :
    direction === "left" ? { opacity: 0, x: -50 } :
    direction === "right" ? { opacity: 0, x: 50 } :
    { opacity: 0 };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Text word-by-word reveal ─── */
const WordReveal = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <span ref={ref} className={cn("inline-flex flex-wrap", className)}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

/* ─── Pillar Card ─── */
const PillarCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) => (
  <Reveal delay={delay}>
    <div className="group relative rounded-2xl border border-border/30 bg-card p-8 md:p-10 text-center hover:border-accent/20 transition-all duration-500">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center mx-auto mb-5 group-hover:border-accent/40 transition-colors duration-500">
          <Icon className="h-5 w-5 text-accent" strokeWidth={1.2} />
        </div>
        <h3 className="font-serif text-lg text-foreground mb-3">{title}</h3>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  </Reveal>
);

/* ─── Number Stat ─── */
const StatBlock = ({ number, label, delay }: { number: string; label: string; delay: number }) => (
  <Reveal delay={delay}>
    <div className="text-center">
      <p className="font-serif text-4xl md:text-5xl text-accent mb-2">{number}</p>
      <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{label}</p>
    </div>
  </Reveal>
);

/* ═══════════════════════════════════════════════════════
   ABOUT PAGE
═══════════════════════════════════════════════════════ */
const AboutPage = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background decorative S */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[300px] md:text-[500px] text-accent/[0.02] pointer-events-none select-none leading-none">
          S
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative max-w-[1000px] mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2.5 mb-6"
          >
            <div className="gold-line w-8" />
            <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-accent">
              Nossa Essência
            </span>
            <div className="gold-line w-8" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground mb-8 leading-[1]"
          >
            Sobre a Sollaris
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-sans text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            Curadoria, não varejo. Cada peça existe aqui porque foi 
            escolhida com intenção, critério e paixão.
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="gold-line max-w-[200px] mx-auto mt-10"
          />
        </motion.div>
      </section>

      {/* ─── Brand Statement ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <Reveal direction="left">
              <div className="space-y-6">
                <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent">
                  A Filosofia
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground leading-[1.1]">
                  <WordReveal text="Beleza com inteligência de compra" />
                </h2>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.15}>
              <div className="space-y-5 font-sans text-sm text-muted-foreground leading-[1.9]">
                <p>
                  A Sollaris não é sobre acessibilidade — é sobre inteligência de compra.
                  Vendemos beleza de verdade para mulheres que valorizam estética e exclusividade,
                  sem o preço do ouro maciço.
                </p>
                <p>
                  Cada peça existe em nosso portfólio porque foi escolhida sob um rigoroso
                  olhar editorial. Materiais nobres, banhos de ouro 18k, e pedras 
                  cuidadosamente selecionadas.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Quote / Promessa ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-[800px] mx-auto px-6 md:px-12 text-center">
          <Reveal>
            <div className="gold-line max-w-[100px] mx-auto mb-10" />
          </Reveal>
          <Reveal delay={0.1}>
            <blockquote className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.15] italic">
              "Refinamento que atravessa o tempo."
            </blockquote>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-accent/60 mt-8">
              — Promessa Sollaris
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="gold-line max-w-[100px] mx-auto mt-10" />
          </Reveal>
        </div>
      </section>

      {/* ─── Pillars ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <Reveal className="text-center mb-14">
            <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
              Nossos Pilares
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              O que nos define
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            <PillarCard
              icon={Gem}
              title="Curadoria"
              description="Cada peça é selecionada sob um olhar editorial rigoroso. Não vendemos volume — vendemos intenção."
              delay={0.1}
            />
            <PillarCard
              icon={Eye}
              title="Atemporalidade"
              description="Design que transcende tendências passageiras. Peças que você usa hoje e amará por décadas."
              delay={0.2}
            />
            <PillarCard
              icon={Sparkles}
              title="Qualidade Premium"
              description="Banho de ouro 18k, pedras selecionadas, acabamento de alta joalheria. Sem concessões."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12">
          <div className="rounded-2xl border border-border/30 bg-card py-14 px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatBlock number="500+" label="Peças curadas" delay={0} />
              <StatBlock number="18k" label="Banho de ouro" delay={0.08} />
              <StatBlock number="100%" label="Atendimento pessoal" delay={0.16} />
              <StatBlock number="5★" label="Avaliação média" delay={0.24} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Process / How we work ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12">
          <Reveal className="text-center mb-14">
            <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
              Do Ateliê a Você
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              Como funciona
            </h2>
          </Reveal>

          <div className="space-y-0">
            {[
              {
                step: "01",
                title: "Curadoria",
                text: "Buscamos as melhores peças junto a fornecedores selecionados, com critério estético e de qualidade.",
              },
              {
                step: "02",
                title: "Seleção Editorial",
                text: "Cada peça passa por um crivo editorial: design, acabamento, durabilidade e atemporalidade.",
              },
              {
                step: "03",
                title: "Consultoria Pessoal",
                text: "Atendimento humano e personalizado via WhatsApp. Ajudamos você a encontrar a peça perfeita.",
              },
              {
                step: "04",
                title: "Entrega Cuidadosa",
                text: "Embalagem premium com o cuidado que cada joia merece, direto na sua porta.",
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.1}>
                <div className={cn(
                  "flex gap-6 md:gap-10 py-8",
                  i < 3 && "border-b border-border/30"
                )}>
                  <span className="font-serif text-3xl md:text-4xl text-accent/30 flex-shrink-0 w-12 md:w-16">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-serif text-lg md:text-xl text-foreground mb-2">{item.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border/30">
              {/* Decorative */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[200px] md:text-[300px] text-accent/[0.03] pointer-events-none select-none">
                S
              </div>
              <div className="relative text-center py-20 md:py-28 px-6 space-y-6">
                <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-accent/60">
                  Pronta para brilhar?
                </p>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground">
                  Conheça a coleção
                </h2>
                <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Explore nossas peças curadas e encontre a joia que foi feita para você.
                </p>
                <div className="gold-line max-w-[80px] mx-auto" />
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <Link to="/colecao">
                    <motion.span
                      whileHover={{ scale: 1.03, boxShadow: "0 0 40px hsl(39 41% 70% / 0.2)" }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-3 bg-accent text-accent-foreground font-sans text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-full"
                    >
                      Ver Coleção
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                  <Link to="/vitrine">
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-3 border border-accent/30 text-accent font-sans text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-accent/5 transition-colors"
                    >
                      Vitrine Editorial
                    </motion.span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
