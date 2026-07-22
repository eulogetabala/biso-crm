"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Bike, FileText, MapPin, Pencil, ShieldAlert } from "lucide-react";
import { PageContainer, Breadcrumb, Loader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LivreurRepository } from "@/src/repositories";
import { formatPhone } from "@/src/utils";
import { ROUTES } from "@/src/constants";
import type { Livreur } from "@/src/types";
import Link from "next/link";

export default function LivreurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [l, setL] = useState<Livreur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { setL(await LivreurRepository.getById(id)); } catch { /* */ } finally { setLoading(false); } })(); }, [id]);

  if (loading) return <PageContainer><Loader /></PageContainer>;
  if (!l) return <PageContainer><div className="flex flex-col items-center gap-3 py-20 text-center"><ShieldAlert className="h-10 w-10 text-muted-foreground/50" /><h2 className="text-lg font-bold">Introuvable</h2><Link href={ROUTES.private.livreurs.list}><Button variant="outline" className="mt-2 rounded-xl">Retour</Button></Link></div></PageContainer>;

  const initials = `${l.firstName[0]}${l.lastName[0]}`;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <Breadcrumb items={[{ label: "Livreurs", href: ROUTES.private.livreurs.list }, { label: `${l.firstName} ${l.lastName}` }]} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-border/30"><AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-xl font-bold text-blue-600">{initials}</AvatarFallback></Avatar>
            <div><h1 className="text-2xl font-extrabold">{l.firstName} {l.lastName}</h1><Badge variant={l.isActive ? "secondary" : "outline"} className="mt-1 text-xs">{l.isActive ? "Actif" : "Inactif"}</Badge></div>
          </div>
          <Link href={ROUTES.private.livreurs.edit(l.id)}><Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl"><Pencil className="h-4 w-4" />Modifier</Button></Link>
        </div>
        <Card className="border-border/40 bg-white/80 shadow-sm">
          <CardHeader><CardTitle className="text-sm font-bold">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Row icon={Phone} label="Téléphone" value={formatPhone(l.phone)} />
            {l.address && <Row icon={MapPin} label="Adresse" value={l.address} />}
            {l.motorcycleBrand && <Row icon={Bike} label="Marque moto" value={l.motorcycleBrand} />}
            {l.registrationNumber && <Row icon={FileText} label="Matricule" value={l.registrationNumber} />}
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/40"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-[11px] font-medium uppercase text-muted-foreground/70">{label}</p><p className="text-sm font-medium">{value}</p></div></div>;
}
