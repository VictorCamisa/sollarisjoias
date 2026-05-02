import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onOpenChat: () => void;
}

const ConciergeCTA = ({ onOpenChat }: Props) => {
  return (
    <section className="bg-gradient-to-br from-bordeaux via-[#4a151a] to-[#2a0c10] text-maison-creme relative overflow-hidden">
      {/* Decorative gold lines */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-champagne" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-champagne" />
      </div>

      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-16 sm:py-24 relative">
        <div className="grid md:grid-cols-[auto_1fr_auto] items-center gap-8 sm:gap-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-champagne/40 bg-champagne/10 flex items-center justify-center mx-auto md:mx-0"
          >
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-champagne" strokeWidth={1.2} />
          </motion.div>

          <div className="text-center md:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-champagne mb-3">
              Atendimento personalizado
            </p>
            <h2 className="font-display text-[28px] sm:text-[42px] leading-[1.05] mb-3">
              Fale com nossa <span className="italic text-champagne">consultora</span>
            </h2>
            <p className="font-sans text-[14px] sm:text-[15px] text-maison-creme/80 leading-relaxed max-w-md mx-auto md:mx-0">
              Conte a ocasião, o estilo, o orçamento — e a Sollaris monta uma
              seleção sob medida pra você. Conversa, escolha e fechamento, tudo aqui.
            </p>
          </div>

          <button
            onClick={onOpenChat}
            className="group relative inline-flex items-center gap-3 px-7 py-4 bg-champagne text-bordeaux hover:bg-maison-creme transition-all duration-300 font-mono text-[11px] uppercase tracking-[0.28em] whitespace-nowrap mx-auto md:mx-0"
          >
            Iniciar conversa
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ConciergeCTA;
