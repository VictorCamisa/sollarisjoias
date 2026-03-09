import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, Heart, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import logoImg from "@/assets/logo-larifa.png";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCategories } from "@/hooks/useStore";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { totalItems, setOpen } = useCart();
  const { count: favCount } = useFavorites();
  const { data: categories } = useCategories();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCatOpen(false);
    setMobileCatOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const linkColor = scrolled
    ? "text-foreground/80 hover:text-accent"
    : "text-white/85 hover:text-accent";
  const iconColor = scrolled
    ? "text-foreground/60 hover:text-accent"
    : "text-white/70 hover:text-accent";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-card/95 backdrop-blur-xl shadow-sm border-b border-border/50"
          : "bg-transparent absolute w-full"
      )}
      style={!scrolled ? { position: "absolute" } : {}}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[60px] sm:h-[72px] md:h-[80px]">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn("md:hidden", scrolled ? "text-foreground" : "text-white")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="md:mr-auto">
            <img
              src={logoImg}
              alt="Larifa"
              className={cn(
                "h-9 sm:h-12 md:h-16 w-auto transition-all duration-500",
                !scrolled && "brightness-0 invert"
              )}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            <Link to="/" className={cn("text-[12px] tracking-[0.1em] uppercase font-semibold transition-colors", linkColor)}>
              Início
            </Link>
            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className={cn("flex items-center gap-1.5 text-[12px] tracking-[0.1em] uppercase font-semibold transition-colors", linkColor)}
              >
                Coleção
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", catOpen && "rotate-180")} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-card border border-border shadow-xl py-2 min-w-[170px]">
                  <Link to="/produtos" className="block px-5 py-2.5 text-[12px] font-semibold text-foreground hover:text-accent transition-colors">
                    Ver Tudo
                  </Link>
                  {categories?.map((cat) => (
                    <Link key={cat.id} to={`/produtos?categoria=${cat.slug}`} className="block px-5 py-2.5 text-[12px] text-foreground/60 hover:text-accent transition-colors">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/novidades" className={cn("text-[12px] tracking-[0.1em] uppercase font-semibold transition-colors", linkColor)}>
              Novidades
            </Link>
            <Link to="/sobre" className={cn("text-[12px] tracking-[0.1em] uppercase font-semibold transition-colors", linkColor)}>
              Sobre
            </Link>
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-4 sm:gap-5">
            <Link to="/busca" className={cn("hidden md:block transition-colors", iconColor)}>
              <Search className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </Link>
            <Link to="/conta" className={cn("hidden md:block transition-colors", iconColor)}>
              <User className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </Link>
            <Link to="/favoritos" className={cn("relative transition-colors", iconColor)}>
              <Heart className="h-[17px] w-[17px]" strokeWidth={1.5} />
              {favCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>
            <button onClick={() => setOpen(true)} className={cn("relative transition-colors", iconColor)}>
              <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden fixed inset-0 top-[60px] bg-card z-40 px-5 py-6 space-y-1 overflow-y-auto border-t border-border/50">
          <Link to="/" className="block text-foreground py-3 text-[14px] font-semibold tracking-wide">Início</Link>
          <div>
            <button
              onClick={() => setMobileCatOpen(!mobileCatOpen)}
              className="flex items-center justify-between w-full text-foreground py-3 text-[14px] font-semibold tracking-wide"
            >
              Coleção
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", mobileCatOpen && "rotate-180")} />
            </button>
            {mobileCatOpen && (
              <div className="pl-4 pb-2 space-y-1 border-l border-accent/20 ml-2">
                <Link to="/produtos" className="block text-muted-foreground py-2 text-[13px]">Ver Tudo</Link>
                {categories?.map((cat) => (
                  <Link key={cat.id} to={`/produtos?categoria=${cat.slug}`} className="block text-muted-foreground py-2 text-[13px]">
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/novidades" className="block text-foreground py-3 text-[14px] font-semibold tracking-wide">Novidades</Link>
          <Link to="/sobre" className="block text-foreground py-3 text-[14px] font-semibold tracking-wide">Sobre</Link>
          <div className="border-t border-border mt-4 pt-4 space-y-1">
            <Link to="/busca" className="block text-muted-foreground py-2.5 text-[13px]">Buscar</Link>
            <Link to="/conta" className="block text-muted-foreground py-2.5 text-[13px]">Minha Conta</Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;