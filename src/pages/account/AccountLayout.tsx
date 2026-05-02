import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Package, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const links = [
  { to: "/conta", label: "Visão Geral", icon: User, end: true },
  { to: "/conta/pedidos", label: "Pedidos", icon: Package, end: false },
  { to: "/conta/enderecos", label: "Endereços", icon: MapPin, end: false },
];

const AccountLayout = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
  };

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10 sm:mb-14 pb-8 border-b border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bordeaux mb-3">
            Minha Conta
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground tracking-tight">
            Olá, {user?.user_metadata?.full_name?.split(" ")[0] || "cliente"}
          </h1>
          <p className="font-sans text-foreground/65 mt-2 text-sm">{user?.email}</p>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-10 sm:gap-14">
          {/* Sidebar */}
          <aside>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-bordeaux text-maison-creme"
                          : "text-foreground/65 hover:text-bordeaux hover:bg-card"
                      )
                    }
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                    {link.label}
                  </NavLink>
                );
              })}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/55 hover:text-destructive transition-colors mt-2 whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />
                Sair
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
