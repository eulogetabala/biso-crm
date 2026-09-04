import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6 p-4 pb-8 sm:p-6", className)}>
      {children}
    </div>
  );
}
