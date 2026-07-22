"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/src/providers";

interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <header className="flex h-[60px] items-center justify-between border-b border-border/40 bg-card/60 px-4 backdrop-blur-xl lg:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8 rounded-lg">
        <Menu className="h-[18px] w-[18px]" />
      </Button>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {user?.firstName} {user?.lastName}
        </span>
        <Avatar className="h-8 w-8 ring-2 ring-border/40">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-[11px] font-bold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
