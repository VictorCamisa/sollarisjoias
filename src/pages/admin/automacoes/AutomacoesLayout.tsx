import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Kanban, BookOpen, Bot, Megaphone, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const tabs = [
  { to: "/admin/automacoes", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/automacoes/leads", label: "Leads", icon: Users },
  { to: "/admin/automacoes/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/admin/automacoes/conhecimento", label: "Conhecimento", icon: BookOpen },
  { to: "/admin/automacoes/ia", label: "IA Vendedora", icon: Bot },
  { to: "/admin/automacoes/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/admin/automacoes/agendamentos", label: "Agendamentos", icon: CalendarDays },
];

const AutomacoesLayout = () => {
  const location = useLocation();

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.exact) return location.pathname === tab.to;
    return location.pathname.startsWith(tab.to);
  };

  return (
    <div className="space-y-0 -mt-2">
      {/* Sub-navigation */}
      <div className="border-b border-border bg-card/20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
        <ScrollArea className="w-full">
          <nav className="flex gap-0.5 min-w-max pb-0">
            {tabs.map((tab) => {
              const active = isActive(tab);
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.exact}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition-all border-b-2 whitespace-nowrap",
                    active
                      ? "border-accent text-accent"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      <Outlet />
    </div>
  );
};

export default AutomacoesLayout;
