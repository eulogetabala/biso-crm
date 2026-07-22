"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Package,
  Archive,
  DollarSign,
  Layers,
  Download,
  Printer,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StockRepository } from "@/src/repositories";
import { downloadCSV } from "@/src/utils";
import { ROUTES } from "@/src/constants";
import type { StockItem } from "@/src/types";
import { toast } from "sonner";
import Link from "next/link";

export default function StockPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => { (async () => { try { setItems(await StockRepository.getAll()); } catch { /* */ } finally { setLoading(false); } })(); }, []);

  const filtered = items.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return `${s.name} ${s.category} ${s.supplier ?? ""}`.toLowerCase().includes(term);
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  async function handleArchive(s: StockItem) {
    try { await StockRepository.archive(s.id, "system"); toast.success("Archivé"); setItems(await StockRepository.getAll()); }
    catch { toast.error("Erreur"); }
  }

  function handlePrint() { window.print(); }

  function handleExport() {
    const data = filtered.map((s) => ({
      Nom: s.name, Catégorie: s.category, Quantité: s.quantity, Unité: s.unit ?? "",
      "Prix d'achat": s.purchasePrice ?? "", Fournisseur: s.supplier ?? "",
    }));
    downloadCSV(data, "stock-biso");
  }

  const totalValue = filtered.reduce((sum, s) => sum + (s.purchasePrice ?? 0) * s.quantity, 0);

  return (
    <PageContainer>
      <PageHeader title="Stock" description={`${filtered.length} article${filtered.length > 1 ? "s" : ""} · Valeur totale : ${totalValue.toLocaleString("fr-FR")} FCFA`}>
        <Link href={ROUTES.private.stock.new} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]">
          <Plus className="h-4 w-4" />Ajouter
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="h-11 rounded-xl border-border/50 bg-white pl-11 text-sm shadow-sm" />
          {search && <button onClick={() => { setSearch(""); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-10 gap-2 rounded-xl"><Printer className="h-4 w-4" />Imprimer</Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-10 gap-2 rounded-xl"><Download className="h-4 w-4" />CSV</Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <Card className="border-border/40 bg-white/80 shadow-sm"><CardContent className="p-0">{[1,2,3,4,5].map(i => <div key={i} className="flex animate-pulse items-center gap-4 px-5 py-4 border-b border-border/20"><div className="h-10 w-10 rounded-full bg-muted" /><div className="flex-1 space-y-1.5"><div className="h-4 w-32 rounded bg-muted" /><div className="h-3 w-24 rounded bg-muted" /></div></div>)}</CardContent></Card>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><EmptyState icon={Package} title={search ? "Aucun résultat" : "Stock vide"} description={search ? `Aucun article ne correspond à "${search}".` : "Ajoutez votre premier article."} actionLabel={search ? undefined : "Ajouter un article"} onAction={search ? undefined : () => router.push(ROUTES.private.stock.new)} /></motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/40 bg-white/80 shadow-sm overflow-hidden"><CardContent className="p-0">
              {paginated.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/10"><Package className="h-5 w-5 text-violet-600" /></div>
                  <div className="flex-1 min-w-0">
                    <Link href={ROUTES.private.stock.detail(s.id)} className="text-sm font-semibold hover:text-primary transition-colors">{s.name}</Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{s.category}</span>
                      <span>Qté: {s.quantity} {s.unit}</span>
                      {s.purchasePrice && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{s.purchasePrice.toLocaleString("fr-FR")} FCFA</span>}
                    </div>
                  </div>
                  <Badge variant={s.isArchived ? "outline" : "secondary"} className="text-xs">{s.isArchived ? "Archivé" : "Actif"}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(ROUTES.private.stock.detail(s.id))}>Voir</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(ROUTES.private.stock.edit(s.id))}>Modifier</DropdownMenuItem>
                      {!s.isArchived && <DropdownMenuItem onClick={() => handleArchive(s)} className="text-destructive"><Archive className="mr-2 h-4 w-4" />Archiver</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent></Card>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">Page {page + 1} sur {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
