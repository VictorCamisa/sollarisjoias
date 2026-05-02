import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const HeroBanner = () => {
  return (
    <section className="relative w-full h-[68vh] min-h-[520px] max-h-[760px] overflow-hidden bg-maison-creme-warm">
      {/* Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Joias Sollaris — coleção atemporal"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* gradient para legibilidade do texto, mas sem escurecer a peça */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-[1400px] mx-auto px-6 sm:px-10 flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-maison-creme"
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.32em] text-maison-gold-soft mb-5">
            Nova Coleção · Outono 2026
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight mb-6">
            Joias para o<br />
            <em className="not-italic font-display italic text-maison-gold-soft">dia a dia</em> que importa.
          </h1>
          <p className="font-sans text-base sm:text-lg text-maison-creme/85 leading-relaxed mb-9 max-w-md">
            Banho de ouro 18k · 5 micra · garantia vitalícia. Peças pensadas para você usar todo dia, sem medo.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 bg-maison-creme text-maison-bordeaux font-mono text-[11px] uppercase tracking-[0.22em] px-8 py-4 hover:bg-maison-gold hover:text-foreground transition-all duration-300 group"
            >
              Ver coleção
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.6} />
            </Link>
            <Link
              to="/colecao?cat=aneis"
              className="inline-flex items-center gap-2 text-maison-creme font-mono text-[11px] uppercase tracking-[0.22em] px-2 py-4 border-b border-maison-creme/40 hover:border-maison-gold hover:text-maison-gold transition-all"
            >
              Ver anéis
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;
