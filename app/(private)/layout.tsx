"use client";

import { AuthGuard } from "@/components/common";
import { AppShell } from "@/components/layout";
import type { ReactNode } from "react";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
