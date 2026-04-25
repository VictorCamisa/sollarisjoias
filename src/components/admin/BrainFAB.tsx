import { Link, useLocation } from "react-router-dom";
import { Brain } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { fabVariants } from "@/lib/motion";

/**
 * Floating Action Button for Brain Sollaris.
 * Always accessible bottom-right; hides itself on the Brain route.
 */
export const BrainFAB = () => {
  const location = useLocation();
  const onBrainRoute = location.pathname.startsWith("/admin/brain-nalu");

  return (
    <AnimatePresence>
      {!onBrainRoute && (
        <motion.div
          variants={fabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed bottom-5 right-5 z-40"
        >
          <Link
            to="/admin/brain-nalu"
            aria-label="Abrir Brain Sollaris"
            title="Brain Sollaris"
          >
            <motion.div
              variants={fabVariants}
              whileHover="hover"
              whileTap="tap"
              className="h-14 w-14 rounded-full flex items-center justify-center text-accent-foreground animate-fab-pulse"
              style={{
                background: "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--sollaris-champagne-light)) 100%)",
              }}
            >
              <Brain className="h-6 w-6" strokeWidth={2.2} />
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
