"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bike,
  Package,
  Settings,
  Shield,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/src/providers";
import { ROUTES } from "@/src/constants";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const mainItems: NavItem[] = [
  { label: "Dashboard", href: ROUTES.private.dashboard, icon: LayoutDashboard },
  { label: "Clients", href: ROUTES.private.clients.list, icon: Users },
  { label: "Livreurs", href: ROUTES.private.livreurs.list, icon: Bike },
  { label: "Stock", href: ROUTES.private.stock.list, icon: Package },
];

const adminItems: NavItem[] = [
  { label: "Utilisateurs", href: ROUTES.private.users, icon: Shield },
  { label: "Paramètres", href: ROUTES.private.settings, icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavLink({ item, collapsed, isActive }: { item: NavItem; collapsed: boolean; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary-foreground")} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { role, logOut } = useAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/40 bg-card/60 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "flex h-[60px] items-center border-b border-border/40 px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && <Logo className="text-base" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeft className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          <div className="mb-2">
            {!collapsed && (
              <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Menu
              </span>
            )}
          </div>
          {mainItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={isActive(item.href)}
            />
          ))}

          {role === "admin" && (
            <>
              <div className="mb-2 mt-4">
                {!collapsed && (
                  <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Administration
                  </span>
                )}
              </div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive(item.href)}
                />
              ))}
            </>
          )}

          <div className="mb-2 mt-4">
            {!collapsed && (
              <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Compte
              </span>
            )}
          </div>
          <NavLink
            item={{ label: "Profil", href: ROUTES.private.profile, icon: User }}
            collapsed={collapsed}
            isActive={isActive(ROUTES.private.profile)}
          />
        </nav>
      </ScrollArea>

      <div className="border-t border-border/40 p-3">
        <button
          onClick={logOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
