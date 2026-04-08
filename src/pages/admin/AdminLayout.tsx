import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, FolderOpen, Settings, LogOut, ShoppingCart,
  Mail, Menu, X, Users, DollarSign, ListTodo, StickyNote, Truck, Ticket,
  ChevronLeft, ChevronRight, Store, Megaphone, Zap, Brain,

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
          <div className="h-7 w-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground text-[10px] tracking-[0.15em] uppercase">Carregando</p>
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
          animate={{ width: collapsed ? 64 : 232 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="hidden md:flex flex-col border-r border-sidebar-border bg-sidebar relative overflow-visible flex-shrink-0"
        >
          {/* Logo */}
          <div className={cn("flex items-center h-14 border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-4")}>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Store className="h-4 w-4 text-accent" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="font-serif text-sm tracking-[0.18em] text-sidebar-foreground group-hover:text-accent transition-colors whitespace-nowrap"
                  >
                    SOLLARIS
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
            {navGroups.map((group, gi) => (
              <div key={group.label} className={cn("mb-1", gi > 0 && "mt-2")}>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-4 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                {collapsed && gi > 0 && <div className="mx-3 mb-2 border-t border-sidebar-border" />}
                <div className="space-y-0.5 px-2">
                  {group.items.map((item) => {
                    const active = isActive(item);
                    const linkEl = (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "admin-nav-item relative",
                          collapsed ? "h-9 w-9 justify-center mx-auto" : "px-3 py-[7px]",
                          active
                            ? "text-accent"
                            : "text-muted-foreground hover:text-sidebar-foreground"
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="sidebar-active"
                            className={cn(
                              "absolute inset-0 rounded-lg bg-accent/10",
                              collapsed && "inset-0"
                            )}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={cn("h-[15px] w-[15px] flex-shrink-0 relative z-10", active && "text-accent")} />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.12 }}
                              className="relative z-10 whitespace-nowrap"
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
          <div className="border-t border-sidebar-border p-2 space-y-0.5">
            {/* Settings */}
            {(() => {
              const settingsActive = location.pathname === "/admin/configuracoes";
              const settingsLink = (
                <Link
                  to="/admin/configuracoes"
                  className={cn(
                    "admin-nav-item relative",
                    collapsed ? "h-9 w-9 justify-center mx-auto" : "px-3 py-[7px]",
                    settingsActive ? "text-accent" : "text-muted-foreground hover:text-sidebar-foreground"
                  )}
                >
                  {settingsActive && (
                    <motion.div layoutId="sidebar-active" className="absolute inset-0 rounded-lg bg-accent/10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                  )}
                  <Settings className="h-[15px] w-[15px] flex-shrink-0 relative z-10" />
                  {!collapsed && <span className="relative z-10">Configurações</span>}
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
            <div className={cn("flex items-center gap-2.5 rounded-lg py-1.5", collapsed ? "justify-center px-0" : "px-3")}>
              {!collapsed && (
                <>
                  <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-accent">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate text-sidebar-foreground/80">
                      {user?.email?.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">Administrador</p>
                  </div>
                </>
              )}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={signOut}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <LogOut className="h-[15px] w-[15px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">Sair</TooltipContent>
                </Tooltip>
              ) : (
                <button onClick={signOut}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-[3.5rem] h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm z-10"
          >
            <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="h-3 w-3" />
            </motion.div>
          </button>
        </motion.aside>

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
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg hover:bg-secondary/50 transition">
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
              className="md:hidden fixed inset-0 z-40 bg-background pt-12"
            >
              <nav className="p-4 space-y-5 overflow-y-auto h-full pb-20">
                {navGroups.map((group) => (
                  <div key={group.label}>
                    <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                            isActive(item)
                              ? "bg-accent/10 text-accent"
                              : "text-muted-foreground active:bg-secondary/60"
                          )}>
                          <item.icon className="h-4 w-4" />
                          {item.label}
                          {isActive(item) && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-4 space-y-1">
                  <Link to="/admin/configuracoes" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground transition">
                    <Settings className="h-4 w-4" /> Configurações
                  </Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive transition w-full">
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Main Content ══ */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          {/* Desktop Header */}
          <header className="hidden md:flex items-center h-12 border-b border-border px-8 bg-card/20 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-1.5 text-xs">
              <Link to="/admin" className="text-muted-foreground/60 hover:text-muted-foreground transition">
                Painel
              </Link>
              {currentPage && currentPage.to !== "/admin" && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-foreground/80 font-medium">{currentPage.label}</span>
                </>
              )}
              {currentPage?.to === "/admin" && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-foreground/80 font-medium">Dashboard</span>
                </>
              )}
            </div>
          </header>

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 p-4 sm:p-6 lg:p-8 pt-14 md:pt-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;
