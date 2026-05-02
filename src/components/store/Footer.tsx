import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin, Clock } from "lucide-react";
import SollarisSeal from "./SollarisSeal";

const Footer = () => {
  return (
    <footer className="bg-maison-bordeaux text-maison-creme">
      {/* Top hairline gold */}
      <div className="maison-hairline-gold opacity-60" />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-20 sm:py-24">
        {/* Brand block */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <SollarisSeal size={64} tone="creme" />
          <p className="font-display text-3xl sm:text-4xl tracking-[0.18em] mt-6 mb-3 text-maison-creme">
            SOLLARIS
          </p>
          <p className="font-display italic text-base sm:text-lg text-maison-creme/70">
            o luxo que sussurra.
          </p>
        </div>

        <div className="maison-hairline-gold mb-16 sm:mb-20 opacity-40" />

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 sm:gap-10 mb-16">
          {/* Maison */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-maison-gold mb-5">
              A Sollaris
            </p>
            <ul className="space-y-3.5">
              <li>
                <Link to="/atelier" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  O Atelier
                </Link>
              </li>
              <li>
                <Link to="/journal" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  Journal
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  Filosofia
                </Link>
              </li>
              <li>
                <Link to="/concierge" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  Concierge
                </Link>
              </li>
            </ul>
          </div>

          {/* Coleções */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-maison-gold mb-5">
              Coleções
            </p>
            <ul className="space-y-3.5">
              <li>
                <Link to="/colecao" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  Todas as Peças
                </Link>
              </li>
              <li>
                <Link to="/colecao?colecao=heritage" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  Heritage
                </Link>
              </li>
              <li>
                <Link to="/colecao?colecao=editorial" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  Editorial Bordeaux
                </Link>
              </li>
              <li>
                <Link to="/colecao?colecao=essentials" className="font-display text-[15px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  Sollaris Essentials
                </Link>
              </li>
            </ul>
          </div>

          {/* Cuidados */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-maison-gold mb-5">
              Cuidados
            </p>
            <ul className="space-y-3.5">
              <li>
                <span className="font-display text-[15px] text-maison-creme/90">
                  Garantia Vitalícia
                </span>
              </li>
              <li>
                <span className="font-display text-[15px] text-maison-creme/90">
                  Banho 18k · 5 micra
                </span>
              </li>
              <li>
                <span className="font-display text-[15px] text-maison-creme/90">
                  Re-banho gratuito
                </span>
              </li>
              <li>
                <span className="font-display text-[15px] text-maison-creme/90">
                  Embalagem Sollaris
                </span>
              </li>
            </ul>
          </div>

          {/* Atelier address */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-maison-gold mb-5">
              Atelier
            </p>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-maison-gold flex-shrink-0 mt-1" strokeWidth={1.5} />
                <span className="font-display text-[14px] text-maison-creme/90 leading-relaxed">
                  Rua Oscar Freire, 1234<br />Jardins · São Paulo
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-3.5 w-3.5 text-maison-gold flex-shrink-0 mt-1" strokeWidth={1.5} />
                <span className="font-display text-[14px] text-maison-creme/90 leading-relaxed">
                  Seg–Sex · 11h às 19h<br />com hora marcada
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-3.5 w-3.5 text-maison-gold flex-shrink-0 mt-1" strokeWidth={1.5} />
                <a href="mailto:concierge@sollaris.com" className="font-display text-[14px] text-maison-creme/90 hover:text-maison-gold transition-colors">
                  concierge@sollaris.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="maison-hairline-gold mb-8 opacity-40" />

        {/* Bottom strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-maison-creme/55">
            © {new Date().getFullYear()} Sollaris · Todos os direitos reservados
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/sollarisjoias"
              target="_blank"
              rel="noopener noreferrer"
              className="text-maison-creme/55 hover:text-maison-gold transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" strokeWidth={1.4} />
            </a>
            <Link
              to="/admin"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-maison-creme/30 hover:text-maison-creme/60 transition-colors"
            >
              Atelier
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
