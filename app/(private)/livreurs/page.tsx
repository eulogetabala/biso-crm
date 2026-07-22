"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Phone,
  Bike,
  FileText,
  MapPin,
  Power,
  PowerOff,
  Download,
  Printer,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LivreurRepository } from "@/src/repositories";
import { formatPhone } from "@/src/utils";
import { ROUTES } from "@/src/constants";
import type { Livreur } from "@/src/types";
import { toast } from "sonner";
import { downloadCSV } from "@/src/utils";
import Link from "next/link";

export default function LivreursPage() {
  const router = useRouter();
  const [items, setItems] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => { (async () => { try { setItems(await LivreurRepository.getAll()); } catch { /* */ } finally { setLoading(false); } })(); }, []);

  const filtered = items.filter((l) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return `${l.firstName} ${l.lastName} ${l.phone} ${l.registrationNumber ?? ""}`.toLowerCase().includes(term);
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  async function toggleActive(l: Livreur) {
    try { await LivreurRepository.toggleActive(l.id, !l.isActive); toast.success(l.isActive ? "Désactivé" : "Activé"); setItems(await LivreurRepository.getAll()); }
    catch { toast.error("Erreur"); }
  }

  function handlePrint() { window.print(); }

  function handleExport() {
    const data = filtered.map((l) => ({
      Nom: l.lastName, Prénom: l.firstName, Téléphone: l.phone, Adresse: l.address ?? "",
      Moto: l.motorcycleBrand ?? "", Matricule: l.registrationNumber ?? "", Statut: l.isActive ? "Actif" : "Inactif",
    }));
    downloadCSV(data, "livreurs-biso");
  }

  return (
    <PageContainer>
      <PageHeader title="Livreurs" description={`${filtered.length} livreur${filtered.length > 1 ? "s" : ""}`}>
        <Link href={ROUTES.private.livreurs.new} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]">
          <UserPlus className="h-4 w-4" />Ajouter
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><EmptyState icon={Bike} title={search ? "Aucun résultat" : "Aucun livreur"} description={search ? `Aucun livreur ne correspond à "${search}".` : "Ajoutez votre premier livreur."} actionLabel={search ? undefined : "Ajouter un livreur"} onAction={search ? undefined : () => router.push(ROUTES.private.livreurs.new)} /></motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/40 bg-white/80 shadow-sm overflow-hidden"><CardContent className="p-0">
              {paginated.map((l) => {
                const initials = `${l.firstName[0]}${l.lastName[0]}`;
                return (
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-10 w-10 ring-2 ring-border/20"><AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-xs font-bold text-blue-600">{initials}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <Link href={ROUTES.private.livreurs.detail(l.id)} className="text-sm font-semibold hover:text-primary transition-colors">{l.firstName} {l.lastName}</Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formatPhone(l.phone)}</span>
                        {l.motorcycleBrand && <span className="flex items-center gap-1"><Bike className="h-3 w-3" />{l.motorcycleBrand}</span>}
                        {l.registrationNumber && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{l.registrationNumber}</span>}
                      </div>
                    </div>
                    <Badge variant={l.isActive ? "secondary" : "outline"} className="text-xs">{l.isActive ? "Actif" : "Inactif"}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(l)}>{l.isActive ? <PowerOff className="h-4 w-4 text-amber-500" /> : <Power className="h-4 w-4 text-emerald-500" />}</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(ROUTES.private.livreurs.detail(l.id))}>Voir</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(ROUTES.private.livreurs.edit(l.id))}>Modifier</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
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
