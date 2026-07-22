import Link from "next/link";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2 font-bold", className)}>
      <Package className="h-6 w-6" />
      <span>Biso CRM</span>
    </Link>
  );
}
