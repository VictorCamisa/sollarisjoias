import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, FolderOpen, Settings, LogOut, ShoppingCart,
  Mail, Menu, X, Users, DollarSign, ListTodo, StickyNote, Truck, Ticket,
  ChevronLeft, Store, Megaphone, Zap, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navGroups = [
  {
    label: "Principal",
    items: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
      { to: "/admin/pedidos", icon: ShoppingCart, label: "Vendas" },
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
      { to: "/admin/automacoes", icon: Zap, label: "Dept. Comercial" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { to: "/admin/brain-nalu", icon: Brain, label: "Brain Sollaris" },
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
          <div className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground text-[10px] tracking-[0.14em] uppercase">Carregando</p>
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
  const initials = user?.email?.slice(0, 2).toUpperCase() || "AD";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen flex bg-background overflow-hidden">

        {/* ══ Desktop Sidebar ══ */}
        <motion.aside
          animate={{ width: collapsed ? 56 : 216 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="hidden md:flex flex-col border-r border-sidebar-border bg-sidebar relative overflow-visible flex-shrink-0"
          style={{ background: "hsl(var(--sidebar-background))" }}
        >
          {/* Logo */}
          <div className={cn(
            "flex items-center h-12 border-b border-sidebar-border/60 flex-shrink-0",
            collapsed ? "justify-center px-1" : "px-4"
          )}>
            <Link to="/" className="flex items-center gap-2.5 group min-w-0">
              <div className="h-7 w-7 rounded-md bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
                <Store className="h-3.5 w-3.5 text-accent" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="min-w-0"
                  >
                    <p className="font-serif text-[13px] tracking-[0.18em] text-sidebar-foreground group-hover:text-accent transition-colors whitespace-nowrap leading-none">
                      SOLLARIS
                    </p>
                    <p className="text-[9px] text-muted-foreground/50 tracking-[0.08em] mt-0.5 whitespace-nowrap">
                      admin
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Collapse toggle — inside logo row */}
            <AnimatePresence>
              {!collapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setCollapsed(true)}
                  className="ml-auto p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-sidebar-accent/40 transition-colors flex-shrink-0"
                  title="Recolher menu"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
            {navGroups.map((group, gi) => (
              <div key={group.label} className={cn(gi > 0 && "mt-2")}>
                {/* Group label */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50 select-none"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                {collapsed && gi > 0 && (
                  <div className="mx-3 mb-1.5 border-t border-sidebar-border/40" />
                )}

                <div className="space-y-px px-2">
                  {group.items.map((item) => {
                    const active = isActive(item);
                    const linkEl = (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "admin-nav-item relative overflow-hidden",
                          collapsed ? "h-8 w-8 justify-center mx-auto" : "px-2.5 py-[5px] w-full",
                          active
                            ? "text-accent bg-accent/10 font-semibold"
                            : "text-muted-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        {/* Left active indicator bar */}
                        {active && !collapsed && (
                          <span className="absolute left-0 inset-y-1 w-[3px] rounded-r-full bg-accent" aria-hidden="true" />
                        )}
                        <item.icon className={cn(
                          "h-[14px] w-[14px] flex-shrink-0",
                          active ? "text-accent" : "text-muted-foreground/60"
                        )} />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.1 }}
                              className="whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.to}>
                          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return <div key={item.to}>{linkEl}</div>;
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border/60 p-2 space-y-px">
            {/* Settings */}
            {(() => {
              const settingsActive = location.pathname === "/admin/configuracoes";
              const settingsLink = (
                <Link
                  to="/admin/configuracoes"
                  className={cn(
                    "admin-nav-item relative overflow-hidden",
                    collapsed ? "h-8 w-8 justify-center mx-auto" : "px-2.5 py-[5px] w-full",
                    settingsActive
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {settingsActive && !collapsed && (
                    <span className="absolute left-0 inset-y-1 w-[3px] rounded-r-full bg-accent" aria-hidden="true" />
                  )}
                  <Settings className="h-[14px] w-[14px] flex-shrink-0" />
                  {!collapsed && <span>Configurações</span>}
                </Link>
              );
              if (collapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">Configurações</TooltipContent>
                  </Tooltip>
                );
              }
              return settingsLink;
            })()}

            {/* User row */}
            <div className={cn(
              "flex items-center gap-2 rounded-md py-1.5 mt-1",
              collapsed ? "justify-center px-0" : "px-2"
            )}>
              <div className={cn(
                "rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0",
                collapsed ? "h-7 w-7" : "h-6 w-6"
              )}>
                <span className={cn("font-bold text-accent", collapsed ? "text-[10px]" : "text-[9px]")}>{initials}</span>
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-[11px] font-medium truncate text-muted-foreground/70">
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
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-[13px] w-[13px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">Sair</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={signOut}
                  className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Expand button — only visible when collapsed */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-[3.25rem] h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors z-20 shadow-sm"
              title="Expandir menu"
            >
              <ChevronLeft className="h-3 w-3 rotate-180" />
            </button>
          )}
        </motion.aside>

        {/* ══ Mobile Header ══ */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border/60">
          <div className="flex items-center justify-between px-4 h-12">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-accent/15 flex items-center justify-center">
                <Store className="h-3.5 w-3.5 text-accent" />
              </div>
              <span className="font-serif text-[12px] tracking-[0.16em] text-foreground">SOLLARIS</span>
            </Link>
            <div className="flex items-center gap-3">
              {currentPage && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {currentPage.label}
                </span>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors"
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
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="md:hidden fixed inset-0 z-40 pt-12"
              style={{ background: "hsl(var(--sidebar-background))" }}
            >
              <nav className="p-3 space-y-3 overflow-y-auto h-full pb-20">
                {navGroups.map((group) => (
                  <div key={group.label}>
                    <p className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50">
                      {group.label}
                    </p>
                    <div className="space-y-px">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors",
                            isActive(item)
                              ? "bg-accent/10 text-accent font-semibold"
                              : "text-muted-foreground/70 active:bg-sidebar-accent/60"
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="border-t border-sidebar-border/40 pt-3 space-y-px">
                  <Link
                    to="/admin/configuracoes"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-muted-foreground/70 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-muted-foreground/70 hover:text-destructive transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Main Content — no breadcrumb header, page titles own the hierarchy ══ */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          <div className="flex-1 p-4 sm:p-5 lg:p-6 pt-[3.75rem] md:pt-5">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;
