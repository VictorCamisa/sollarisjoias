import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CartDrawer from "@/components/store/CartDrawer";
import BrainConcierge from "@/components/store/BrainConcierge";
import { initSession, trackPageview, flushPageview } from "@/lib/analytics";

const StoreLayout = () => {
  const location = useLocation();

  // Inicia a sessão uma vez
  useEffect(() => {
    initSession().catch((e) => console.warn("analytics init", e));
    return () => {
      flushPageview().catch(() => {});
    };
  }, []);

  // Pageview a cada mudança de rota
  useEffect(() => {
    trackPageview(location.pathname).catch((e) => console.warn("pageview", e));
  }, [location.pathname]);

  return (
    <div className="storefront min-h-screen min-h-[100dvh] flex flex-col bg-background overflow-x-hidden">
      <Navbar />
      <main className="flex-1 pt-[84px] sm:pt-[92px]">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <BrainConcierge />
    </div>
  );
};

export default StoreLayout;
