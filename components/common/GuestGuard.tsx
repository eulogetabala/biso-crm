"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/providers";
import { ROUTES } from "@/src/constants";
import { Loader } from "@/components/common";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && firebaseUser) {
      router.replace(ROUTES.private.dashboard);
    }
  }, [firebaseUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size={32} />
      </div>
    );
  }

  if (firebaseUser) return null;

  return <>{children}</>;
}
