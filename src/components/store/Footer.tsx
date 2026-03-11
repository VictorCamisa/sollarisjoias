import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="font-serif text-lg tracking-[0.12em] text-foreground">
              SOLLARIS
            </Link>
            <p className="font-sans text-xs text-muted-foreground mt-4 leading-relaxed max-w-[280px]">
              Curadoria de semijoias premium. Cada peça selecionada com intenção.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Navegação
            </p>
            <nav className="space-y-3">
              <Link to="/colecao" className="block font-sans text-sm text-foreground/80 hover:text-accent transition-colors">
                Coleção
              </Link>
              <Link to="/sobre" className="block font-sans text-sm text-foreground/80 hover:text-accent transition-colors">
                Sobre
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Contato
            </p>
            <p className="font-sans text-sm text-foreground/80">
              contato@sollaris.com
            </p>
          </div>
        </div>

        <div className="gold-line mt-12 mb-6" />

        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground text-center">
          © {new Date().getFullYear()} Sollaris. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
