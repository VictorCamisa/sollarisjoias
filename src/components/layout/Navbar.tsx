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
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-700",
        scrolled
          ? "bg-primary/30 backdrop-blur-md"
          : "bg-primary"
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-[80px] md:h-[90px]">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo — left, large */}
          <Link to="/" className="md:mr-auto">
            <img
              src={logoImg}
              alt="Larifa"
              className="h-14 md:h-20 w-auto brightness-0 invert opacity-95"
            />
          </Link>

          {/* Desktop nav — center via absolute */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className="text-[13px] tracking-[0.08em] uppercase font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Início
            </Link>

            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1.5 text-[13px] tracking-[0.08em] uppercase font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Coleção
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", catOpen && "rotate-180")} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-card border border-border shadow-lg py-2 min-w-[170px]">
                  <Link
                    to="/produtos"
                    className="block px-5 py-2.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Ver Tudo
                  </Link>
                  {categories?.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/produtos?categoria=${cat.slug}`}
                      className="block px-5 py-2.5 text-[13px] text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/novidades"
              className="text-[13px] tracking-[0.08em] uppercase font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Novidades
            </Link>
            <Link
              to="/sobre"
              className="text-[13px] tracking-[0.08em] uppercase font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Sobre
            </Link>
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-5">
            <Link
              to="/busca"
              className="hidden md:block text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
            <Link
              to="/conta"
              className="hidden md:block text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
            <Link
              to="/favoritos"
              className="relative text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {favCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary-foreground text-primary text-[9px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="relative text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary-foreground text-primary text-[9px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden bg-primary border-t border-primary-foreground/10 px-6 py-5 space-y-1">
          <Link to="/" className="block text-primary-foreground py-2.5 text-[14px] font-medium">Início</Link>

          <div>
            <button
              onClick={() => setMobileCatOpen(!mobileCatOpen)}
              className="flex items-center justify-between w-full text-primary-foreground py-2.5 text-[14px] font-medium"
            >
              Coleção
              <ChevronDown className={cn("h-4 w-4 transition-transform", mobileCatOpen && "rotate-180")} />
            </button>
            {mobileCatOpen && (
              <div className="pl-4 pb-2 space-y-1">
                <Link to="/produtos" className="block text-primary-foreground/60 py-2 text-[14px]">Ver Tudo</Link>
                {categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/produtos?categoria=${cat.slug}`}
                    className="block text-primary-foreground/60 py-2 text-[14px]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/novidades" className="block text-primary-foreground py-2.5 text-[14px] font-medium">Novidades</Link>
          <Link to="/sobre" className="block text-primary-foreground py-2.5 text-[14px] font-medium">Sobre</Link>

          <div className="border-t border-primary-foreground/10 mt-3 pt-3 space-y-1">
            <Link to="/busca" className="block text-primary-foreground/60 py-2.5 text-[14px]">Buscar</Link>
            <Link to="/conta" className="block text-primary-foreground/60 py-2.5 text-[14px]">Minha Conta</Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
