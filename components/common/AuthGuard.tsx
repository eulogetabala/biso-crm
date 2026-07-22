"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader } from "@/components/common";
import { useAuth } from "@/src/providers";
import { ROUTES } from "@/src/constants";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { firebaseUser, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!firebaseUser) {
        router.replace(`${ROUTES.public.login}?redirect=${encodeURIComponent(pathname)}`);
      } else {
        setReady(true);
      }
    }
  }, [firebaseUser, isLoading, router, pathname]);

  if (isLoading || !ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
