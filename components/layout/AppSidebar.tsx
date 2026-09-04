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
  Handshake,
  Truck,
  Wallet,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
  { label: "Partenaires", href: ROUTES.private.partenaires.list, icon: Handshake },
  { label: "Livraisons", href: ROUTES.private.livraisons.list, icon: Truck },
  { label: "Entrées", href: ROUTES.private.entrees.list, icon: TrendingUp },
  { label: "Dépenses", href: ROUTES.private.depenses.list, icon: Wallet },
  { label: "Stock", href: ROUTES.private.stock.list, icon: Package },
];

const adminItems: NavItem[] = [
  { label: "Utilisateurs", href: ROUTES.private.users, icon: Shield },
  { label: "Paramètres", href: ROUTES.private.settings, icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

function NavLink({ item, collapsed, isActive }: { item: NavItem; collapsed: boolean; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
        isActive
          ? "bg-white/20 text-white shadow-sm"
          : "text-orange-100/80 hover:bg-white/10 hover:text-white",
        collapsed && "justify-center px-2"
      )}
    >
      <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110")} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function AppSidebar({ collapsed, onToggle, mobile = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { role, logOut } = useAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-gradient-to-b from-orange-600 to-orange-700 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]",
        mobile && "pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-orange-500/30 px-3",
          mobile ? "min-h-[68px] px-4 py-4" : "h-[60px]",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 font-extrabold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-base tracking-tight">Biso CRM</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 rounded-lg text-orange-100/70 hover:bg-white/10 hover:text-white"
        >
          {collapsed ? (
            <PanelLeft className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
        </Button>
      </div>

      <ScrollArea className={cn("flex-1 px-3", mobile ? "py-5" : "py-4")}>
        <nav className={cn("flex flex-col", mobile ? "gap-2" : "gap-1")}>
          <div className="mb-2">
            {!collapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-orange-300/60">
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
              <div className={cn("mb-2", mobile ? "mt-6" : "mt-5")}>
                {!collapsed && (
                  <span className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-orange-300/60">
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

          <div className={cn("mb-2", mobile ? "mt-6" : "mt-5")}>
            {!collapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-orange-300/60">
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

      <div className={cn("border-t border-orange-500/30", mobile ? "p-4 pb-6" : "p-3")}>
        <button
          onClick={logOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-orange-100/80 transition-all hover:bg-red-500/20 hover:text-white",
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
