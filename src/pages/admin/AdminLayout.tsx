import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, Package, FolderOpen, Settings, LogOut, ShoppingCart,
  Mail, Menu, X, Users, DollarSign, ListTodo, StickyNote, Truck, Ticket,
  ChevronLeft, Store, Megaphone, Zap, Briefcase, Boxes, Wallet, CreditCard,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BrainFAB } from "@/components/admin/BrainFAB";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { pageEnter, pageTransition } from "@/lib/motion";

/* ─── 4 hubs of the admin ─── */
type Hub = "comercial" | "operacao" | "financas" | "ecommerce";

const hubs: {
  key: Hub;
  label: string;
  icon: typeof Briefcase;
  colorVar: string;
  items: { to: string; icon: typeof Package; label: string }[];
}[] = [
  {
    key: "comercial",
    label: "Comercial",
    icon: Briefcase,
    colorVar: "var(--hub-comercial)",
    items: [
      { to: "/admin/pedidos", icon: ShoppingCart, label: "Vendas" },
      { to: "/admin/clientes", icon: Users, label: "Clientes" },
      { to: "/admin/marketing", icon: Megaphone, label: "Marketing" },
      { to: "/admin/automacoes", icon: Zap, label: "Dept. Comercial" },
    ],
  },
  {
    key: "operacao",
    label: "Operação",
    icon: Boxes,
    colorVar: "var(--hub-operacao)",
    items: [
      { to: "/admin/produtos", icon: Package, label: "Estoque" },
      { to: "/admin/categorias", icon: FolderOpen, label: "Categorias" },
      { to: "/admin/fornecedores", icon: Truck, label: "Fornecedores" },
      { to: "/admin/tarefas", icon: ListTodo, label: "Tarefas" },
      { to: "/admin/notas", icon: StickyNote, label: "Notas" },
      { to: "/admin/newsletter", icon: Mail, label: "Newsletter" },
    ],
  },
  {
    key: "financas",
    label: "Finanças",
    icon: Wallet,
    colorVar: "var(--hub-financas)",
    items: [
      { to: "/admin/financeiro", icon: DollarSign, label: "Financeiro" },
      { to: "/admin/crediario", icon: CreditCard, label: "Crediário" },
      { to: "/admin/cupons", icon: Ticket, label: "Cupons" },
    ],
  },
  {
    key: "ecommerce",
    label: "Ecommerce",
    icon: Globe,
    colorVar: "var(--hub-ecommerce)",
    items: [
      { to: "/admin/ecommerce", icon: Store, label: "Painel do Site" },
    ],
  },
];

const topItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
];

const allItems = [
  ...topItems,
  ...hubs.flatMap((h) => h.items),
  { to: "/admin/configuracoes", icon: Settings, label: "Configurações" },
  { to: "/admin/brain-nalu", icon: Briefcase, label: "Brain Sollaris" },
];

