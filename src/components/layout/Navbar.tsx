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
    const onScroll = () => setScrolled(window.scrollY > 20);
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
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-card/98 backdrop-blur-md shadow-[0_1px_0_hsl(var(--border))]"
          : "bg-card"
      )}
    >
      {/* Top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container mx-auto px-6">
        {/* ─── Desktop: 3-row layout ─── */}
        <div className="hidden md:block">
          {/* Row 1: Utility icons */}
          <div className="flex items-center justify-end gap-5 pt-3 pb-1">
            <Link to="/busca" className="text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-[16px] w-[16px]" strokeWidth={1.5} />
            </Link>
            <Link to="/conta" className="text-muted-foreground hover:text-foreground transition-colors">
              <User className="h-[16px] w-[16px]" strokeWidth={1.5} />
            </Link>
            <Link to="/favoritos" className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="h-[16px] w-[16px]" strokeWidth={1.5} />
              {favCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-semibold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>
            <button onClick={() => setOpen(true)} className="relative text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingBag className="h-[16px] w-[16px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-semibold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Row 2: Logo centered */}
          <div className="flex items-center justify-center py-4">
            <Link to="/">
              <img
                src={logoImg}
                alt="Larifa"
                className={cn(
                  "w-auto transition-all duration-500",
                  scrolled ? "h-10" : "h-14"
                )}
              />
            </Link>
          </div>

          {/* Row 3: Nav links centered */}
          <nav className="flex items-center justify-center gap-10 pb-4">
            <Link
              to="/"
              className="font-serif text-[15px] text-foreground/60 hover:text-foreground transition-colors tracking-wide"
            >
              Início
            </Link>

            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1.5 font-serif text-[15px] text-foreground/60 hover:text-foreground transition-colors tracking-wide"
              >
                Coleção
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", catOpen && "rotate-180")} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-card border border-border shadow-lg py-3 min-w-[180px]">
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
              className="font-serif text-[15px] text-foreground/60 hover:text-foreground transition-colors tracking-wide"
            >
              Novidades
            </Link>
            <Link
              to="/sobre"
              className="font-serif text-[15px] text-foreground/60 hover:text-foreground transition-colors tracking-wide"
            >
              Sobre
            </Link>
          </nav>
        </div>

        {/* ─── Mobile: single row ─── */}
        <div className="flex md:hidden items-center justify-between h-[64px]">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <img src={logoImg} alt="Larifa" className="h-9 w-auto" />
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/favoritos" className="relative text-foreground/60">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {favCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-semibold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>
            <button onClick={() => setOpen(true)} className="relative text-foreground/60">
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-semibold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden bg-card border-t border-border px-6 py-5 space-y-1">
          <Link to="/" className="block text-foreground py-2.5 text-[15px] font-serif">Início</Link>

          <div>
            <button
              onClick={() => setMobileCatOpen(!mobileCatOpen)}
              className="flex items-center justify-between w-full text-foreground py-2.5 text-[15px] font-serif"
            >
              Coleção
              <ChevronDown className={cn("h-4 w-4 transition-transform", mobileCatOpen && "rotate-180")} />
            </button>
            {mobileCatOpen && (
              <div className="pl-4 pb-2 space-y-1">
                <Link to="/produtos" className="block text-muted-foreground py-2 text-[14px]">Ver Tudo</Link>
                {categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/produtos?categoria=${cat.slug}`}
                    className="block text-muted-foreground py-2 text-[14px]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/novidades" className="block text-foreground py-2.5 text-[15px] font-serif">Novidades</Link>
          <Link to="/sobre" className="block text-foreground py-2.5 text-[15px] font-serif">Sobre</Link>

          <div className="border-t border-border mt-3 pt-3 space-y-1">
            <Link to="/busca" className="block text-muted-foreground py-2.5 text-[14px]">Buscar</Link>
            <Link to="/conta" className="block text-muted-foreground py-2.5 text-[14px]">Minha Conta</Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
