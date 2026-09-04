"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrintExportButtonsProps {
  onExport: () => void;
  onPrint?: () => void;
  exportLabel?: string;
  printLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function PrintExportButtons({
  onExport,
  onPrint,
  exportLabel = "Exporter",
  printLabel = "Imprimer",
  disabled = false,
  className,
}: PrintExportButtonsProps) {
  const handlePrint = onPrint ?? (() => window.print());

  return (
    <div className={cn("no-print flex shrink-0 flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={disabled}
        className="h-10 gap-2 rounded-xl"
      >
        <Printer className="h-4 w-4" />
        {printLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={disabled}
        className="h-10 gap-2 rounded-xl"
      >
        <Download className="h-4 w-4" />
        {exportLabel}
      </Button>
    </div>
  );
}
