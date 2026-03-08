import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

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

  const navBg = scrolled || !isHome
    ? "bg-card/95 backdrop-blur-md shadow-sm"
    : "bg-transparent";

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500", navBg)}>
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="font-serif text-2xl tracking-[0.3em] font-semibold text-foreground">
          LARIFA
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide font-medium">
          <Link to="/" className="hover:opacity-60 transition-opacity text-foreground">Início</Link>
          <Link to="/produtos" className="hover:opacity-60 transition-opacity text-foreground">Coleção</Link>
          <Link to="/novidades" className="hover:opacity-60 transition-opacity text-foreground">Novidades</Link>
          <Link to="/sobre" className="hover:opacity-60 transition-opacity text-foreground">Sobre</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/busca" className="hover:opacity-60 transition-opacity text-foreground">
            <Search className="h-5 w-5" />
          </Link>
          <Link to="/favoritos" className="relative hover:opacity-60 transition-opacity text-foreground">
            <Heart className="h-5 w-5" />
            {favCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {favCount}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(true)} className="relative hover:opacity-60 transition-opacity text-foreground">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
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
        <nav className="md:hidden bg-card/95 backdrop-blur-md border-t border-border px-6 py-6 space-y-4 text-sm tracking-wide font-medium">
          <Link to="/" className="block text-foreground">Início</Link>
          <Link to="/produtos" className="block text-foreground">Coleção</Link>
          <Link to="/novidades" className="block text-foreground">Novidades</Link>
          <Link to="/sobre" className="block text-foreground">Sobre</Link>
          <Link to="/favoritos" className="block text-foreground">Favoritos</Link>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
