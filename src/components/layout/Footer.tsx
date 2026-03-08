import { Link } from "react-router-dom";
import NewsletterForm from "@/components/store/NewsletterForm";
import { Instagram } from "lucide-react";
import logoImg from "@/assets/logo-larifa.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background mt-20">
      <div className="container mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo + tagline */}
          <div>
            <img src={logoImg} alt="Larifa." className="h-10 w-auto brightness-0 invert" />
            <p className="text-background/60 text-sm font-sans leading-relaxed mt-4 max-w-xs">
              Semijoias premium com design exclusivo e qualidade de joalheria. Cada peça conta a sua história.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="text-background/50 hover:text-accent transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-sans text-[11px] tracking-[0.10em] uppercase font-semibold text-background/40 mb-5">Navegação</h4>
            <ul className="space-y-3 text-sm font-sans">
              <li><Link to="/" className="text-background/70 hover:text-accent transition-colors">Início</Link></li>
              <li><Link to="/produtos" className="text-background/70 hover:text-accent transition-colors">Coleção</Link></li>
              <li><Link to="/novidades" className="text-background/70 hover:text-accent transition-colors">Novidades</Link></li>
              <li><Link to="/sobre" className="text-background/70 hover:text-accent transition-colors">Sobre</Link></li>
              <li><Link to="/favoritos" className="text-background/70 hover:text-accent transition-colors">Favoritos</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sans text-[11px] tracking-[0.10em] uppercase font-semibold text-background/40 mb-5">Contato</h4>
            <p className="text-sm font-sans text-background/70">Atendimento via WhatsApp</p>
            <p className="text-sm font-sans text-background/50 mt-1">Seg - Sex, 9h - 18h</p>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-sans text-[11px] tracking-[0.10em] uppercase font-semibold text-background/40 mb-5">Newsletter</h4>
            <p className="text-sm font-sans text-background/50 mb-4">
              Receba novidades e ganhe 10% na primeira compra.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-sans text-background/30 tracking-wide">
            © {new Date().getFullYear()} Larifa. Todos os direitos reservados.
          </p>
          <p className="text-[11px] font-sans text-background/20 tracking-wide">
            Desenvolvido por VS Soluções
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
