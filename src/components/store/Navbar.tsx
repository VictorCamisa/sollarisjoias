import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, Search, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SollarisSeal from "./SollarisSeal";

const NOTICES = [
  "Frete grátis acima de R$ 499",
  "Até 12× sem juros",
  "Garantia vitalícia Sollaris",
  "Embalagem assinada · pronta pra presentear",
];

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
  const [noticeIdx, setNoticeIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    const id = setInterval(() => setNoticeIdx((i) => (i + 1) % NOTICES.length), 3800);
    return () => clearInterval(id);
  }, []);

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
      {/* Top notice bar — rotating, single line */}
      <div className="fixed top-0 left-0 right-0 z-[51] bg-maison-bordeaux text-maison-creme h-7 flex items-center overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 w-full text-center relative h-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={noticeIdx}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-[0.22em] absolute inset-0 flex items-center justify-center px-4"
            >
              <span className="inline-block w-1 h-1 rounded-full bg-maison-gold mr-2.5 flex-shrink-0" />
              <span className="truncate">{NOTICES[noticeIdx]}</span>
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <header
        className={cn(
          "fixed top-7 left-0 right-0 z-50 transition-all duration-500",
          scrolled || menuOpen
            ? "bg-card/95 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-card/90 backdrop-blur-md border-b border-border/30"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-14 sm:h-[64px] flex items-center justify-between gap-3">
          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -ml-2 text-bordeaux active:scale-90 transition-transform"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="h-[18px] w-[18px]" strokeWidth={1.6} /> : <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />}
          </button>

          {/* Logo left on desktop */}
          <Link to="/" className="hidden md:flex items-center gap-2.5 group">
            <SollarisSeal size={30} tone="bordeaux" />
            <span className="font-display text-[16px] tracking-[0.32em] text-bordeaux">
              SOLLARIS
            </span>
          </Link>

          {/* Logo center on mobile — selo only, more refined */}
          <Link
            to="/"
            className="md:hidden flex items-center gap-2 absolute left-1/2 -translate-x-1/2"
            aria-label="Sollaris — início"
          >
            <SollarisSeal size={26} tone="bordeaux" />
            <span className="font-display text-[15px] tracking-[0.34em] text-bordeaux leading-none">
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

          {/* Right actions — grouped, bordeaux tint */}
          <div className="flex items-center ml-auto gap-0.5 sm:gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-bordeaux/70 hover:text-bordeaux active:scale-90 transition-all"
              aria-label="Buscar"
            >
              <Search className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </button>
            <Link
              to={user ? "/conta/favoritos" : "/auth"}
              className="relative p-2 text-bordeaux/70 hover:text-bordeaux active:scale-90 transition-all"
              aria-label="Favoritos"
            >
              <Heart className="h-[17px] w-[17px]" strokeWidth={1.5} />
              {favCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-bordeaux text-maison-creme text-[9px] flex items-center justify-center font-mono tabular-nums leading-none">
                  {favCount}
                </span>
              )}
            </Link>
            <Link
              to={accountHref}
              className="hidden sm:inline-flex p-2 text-bordeaux/70 hover:text-bordeaux active:scale-90 transition-all"
              aria-label="Minha conta"
            >
              <User className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-bordeaux/70 hover:text-bordeaux active:scale-90 transition-all"
              aria-label="Abrir sacola"
            >
              <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-bordeaux text-maison-creme text-[9px] flex items-center justify-center font-mono tabular-nums leading-none">
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

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-card/95 backdrop-blur-xl flex items-start justify-center pt-32 px-6"
            onClick={() => setSearchOpen(false)}
          >
            <motion.form
              onSubmit={submitSearch}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl relative"
            >
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-bordeaux" strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar peças, materiais, pedras…"
                className="w-full bg-transparent border-b-2 border-bordeaux/30 focus:border-bordeaux pl-10 pr-12 py-4 text-xl font-display text-foreground placeholder:text-foreground/40 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-foreground/50 hover:text-bordeaux"
                aria-label="Fechar busca"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40 mt-3">
                Pressione Enter para buscar
              </p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
