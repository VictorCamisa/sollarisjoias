import { Link } from "react-router-dom";
import { useFeaturedProducts, useCategories } from "@/hooks/useStore";
import ProductCard from "@/components/store/ProductCard";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useRef } from "react";

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const HomePage = () => {
  const { data: featured, isLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);

  const brandRef = useRef<HTMLElement>(null);
  const { scrollYProgress: brandScroll } = useScroll({
    target: brandRef,
    offset: ["start end", "end start"],
  });
  const brandY = useTransform(brandScroll, [0, 1], [40, -40]);

  return (
    <div>
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative flex items-center justify-center min-h-[85vh] px-6 overflow-hidden"
      >
        {/* Parallax background */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url(${heroBg})`,
            y: heroY,
            scale: 1.15,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-background/75" />

        <motion.div
          className="text-center max-w-3xl mx-auto relative z-10"
          style={{ opacity: heroOpacity }}
        >
          {/* Overline reveal */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "3rem" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="h-px bg-accent mx-auto mb-8 overflow-hidden"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-sans text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-8"
          >
            Semijoias Premium
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-[3rem] md:text-[5.5rem] leading-[1.02] tracking-[0.06em] text-foreground mb-8"
          >
            Curadoria com{" "}
            <span className="text-accent italic">intenção</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-12"
          >
            Cada peça existe em nosso portfólio porque foi escolhida sob
            um rigoroso olhar editorial. Exclusividade sem excessos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            <Link
              to="/colecao"
              className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.2em] uppercase border border-accent/50 px-8 py-4 text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-500 group"
            >
              Explorar Coleção
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Gold separator — animated */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "200px" }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="gold-line mx-auto"
      />

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-center mb-10"
          >
            Categorias
          </motion.p>
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={fadeSlideUp}>
                <Link
                  to={`/colecao?categoria=${cat.slug}`}
                  className="block font-sans text-[11px] tracking-[0.18em] uppercase px-6 py-3 border border-border text-muted-foreground hover:text-accent hover:border-accent transition-all duration-300"
                >
                  {cat.name}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Featured products */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              Seleção
            </p>
            <h2 className="font-serif text-display-sm text-foreground">
              Destaques
            </h2>
          </div>
          <Link
            to="/colecao"
            className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors duration-300 hidden md:flex items-center gap-2 group"
          >
            Ver tudo
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
              strokeWidth={1.5}
            />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-secondary animate-pulse" />
                <div className="h-3 w-2/3 bg-secondary animate-pulse" />
                <div className="h-3 w-1/3 bg-secondary animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {featured?.map((product) => (
              <motion.div key={product.id} variants={fadeSlideUp}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.original_price}
                  image={product.foto_frontal || product.images?.[0] || null}
                  category={(product.categories as any)?.name}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="md:hidden mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link
            to="/colecao"
            className="font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-2"
          >
            Ver coleção completa
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </motion.div>
      </section>

      {/* Brand statement — parallax */}
      <section ref={brandRef} className="py-24 px-6 overflow-hidden">
        <motion.div
          className="max-w-xl mx-auto text-center"
          style={{ y: brandY }}
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "3rem" }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="gold-line mx-auto mb-10"
          />
          <motion.blockquote
            className="font-serif text-display-sm md:text-display text-foreground leading-snug mb-6"
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Refinamento que atravessa o tempo.
          </motion.blockquote>
          <motion.p
            className="font-sans text-xs text-muted-foreground tracking-[0.15em] uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Sollaris · Alta Joalheria
          </motion.p>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