const AdminLayout = () => {
  const { isAdmin, loading, signOut, user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground text-[10px] tracking-[0.14em] uppercase">Carregando</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const currentPage = allItems.find((i: any) => isActive(i.to, i.exact));
  const currentHub = hubs.find((h) => h.items.some((i) => isActive(i.to)));
  const initials = user?.email?.slice(0, 2).toUpperCase() || "AD";

  /* ─── Reusable nav row ─── */
  const NavLinkRow = ({
    to, icon: Icon, label, exact, hubColor,
  }: { to: string; icon: any; label: string; exact?: boolean; hubColor?: string }) => {
    const active = isActive(to, exact);
    const el = (
      <Link
        to={to}
        className={cn(
          "admin-nav-item relative overflow-hidden",
          collapsed ? "h-9 w-9 justify-center mx-auto" : "px-2.5 py-1.5 w-full",
          active
            ? "bg-card text-foreground font-semibold shadow-notion-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70"
        )}
      >
        {active && !collapsed && (
          <span
            className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full"
            style={{ background: hubColor ? `hsl(${hubColor})` : "hsl(var(--accent))" }}
            aria-hidden
          />
        )}
        <Icon
          className={cn("h-[15px] w-[15px] flex-shrink-0")}
          style={active && hubColor ? { color: `hsl(${hubColor})` } : undefined}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="whitespace-nowrap text-[13px]"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">{el}</span>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return el;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={`${theme} h-screen flex bg-background overflow-hidden`}>

        {/* ══════════ Desktop Sidebar ══════════ */}
        <motion.aside
          animate={{ width: collapsed ? 60 : 240 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="hidden md:flex flex-col border-r border-sidebar-border bg-sidebar relative flex-shrink-0"
        >
          {/* Logo */}
          <div className={cn(
            "flex items-center h-14 border-b border-sidebar-border flex-shrink-0",
            collapsed ? "justify-center px-1" : "px-4"
          )}>
            <Link to="/" className="flex items-center gap-2.5 group min-w-0">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-accent-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--sollaris-champagne-light)) 100%)" }}
              >
                <Store className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="min-w-0 flex flex-col"
                  >
                    <span className="text-[14px] font-semibold tracking-tight text-foreground leading-none">
                      Sollaris
                    </span>
                    <span className="text-[10px] text-muted-foreground tracking-[0.12em] uppercase mt-0.5">
                      Admin
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                title="Recolher"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
            {/* Top items (Dashboard) */}
            <div className="px-2 space-y-px mb-4">
              {topItems.map((item) => (
                <NavLinkRow key={item.to} {...item} />
              ))}
            </div>

            {/* Hubs */}
            {hubs.map((hub, hi) => (
              <div key={hub.key} className={cn(hi > 0 && "mt-5")}>
                {!collapsed ? (
                  <div className="flex items-center gap-2 px-3 mb-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ background: `hsl(${hub.colorVar})` }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {hub.label}
                    </span>
                    <div className="flex-1 h-px bg-sidebar-border" />
                  </div>
                ) : (
                  hi > 0 && (
                    <div className="flex justify-center mb-2 mt-1">
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ background: `hsl(${hub.colorVar})` }}
                      />
                    </div>
                  )
                )}
                <div className="px-2 space-y-px">
                  {hub.items.map((item) => (
                    <NavLinkRow key={item.to} {...item} hubColor={hub.colorVar} />
                  ))}
                </div>
              </div>
            ))}

            {/* Settings */}
            <div className="mt-5 px-2">
              {!collapsed && (
                <div className="flex items-center gap-2 px-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Sistema
                  </span>
                  <div className="flex-1 h-px bg-sidebar-border" />
                </div>
              )}
              <NavLinkRow to="/admin/configuracoes" icon={Settings} label="Configurações" />
            </div>
          </nav>

          {/* Footer — user */}
          <div className="border-t border-sidebar-border p-2">
            <div className={cn(
              "flex items-center gap-2 rounded-md py-1.5",
              collapsed ? "justify-center px-0" : "px-2"
            )}>
              <div
                className={cn(
                  "rounded-full flex items-center justify-center flex-shrink-0 text-accent-foreground font-semibold",
                  collapsed ? "h-8 w-8 text-[11px]" : "h-7 w-7 text-[10px]"
                )}
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--sollaris-champagne-light)) 100%)" }}
              >
                {initials}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-[12px] font-medium truncate text-foreground">
                      {user?.email?.split("@")[0]}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">Sair</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Expand button */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-[3.75rem] h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors z-20 shadow-notion-sm"
              title="Expandir"
            >
              <ChevronLeft className="h-3 w-3 rotate-180" />
            </button>
          )}
        </motion.aside>

        {/* ══════════ Mobile Header ══════════ */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border">
          <div className="flex items-center justify-between px-4 h-12">
            <Link to="/" className="flex items-center gap-2.5">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center text-accent-foreground"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--sollaris-champagne-light)) 100%)" }}
              >
                <Store className="h-3.5 w-3.5" />
              </div>
              <span className="text-[13px] font-semibold tracking-tight text-foreground">Sollaris</span>
            </Link>
            <div className="flex items-center gap-2">
              {currentPage && (
                <span className="text-[11px] font-medium text-muted-foreground">{currentPage.label}</span>
              )}
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════ Mobile Menu ══════════ */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="md:hidden fixed inset-0 z-40 pt-12 bg-sidebar"
            >
              <nav className="p-3 space-y-4 overflow-y-auto h-full pb-20">
                {topItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium",
                      isActive(item.to, item.exact)
                        ? "bg-card text-foreground font-semibold shadow-notion-sm"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
                {hubs.map((hub) => (
                  <div key={hub.key}>
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${hub.colorVar})` }} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{hub.label}</p>
                    </div>
                    <div className="space-y-px">
                      {hub.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium",
                            isActive(item.to)
                              ? "bg-card text-foreground font-semibold shadow-notion-sm"
                              : "text-muted-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="border-t border-sidebar-border pt-3 space-y-px">
                  <Link
                    to="/admin/configuracoes"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-muted-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ Main Content ══════════ */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          {/* Topbar */}
          <div className="hidden md:flex items-center justify-between h-12 px-6 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[12px]">
              {currentHub && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${currentHub.colorVar})` }} />
                  <span className="text-muted-foreground">{currentHub.label}</span>
                  <span className="text-muted-foreground/50 mx-1">/</span>
                </>
              )}
              <span className="text-foreground font-medium">{currentPage?.label || "Admin"}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageEnter}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1 p-4 sm:p-5 lg:p-6 pt-[3.75rem] md:pt-5"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Brain Sollaris */}
        <BrainFAB />
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;
