import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

// Store pages
import StoreLayout from "@/components/store/StoreLayout";
import HomePage from "@/pages/HomePage";
import CollectionPage from "@/pages/CollectionPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import AboutPage from "@/pages/AboutPage";
import LookbookPage from "@/pages/LookbookPage";
import AuthPage from "@/pages/AuthPage";
import ClientProtectedRoute from "@/components/store/ClientProtectedRoute";
import AccountLayout from "@/pages/account/AccountLayout";
import AccountOverview from "@/pages/account/AccountOverview";
import AccountOrders from "@/pages/account/AccountOrders";
import AccountAddresses from "@/pages/account/AccountAddresses";
import AccountFavorites from "@/pages/account/AccountFavorites";
import SearchPage from "@/pages/SearchPage";
import CheckoutSuccessPage from "@/pages/CheckoutSuccessPage";
import CheckoutPendingPage from "@/pages/CheckoutPendingPage";
import CheckoutFailurePage from "@/pages/CheckoutFailurePage";

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
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminTarefas from "./pages/admin/AdminTarefas";
import AdminNotas from "./pages/admin/AdminNotas";
import AdminFornecedores from "./pages/admin/AdminFornecedores";
import AdminCupons from "./pages/admin/AdminCupons";
import AdminCrediario from "./pages/admin/AdminCrediario";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AutomacoesLayout from "./pages/admin/automacoes/AutomacoesLayout";
import AutomacoesOverview from "./pages/admin/automacoes/AutomacoesOverview";
import AutomacoesLeads from "./pages/admin/automacoes/AutomacoesLeads";
import AutomacoesPipeline from "./pages/admin/automacoes/AutomacoesPipeline";
import AutomacoesConhecimento from "./pages/admin/automacoes/AutomacoesConhecimento";
import AutomacoesIA from "./pages/admin/automacoes/AutomacoesIA";
import AutomacoesCampanhas from "./pages/admin/automacoes/AutomacoesCampanhas";
import AutomacoesAgendamentos from "./pages/admin/automacoes/AutomacoesAgendamentos";
import BrainNalu from "./pages/admin/BrainNalu";
import AdminEcommerce from "./pages/admin/AdminEcommerce";
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
          <BrowserRouter>
            <Routes>
              {/* Storefront */}
              <Route element={<StoreLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/colecao" element={<CollectionPage />} />
                <Route path="/produto/:id" element={<ProductDetailPage />} />
                <Route path="/sobre" element={<AboutPage />} />
                <Route path="/vitrine" element={<LookbookPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/buscar" element={<SearchPage />} />
                <Route
                  path="/conta"
                  element={
                    <ClientProtectedRoute>
                      <AccountLayout />
                    </ClientProtectedRoute>
                  }
                >
                  <Route index element={<AccountOverview />} />
                  <Route path="pedidos" element={<AccountOrders />} />
                  <Route path="enderecos" element={<AccountAddresses />} />
                  <Route path="favoritos" element={<AccountFavorites />} />
                </Route>
                <Route path="/checkout/sucesso" element={<CheckoutSuccessPage />} />
                <Route path="/checkout/pendente" element={<CheckoutPendingPage />} />
                <Route path="/checkout/falha" element={<CheckoutFailurePage />} />
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
                <Route path="clientes/:id" element={<AdminCustomerDetail />} />
                <Route path="fornecedores" element={<AdminFornecedores />} />
                <Route path="cupons" element={<AdminCupons />} />
                <Route path="crediario" element={<AdminCrediario />} />
                <Route path="tarefas" element={<AdminTarefas />} />
                <Route path="notas" element={<AdminNotas />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="automacoes" element={<AutomacoesLayout />}>
                  <Route index element={<AutomacoesOverview />} />
                  <Route path="leads" element={<AutomacoesLeads />} />
                  <Route path="pipeline" element={<AutomacoesPipeline />} />
                  <Route path="conhecimento" element={<AutomacoesConhecimento />} />
                  <Route path="ia" element={<AutomacoesIA />} />
                  <Route path="campanhas" element={<AutomacoesCampanhas />} />
                  <Route path="agendamentos" element={<AutomacoesAgendamentos />} />
                </Route>
                <Route path="ecommerce" element={<AdminEcommerce />} />
                <Route path="configuracoes" element={<AdminSettings />} />
                <Route path="brain-nalu" element={<BrainNalu />} />
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
