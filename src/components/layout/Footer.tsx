import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logoImg from "@/assets/logo-larifa.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <img src={logoImg} alt="Larifa" className="h-8 w-auto brightness-0 invert opacity-90" />
            <p className="text-background/50 text-sm font-light leading-relaxed mt-4 max-w-[200px]">
              Semijoias premium com design exclusivo e qualidade de joalheria.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-caption text-background/40 mb-5">Navegação</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-background/60 hover:text-background transition-colors">Início</Link></li>
              <li><Link to="/produtos" className="text-background/60 hover:text-background transition-colors">Coleção</Link></li>
              <li><Link to="/novidades" className="text-background/60 hover:text-background transition-colors">Novidades</Link></li>
              <li><Link to="/sobre" className="text-background/60 hover:text-background transition-colors">Sobre</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-caption text-background/40 mb-5">Ajuda</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/conta" className="text-background/60 hover:text-background transition-colors">Minha Conta</Link></li>
              <li><Link to="/favoritos" className="text-background/60 hover:text-background transition-colors">Favoritos</Link></li>
              <li><span className="text-background/60">Atendimento via WhatsApp</span></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-caption text-background/40 mb-5">Redes Sociais</h4>
            <a 
              href="https://instagram.com/larifasemijoias" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-background/60 hover:text-background transition-colors text-sm"
            >
              <Instagram className="h-4 w-4" />
              @larifasemijoias
            </a>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-background/30 tracking-wide">
            © {new Date().getFullYear()} Larifa. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-background/20 tracking-wide">
            Desenvolvido por VS Soluções
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
