import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

// Store pages
import StoreLayout from "@/components/store/StoreLayout";
import HomePage from "@/pages/HomePage";
import CollectionPage from "@/pages/CollectionPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import AboutPage from "@/pages/AboutPage";
import LookbookPage from "@/pages/LookbookPage";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminTarefas from "./pages/admin/AdminTarefas";
import AdminNotas from "./pages/admin/AdminNotas";
import AdminFornecedores from "./pages/admin/AdminFornecedores";
import AdminCupons from "./pages/admin/AdminCupons";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Storefront */}
              <Route element={<StoreLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/colecao" element={<CollectionPage />} />
                <Route path="/produto/:id" element={<ProductDetailPage />} />
                <Route path="/sobre" element={<AboutPage />} />
                <Route path="/vitrine" element={<LookbookPage />} />
              </Route>

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="produtos" element={<AdminProducts />} />
                <Route path="categorias" element={<AdminCategories />} />
                <Route path="pedidos" element={<AdminOrders />} />
                <Route path="financeiro" element={<AdminFinanceiro />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
                <Route path="clientes" element={<AdminCustomers />} />
                <Route path="fornecedores" element={<AdminFornecedores />} />
                <Route path="cupons" element={<AdminCupons />} />
                <Route path="tarefas" element={<AdminTarefas />} />
                <Route path="notas" element={<AdminNotas />} />
                <Route path="configuracoes" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
