import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative h-8 w-8 rounded-md flex items-center justify-center",
        "text-muted-foreground hover:text-foreground hover:bg-secondary",
        "transition-colors",
        className
      )}
      title={isDark ? "Modo claro" : "Modo escuro"}
      aria-label="Alternar tema"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
