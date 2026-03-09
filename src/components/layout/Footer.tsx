import { Link } from "react-router-dom";
import { Instagram, Diamond } from "lucide-react";
import logoImg from "@/assets/logo-larifa.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground relative">
      {/* Gold top line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[hsl(36,55%,48%,0.4)] to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Logo + tagline */}
          <div className="col-span-2 md:col-span-1">
            <img src={logoImg} alt="Larifa" className="h-8 w-auto brightness-0 invert opacity-80" />
            <p className="text-primary-foreground/35 text-[13px] font-light leading-relaxed mt-4 max-w-[200px]">
              Semijoias premium com design exclusivo e qualidade de joalheria.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.15em] uppercase font-semibold text-primary-foreground/30 mb-4 sm:mb-5">Navegação</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link to="/" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">Início</Link></li>
              <li><Link to="/produtos" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">Coleção</Link></li>
              <li><Link to="/novidades" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">Novidades</Link></li>
              <li><Link to="/sobre" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">Sobre</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.15em] uppercase font-semibold text-primary-foreground/30 mb-4 sm:mb-5">Ajuda</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link to="/conta" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">Minha Conta</Link></li>
              <li><Link to="/favoritos" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">Favoritos</Link></li>
              <li><span className="text-primary-foreground/50">Atendimento via WhatsApp</span></li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-[10px] tracking-[0.15em] uppercase font-semibold text-primary-foreground/30 mb-4 sm:mb-5">Redes Sociais</h4>
            <a 
              href="https://instagram.com/larifasemijoias" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-foreground/50 hover:text-primary-foreground transition-colors text-[13px]"
            >
              <Instagram className="h-4 w-4" />
              @larifasemijoias
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <div className="w-8 h-[1px] bg-primary-foreground/10" />
            <Diamond className="h-2 w-2 text-primary-foreground/15" />
            <div className="w-8 h-[1px] bg-primary-foreground/10" />
          </div>
          <p className="text-[10px] text-primary-foreground/25 tracking-wide">
            © {new Date().getFullYear()} Larifa. Todos os direitos reservados.
          </p>
          <p className="text-[10px] text-primary-foreground/15 tracking-wide">
            Desenvolvido por VS Soluções
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;