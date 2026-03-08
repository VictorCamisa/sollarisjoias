import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, Heart, User, Truck, CreditCard, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import logoImg from "@/assets/logo-larifa.png";
import { useFavorites } from "@/contexts/FavoritesContext";

const TopBar = () => (
  <div className="bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 md:px-10 py-2 flex items-center justify-center gap-6 md:gap-10 text-xs font-sans font-medium tracking-[0.06em]">
      <span className="hidden md:flex items-center gap-1.5">
        <Truck className="h-3 w-3" /> Frete Grátis +R$199
      </span>
      <span className="hidden md:flex items-center gap-1.5">
        <CreditCard className="h-3 w-3" /> Até 3x sem juros
      </span>
      <span className="flex items-center gap-1.5">
        <Percent className="h-3 w-3" /> 5% OFF no PIX
      </span>
    </div>
  </div>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { totalItems, setOpen } = useCart();
  const { count: favCount } = useFavorites();

  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const showSolidBg = scrolled || !isHome;

  return (
    <>
      {/* Top Bar — always visible */}
      <TopBar />

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          showSolidBg
            ? "bg-background/95 backdrop-blur-[12px] border-b border-secondary shadow-sm"
            : "bg-transparent"
        )}
        style={{ height: 72 }}
      >
        <div className="container mx-auto flex items-center justify-between px-4 md:px-10 h-full">
          {/* Left nav (desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] tracking-[0.04em] font-sans font-medium">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Início</Link>
            <Link to="/produtos" className="text-foreground hover:text-primary transition-colors">Coleção</Link>
            <Link to="/novidades" className="text-foreground hover:text-primary transition-colors">Novidades</Link>
          </nav>

          {/* Center: Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:mx-auto">
            <img src={logoImg} alt="Larifa." className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Right nav (desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] tracking-[0.04em] font-sans font-medium">
            <Link to="/sobre" className="text-foreground hover:text-primary transition-colors">Sobre</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/conta" className="hover:text-primary transition-colors text-foreground">
              <User className="h-[18px] w-[18px]" />
            </Link>
            <Link to="/busca" className="hover:text-primary transition-colors text-foreground">
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <Link to="/favoritos" className="relative hover:text-primary transition-colors text-foreground">
              <Heart className="h-[18px] w-[18px]" />
              {favCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>
            <button onClick={() => setOpen(true)} className="relative hover:text-primary transition-colors text-foreground">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden bg-card/98 backdrop-blur-md border-t border-secondary px-6 py-6 space-y-4 text-[13px] tracking-[0.04em] font-sans font-medium">
            <Link to="/" className="block text-foreground">Início</Link>
            <Link to="/produtos" className="block text-foreground">Coleção</Link>
            <Link to="/novidades" className="block text-foreground">Novidades</Link>
            <Link to="/sobre" className="block text-foreground">Sobre</Link>
            <Link to="/favoritos" className="block text-foreground">Favoritos</Link>
            <Link to="/conta" className="block text-foreground">Minha Conta</Link>
          </nav>
        )}
      </header>
    </>
  );
};

export default Navbar;
