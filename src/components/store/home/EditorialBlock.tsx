import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import lookbookImg from "@/assets/lookbook-1.jpg";

const EditorialBlock = () => {
  return (
    <section className="bg-maison-creme-warm py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
        <div className="grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="aspect-[4/5] overflow-hidden bg-muted"
          >
            <img
              src={lookbookImg}
              alt="Editorial Sollaris"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bordeaux mb-4">
              A Sollaris
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.05] mb-6 text-foreground">
              Curadoria com<br />
              <em className="not-italic font-display italic text-bordeaux">intenção.</em>
            </h2>
            <p className="font-sans text-foreground/75 leading-relaxed text-[15px] mb-4">
              Cada peça do nosso portfólio é escolhida sob um olhar editorial rigoroso. Trabalhamos com semi-joias em banho de ouro 18k de alta camada (5 micra), feitas para durar e acompanhar seus dias.
            </p>
            <p className="font-sans text-foreground/75 leading-relaxed text-[15px] mb-8">
              Sem hype. Sem trend efêmero. Só peças que ficam bem em você hoje, amanhã, daqui a cinco anos.
            </p>
            <Link
              to="/sobre"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-bordeaux border-b border-bordeaux/40 pb-1 hover:border-bordeaux transition-colors"
            >
              Conhecer a Sollaris →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EditorialBlock;
