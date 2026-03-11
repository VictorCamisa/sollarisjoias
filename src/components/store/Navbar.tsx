import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/colecao", label: "COLEÇÃO" },
  { to: "/sobre", label: "SOBRE" },
];

const Navbar = () => {
  const { totalItems, setIsOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 -ml-2 text-foreground"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Nav links left */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "font-sans text-[11px] tracking-[0.2em] uppercase transition-colors duration-300",
                location.pathname === link.to
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logo center */}
        <Link
          to="/"
          className="font-serif text-lg tracking-[0.12em] text-foreground absolute left-1/2 -translate-x-1/2"
        >
          SOLLARIS
        </Link>

        {/* Cart right */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 -mr-2 text-foreground hover:text-accent transition-colors"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] flex items-center justify-center font-sans font-medium">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block font-sans text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
