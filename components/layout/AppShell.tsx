"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]">
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(280px,88vw)] border-0 p-0">
          <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} mobile />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[#fafafa]">{children}</main>
      </div>
    </div>
  );
}
