import type { Variants, Transition } from "framer-motion";

/* ─── Springs ─── */
export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 26 };
export const springSnappy: Transition = { type: "spring", stiffness: 400, damping: 30 };

/* ─── Page transitions ─── */
export const pageEnter: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
export const pageTransition: Transition = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] };

/* ─── Stagger containers ─── */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

/* ─── Card hover ─── */
export const cardHover = {
  whileHover: { y: -2, transition: springSnappy },
  whileTap: { scale: 0.99 },
};

/* ─── FAB ─── */
export const fabVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { ...springSoft, delay: 0.15 } },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
  hover: { scale: 1.08, transition: springSnappy },
  tap: { scale: 0.94 },
};
