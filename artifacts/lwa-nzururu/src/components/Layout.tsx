import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Archive,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard, roles: ["proviseur", "titulaire", "enseignant"] },
  { href: "/students", label: "Eleves", icon: GraduationCap, roles: ["proviseur", "titulaire", "secretaire"] },
  { href: "/teachers", label: "Personnel", icon: Users, roles: ["proviseur"] },
  { href: "/classes", label: "Classes", icon: BookOpen, roles: ["proviseur", "titulaire"] },
  { href: "/subjects", label: "Matieres", icon: BookOpen, roles: ["proviseur"] },
  { href: "/grades", label: "Notes", icon: ClipboardList, roles: ["proviseur", "enseignant", "titulaire"] },
  { href: "/archives", label: "Archives", icon: Archive, roles: ["proviseur"] },
  { href: "/reports", label: "Rapports PDF", icon: FileText, roles: ["proviseur", "titulaire"] },
  { href: "/settings", label: "Parametres", icon: Settings, roles: ["proviseur"] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryClient = useQueryClient();
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setUser(null);
      },
    },
  });

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const roleLabel = {
    proviseur: "Proviseur",
    enseignant: "Enseignant",
    titulaire: "Titulaire de classe",
    secretaire: "Secretaire",
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-16"
        } flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 flex-shrink-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sidebar-primary text-sm truncate">Institut Lwa-Nzururu</span>
              <span className="text-sidebar-foreground/60 text-xs truncate">Butembo, Nord-Kivu</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {sidebarOpen && isActive && <ChevronRight size={14} className="ml-auto flex-shrink-0" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {sidebarOpen ? (
            <div className="mb-2 px-2 py-1.5 rounded bg-sidebar-accent/50">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user ? roleLabel[user.role] : ""}</p>
            </div>
          ) : null}
          <button
            onClick={() => logoutMutation.mutate({ data: {} })}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors ${sidebarOpen ? "" : "justify-center"}`}
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
