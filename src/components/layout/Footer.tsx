import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-serif text-xl tracking-[0.3em] font-semibold mb-4">LARIFA</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Moda premium com atendimento personalizado. Elegância e exclusividade em cada peça.
            </p>
          </div>

          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase font-semibold mb-4 text-muted-foreground">Navegação</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-foreground hover:opacity-60 transition-opacity">Início</Link></li>
              <li><Link to="/produtos" className="text-foreground hover:opacity-60 transition-opacity">Coleção</Link></li>
              <li><Link to="/novidades" className="text-foreground hover:opacity-60 transition-opacity">Novidades</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase font-semibold mb-4 text-muted-foreground">Contato</h4>
            <p className="text-sm text-foreground">Atendimento via WhatsApp</p>
            <p className="text-sm text-muted-foreground mt-1">Seg - Sex, 9h - 18h</p>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-xs text-muted-foreground tracking-wide">
            © {new Date().getFullYear()} LARIFA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
