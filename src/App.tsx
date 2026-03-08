import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import StoreLayout from "@/components/layout/StoreLayout";
import CartDrawer from "@/components/cart/CartDrawer";
import StyleAssistant from "@/components/store/StyleAssistant";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import SearchPage from "./pages/SearchPage";
import About from "./pages/About";
import Favorites from "./pages/Favorites";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AccountLogin from "./pages/account/Login";
import AccountRegister from "./pages/account/Register";
import Account from "./pages/account/Account";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <Toaster />
            <Sonner />
            <CartDrawer />
            <StyleAssistant />
            <BrowserRouter>
              <Routes>
                {/* Storefront */}
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/produtos" element={<Products />} />
                  <Route path="/produto/:id" element={<ProductDetail />} />
                  <Route path="/novidades" element={<Products />} />
                  <Route path="/busca" element={<SearchPage />} />
                  <Route path="/sobre" element={<About />} />
                  <Route path="/favoritos" element={<Favorites />} />
                  <Route path="/conta/login" element={<AccountLogin />} />
                  <Route path="/conta/cadastro" element={<AccountRegister />} />
                  <Route path="/conta" element={<Account />} />
                </Route>

                {/* Admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="produtos" element={<AdminProducts />} />
                  <Route path="categorias" element={<AdminCategories />} />
                  <Route path="pedidos" element={<AdminOrders />} />
                  <Route path="newsletter" element={<AdminNewsletter />} />
                  <Route path="clientes" element={<AdminCustomers />} />
                  <Route path="configuracoes" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
