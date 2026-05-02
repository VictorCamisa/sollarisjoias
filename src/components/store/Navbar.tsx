import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, Search, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SollarisSeal from "./SollarisSeal";

const navLinks = [
  { to: "/colecao", label: "Coleção" },
  { to: "/colecao?cat=aneis", label: "Anéis" },
  { to: "/colecao?cat=colares", label: "Colares" },
  { to: "/colecao?cat=brincos", label: "Brincos" },
  { to: "/colecao?cat=pulseiras", label: "Pulseiras" },
  { to: "/sobre", label: "A Sollaris" },
];

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const { user } = useAuth();
  const { count: favCount } = useFavorites();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const accountHref = user ? "/conta" : "/auth";

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {/* Top notice bar */}
      <div className="fixed top-0 left-0 right-0 z-[51] bg-maison-bordeaux text-maison-creme">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em]">
            Frete grátis acima de R$ 499 · 12× sem juros · Garantia vitalícia
          </p>
        </div>
      </div>

      <header
        className={cn(
          "fixed top-[28px] left-0 right-0 z-50 transition-all duration-500",
          scrolled || menuOpen
            ? "bg-card/95 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-card/85 backdrop-blur-md border-b border-transparent"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-4">
          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -ml-2 text-foreground active:scale-95 transition-transform"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo left on desktop */}
          <Link to="/" className="hidden md:flex items-center gap-2.5 group">
            <SollarisSeal size={32} tone="bordeaux" />
            <span className="font-display text-[17px] tracking-[0.3em] text-bordeaux">
              SOLLARIS
            </span>
          </Link>

          {/* Logo center on mobile */}
          <Link to="/" className="md:hidden flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <SollarisSeal size={28} tone="bordeaux" />
            <span className="font-display text-[14px] tracking-[0.28em] text-bordeaux">
              SOLLARIS
            </span>
          </Link>

          {/* Nav center (desktop) */}
          <nav className="hidden md:flex items-center gap-7 mx-auto">
            {navLinks.map((link) => {
              const isActive = location.pathname + location.search === link.to ||
                (link.to === "/colecao" && location.pathname === "/colecao" && !location.search);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "font-mono text-[10.5px] tracking-[0.22em] uppercase transition-colors duration-300 relative py-1",
                    isActive
                      ? "text-bordeaux"
                      : "text-foreground/65 hover:text-bordeaux"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
            <button
              className="p-2 text-foreground/65 hover:text-bordeaux active:scale-95 transition-all hidden sm:block"
              aria-label="Buscar"
            >
              <Search className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </button>
            <Link
              to={accountHref}
              className="p-2 text-foreground/65 hover:text-bordeaux active:scale-95 transition-all"
              aria-label="Minha conta"
            >
              <User className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-foreground/65 hover:text-bordeaux active:scale-95 transition-all"
              aria-label="Abrir sacola"
            >
              <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-bordeaux text-maison-creme text-[9px] flex items-center justify-center font-mono tabular-nums">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-card flex flex-col items-center justify-center md:hidden pt-16"
          >
            <SollarisSeal size={56} tone="bordeaux" className="mb-10" />
            <nav className="flex flex-col items-center gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="font-display text-[26px] tracking-[0.04em] text-foreground active:text-bordeaux"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: navLinks.length * 0.05 + 0.1 }}
                className="pt-6"
              >
                <Link
                  to={accountHref}
                  onClick={() => setMenuOpen(false)}
                  className="font-mono text-[11px] uppercase tracking-[0.26em] text-bordeaux border-b border-bordeaux/40 pb-1"
                >
                  {user ? "Minha Conta" : "Entrar / Cadastrar"}
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
