import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, User, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SollarisSeal from "./SollarisSeal";

const navLinks = [
  { to: "/colecao", label: "Coleção" },
  { to: "/atelier", label: "Atelier" },
  { to: "/journal", label: "Journal" },
  { to: "/concierge", label: "Concierge" },
];

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  return (
    <>
      {/* Top notice bar — Maison style */}
      <div className="fixed top-0 left-0 right-0 z-[51] bg-maison-bordeaux text-maison-creme">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em]">
            Concierge privado · Entrega em 24h em capital · Embalagem Maison cortesia
          </p>
        </div>
      </div>

      <header
        className={cn(
          "fixed top-[28px] left-0 right-0 z-50 transition-all duration-700",
          scrolled || menuOpen
            ? "bg-maison-creme/95 backdrop-blur-xl border-b border-maison-bordeaux/10"
            : "bg-maison-creme/80 backdrop-blur-md border-b border-transparent"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-6">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -ml-2 text-foreground active:scale-95 transition-transform"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Nav links left (desktop) */}
          <nav className="hidden md:flex items-center gap-10 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "font-mono text-[10.5px] tracking-[0.28em] uppercase transition-colors duration-500 relative",
                  location.pathname.startsWith(link.to)
                    ? "text-bordeaux"
                    : "text-foreground/60 hover:text-bordeaux"
                )}
              >
                {link.label}
                {location.pathname.startsWith(link.to) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 right-0 h-px bg-bordeaux"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Logo center — selo S + wordmark */}
          <Link
            to="/"
            className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2 group"
          >
            <SollarisSeal size={36} tone="bordeaux" />
            <span className="hidden sm:block font-display text-[19px] tracking-[0.32em] text-bordeaux">
              SOLLARIS
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <button
              className="p-2 text-foreground/70 hover:text-bordeaux active:scale-95 transition-all hidden sm:block"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" strokeWidth={1.4} />
            </button>
            <Link
              to="/conta"
              className="p-2 text-foreground/70 hover:text-bordeaux active:scale-95 transition-all hidden sm:block"
              aria-label="Minha conta"
            >
              <User className="h-4 w-4" strokeWidth={1.4} />
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-foreground/70 hover:text-bordeaux active:scale-95 transition-all"
              aria-label="Abrir sacola"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.4} />
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
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 bg-creme flex flex-col items-center justify-center md:hidden"
          >
            <SollarisSeal size={64} tone="bordeaux" className="mb-12" />
            <nav className="flex flex-col items-center gap-7">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "font-display text-3xl tracking-[0.06em] transition-colors duration-300",
                      location.pathname.startsWith(link.to)
                        ? "text-bordeaux"
                        : "text-foreground active:text-bordeaux"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.08, duration: 0.5 }}
                className="pt-6"
              >
                <Link
                  to="/conta"
                  onClick={() => setMenuOpen(false)}
                  className="font-mono text-[11px] uppercase tracking-[0.28em] text-bordeaux border-b border-bordeaux/40 pb-1"
                >
                  Minha Conta
                </Link>
              </motion.div>
            </nav>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="maison-hairline-gold w-32 mt-12"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
