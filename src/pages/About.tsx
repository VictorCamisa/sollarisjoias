import { motion } from "framer-motion";
import { Sparkles, Heart, Zap, Palette } from "lucide-react";

const values = [
  { icon: Sparkles, title: "AI-First", desc: "Inteligência artificial a serviço do seu estilo. Nossa estilista virtual monta looks personalizados para cada ocasião." },
  { icon: Heart, title: "Curadoria Premium", desc: "Cada peça é selecionada com cuidado, priorizando qualidade, caimento e tendências que duram além da estação." },
  { icon: Zap, title: "Atendimento Ágil", desc: "Do WhatsApp à IA, cada canal é pensado para que sua experiência de compra seja rápida e encantadora." },
  { icon: Palette, title: "Estilo Único", desc: "Acreditamos que moda é expressão. Nossas combinações te ajudam a comunicar quem você é." },
];

const About = () => (
  <div className="pt-24 pb-16">
    {/* Hero */}
    <section className="container mx-auto px-6 text-center mb-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4 font-sans font-medium">Sobre nós</p>
        <h1 className="text-4xl md:text-6xl font-serif font-semibold leading-tight mb-6 max-w-2xl mx-auto">
          Moda inteligente para mulheres que sabem o que querem
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          A LARIFA nasceu da fusão entre tecnologia e moda. Somos a primeira marca brasileira AI-First de moda feminina, onde cada look é pensado com inteligência — artificial e humana.
        </p>
      </motion.div>
    </section>

    {/* Story */}
    <section className="container mx-auto px-6 mb-20">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-6">Nossa história</h2>
          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
            <p>
              Em um mundo onde a moda se move rápido demais, percebemos que faltava algo: <strong className="text-foreground">personalização de verdade</strong>. Não basta ter peças bonitas — é preciso saber combiná-las para cada mulher, cada ocasião, cada momento.
            </p>
            <p>
              Foi assim que nasceu a LARIFA. Unimos a sensibilidade da curadoria humana com o poder da inteligência artificial para criar uma experiência de compra única. Nossa estilista virtual, a <strong className="text-foreground">Lari</strong>, conhece todo o catálogo e monta looks sob medida em segundos.
            </p>
            <p>
              Mas tecnologia sozinha não basta. Cada peça da nossa coleção passa por uma curadoria rigorosa de qualidade, caimento e versatilidade. Só entra no catálogo o que realmente vale a pena.
            </p>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Values */}
    <section className="container mx-auto px-6 mb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3 font-sans font-medium">Pilares</p>
        <h2 className="text-3xl font-serif font-semibold">Nossos valores</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <v.icon className="h-6 w-6 text-accent mb-3" />
            <h3 className="font-serif text-lg font-semibold mb-2">{v.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="container mx-auto px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-secondary rounded-2xl py-12 px-6">
        <Sparkles className="h-8 w-8 text-accent mx-auto mb-4" />
        <h2 className="text-2xl font-serif font-semibold mb-3">Converse com a Lari</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Clique no botão ✨ no canto da tela e deixe nossa estilista virtual montar o look perfeito para você.
        </p>
      </motion.div>
    </section>
  </div>
);

export default About;
