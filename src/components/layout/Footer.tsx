import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logoImg from "@/assets/logo-larifa.png";
import { BotanicalPattern, CornerLeaves } from "@/components/store/BotanicalElements";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      {/* Botanical background */}
      <BotanicalPattern opacity={0.04} className="text-primary-foreground" />
      <CornerLeaves position="top-right" opacity={0.06} className="text-primary-foreground" />

      <div className="container mx-auto px-6 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <img src={logoImg} alt="Larifa" className="h-8 w-auto brightness-0 invert opacity-90" />
            <p className="text-primary-foreground/50 text-sm font-light leading-relaxed mt-4 max-w-[200px]">
              Semijoias premium com design exclusivo e qualidade de joalheria.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-caption text-primary-foreground/40 mb-5">Navegação</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Início</Link></li>
              <li><Link to="/produtos" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Coleção</Link></li>
              <li><Link to="/novidades" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Novidades</Link></li>
              <li><Link to="/sobre" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Sobre</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-caption text-primary-foreground/40 mb-5">Ajuda</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/conta" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Minha Conta</Link></li>
              <li><Link to="/favoritos" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">Favoritos</Link></li>
              <li><span className="text-primary-foreground/60">Atendimento via WhatsApp</span></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-caption text-primary-foreground/40 mb-5">Redes Sociais</h4>
            <a 
              href="https://instagram.com/larifasemijoias" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm"
            >
              <Instagram className="h-4 w-4" />
              @larifasemijoias
            </a>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-primary-foreground/30 tracking-wide">
            © {new Date().getFullYear()} Larifa. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-primary-foreground/20 tracking-wide">
            Desenvolvido por VS Soluções
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
