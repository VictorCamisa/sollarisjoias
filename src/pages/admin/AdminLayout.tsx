import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, FolderOpen, Settings, LogOut, ShoppingCart,
  Mail, Menu, X, Users, DollarSign, ListTodo, StickyNote, Truck, Ticket,
  ChevronLeft, ChevronRight, Store, Megaphone, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navGroups = [
  {
    label: "Principal",
    items: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
      { to: "/admin/pedidos", icon: ShoppingCart, label: "Pedidos" },
      { to: "/admin/produtos", icon: Package, label: "Produtos" },
      { to: "/admin/categorias", icon: FolderOpen, label: "Categorias" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/admin/financeiro", icon: DollarSign, label: "Financeiro" },
      { to: "/admin/clientes", icon: Users, label: "Clientes" },
      { to: "/admin/fornecedores", icon: Truck, label: "Fornecedores" },
      { to: "/admin/cupons", icon: Ticket, label: "Cupons" },
    ],
  },
  {
    label: "Operacional",
    items: [
      { to: "/admin/tarefas", icon: ListTodo, label: "Tarefas" },
      { to: "/admin/notas", icon: StickyNote, label: "Notas" },
      { to: "/admin/newsletter", icon: Mail, label: "Newsletter" },
    ],
  },
  {
    label: "Crescimento",
    items: [
      { to: "/admin/marketing", icon: Megaphone, label: "Marketing" },
      { to: "/admin/automacoes", icon: Zap, label: "Automações" },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

const AdminLayout = () => {
  const { isAdmin, loading, signOut, user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground text-xs tracking-widest uppercase">Carregando</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const isActive = (item: typeof allItems[0]) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  const currentPage = allItems.find((item) => isActive(item));

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-background">
        {/* ══ Desktop Sidebar ══ */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r border-border bg-card/50 transition-all duration-300 relative",
            collapsed ? "w-[68px]" : "w-[240px]"
          )}
        >
          {/* Logo */}
          <div className={cn("flex items-center h-14 border-b border-border px-4", collapsed && "justify-center")}>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Store className="h-4 w-4 text-accent" />
              </div>
              {!collapsed && (
                <span className="font-serif text-sm tracking-[0.2em] text-foreground group-hover:text-accent transition-colors">
                  SOLLARIS
                </span>
              )}
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-2">
                {!collapsed && (
                  <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5 px-2">
                  {group.items.map((item) => {
                    const active = isActive(item);
                    const linkContent = (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                          collapsed ? "h-9 w-9 justify-center mx-auto" : "px-3 py-1.5",
                          active
                            ? "bg-accent/10 text-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 flex-shrink-0", active && "text-accent")} />
                        {!collapsed && <span>{item.label}</span>}
                        {active && !collapsed && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.to}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return linkContent;
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-2">
            {/* Settings */}
            {(() => {
              const settingsActive = location.pathname === "/admin/configuracoes";
              const settingsLink = (
                <Link
                  to="/admin/configuracoes"
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 mb-1",
                    collapsed ? "h-10 w-10 justify-center mx-auto" : "px-3 py-2",
                    settingsActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>Configurações</span>}
                </Link>
              );
              if (collapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">Configurações</TooltipContent>
                  </Tooltip>
                );
              }
              return settingsLink;
            })()}

            {/* User + Sign out */}
            <div className={cn(
              "flex items-center gap-2.5 rounded-lg",
              collapsed ? "justify-center p-2" : "px-3 py-2"
            )}>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground/80">
                    {user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">Admin</p>
                </div>
              )}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Sair</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-16 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm z-10"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </aside>

        {/* ══ Mobile Header ══ */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 h-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center">
                <Store className="h-3.5 w-3.5 text-accent" />
              </div>
              <span className="font-serif text-xs tracking-[0.15em]">SOLLARIS</span>
            </Link>
            <div className="flex items-center gap-2">
              {currentPage && (
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {currentPage.label}
                </span>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg hover:bg-secondary/50 transition"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ══ Mobile Menu ══ */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-0 z-40 bg-background/98 backdrop-blur-xl pt-12"
            >
              <nav className="p-4 space-y-6 overflow-y-auto h-full pb-20">
                {navGroups.map((group) => (
                  <div key={group.label}>
                    <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition",
                            isActive(item)
                              ? "bg-accent/10 text-accent"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                          {isActive(item) && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="border-t border-border pt-4 space-y-1">
                  <Link
                    to="/admin/configuracoes"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition"
                  >
                    <Settings className="h-4 w-4" /> Configurações
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive transition w-full"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Main Content ══ */}
        <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          {/* Desktop Header */}
          <header className="hidden md:flex items-center h-14 border-b border-border px-8 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/admin" className="text-muted-foreground hover:text-foreground transition text-xs">
                Admin
              </Link>
              {currentPage && currentPage.to !== "/admin" && (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-foreground font-medium text-xs">{currentPage.label}</span>
                </>
              )}
              {currentPage?.to === "/admin" && (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-foreground font-medium text-xs">Dashboard</span>
                </>
              )}
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-14 md:pt-6">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;
