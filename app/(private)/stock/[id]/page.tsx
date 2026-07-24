"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Layers, Tag, Pencil, ShieldAlert } from "lucide-react";
import { PageContainer, Breadcrumb, Loader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockRepository } from "@/src/repositories";
import { ROUTES } from "@/src/constants";
import type { StockItem } from "@/src/types";
import Link from "next/link";

export default function StockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [s, setS] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { setS(await StockRepository.getById(id)); } catch { /* */ } finally { setLoading(false); } })(); }, [id]);

  if (loading) return <PageContainer><Loader /></PageContainer>;
  if (!s) return <PageContainer><div className="flex flex-col items-center gap-3 py-20 text-center"><ShieldAlert className="h-10 w-10 text-muted-foreground/50" /><h2 className="text-lg font-bold">Introuvable</h2><Link href={ROUTES.private.stock.list}><Button variant="outline" className="mt-2 rounded-xl">Retour</Button></Link></div></PageContainer>;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <Breadcrumb items={[{ label: "Stock", href: ROUTES.private.stock.list }, { label: s.name }]} />
        <div className="flex items-center justify-between">
          <div><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/10"><Package className="h-6 w-6 text-violet-600" /></div><div><h1 className="text-2xl font-extrabold">{s.name}</h1><Badge variant={s.isArchived ? "outline" : "secondary"} className="mt-1 text-xs">{s.isArchived ? "Archivé" : "Actif"}</Badge></div></div></div>
          <Link href={ROUTES.private.stock.edit(s.id)}><Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl"><Pencil className="h-4 w-4" />Modifier</Button></Link>
        </div>
        <Card className="border-border/40 bg-white/80 shadow-sm"><CardHeader><CardTitle className="text-sm font-bold">Informations</CardTitle></CardHeader><CardContent className="space-y-2">
          <Row icon={Layers} label="Catégorie" value={s.category} />
          <Row icon={Package} label="Quantité" value={`${s.quantity} ${s.unit ?? ""}`} />
          {s.purchasePrice && <Row label="Prix d'achat" value={`${s.purchasePrice.toLocaleString("fr-FR")} FCFA`} />}
          {s.supplier && <Row icon={Tag} label="Fournisseur" value={s.supplier} />}
          {s.description && <Row icon={FileText} label="Description" value={s.description} />}
        </CardContent></Card>
      </motion.div>
    </PageContainer>
  );
}

function Row({ icon: Icon, label, value }: { icon?: typeof Package; label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/40">{Icon && <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>}<div><p className="text-[11px] font-medium uppercase text-muted-foreground/70">{label}</p><p className="text-sm font-medium">{value}</p></div></div>;
}
