"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Package, Save, Loader2, ShieldAlert, DollarSign, Layers, Tag, FileText } from "lucide-react";
import { PageContainer, Breadcrumb, Loader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { stockSchema, type StockFormValues } from "@/src/schemas";
import { StockRepository } from "@/src/repositories";
import { useAuth } from "@/src/providers";
import { ROUTES } from "@/src/constants";
import { toast } from "sonner";
import Link from "next/link";

export default function EditStockPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nf, setNf] = useState(false);
  const form = useForm<StockFormValues>({ resolver: zodResolver(stockSchema) });

  useEffect(() => { (async () => { try { const s = await StockRepository.getById(id); if (!s) { setNf(true); return; } form.reset({ name: s.name, description: s.description ?? "", category: s.category, quantity: String(s.quantity), unit: s.unit ?? "", purchasePrice: s.purchasePrice ? String(s.purchasePrice) : "", purchaseDate: s.purchaseDate ? new Date(s.purchaseDate.toDate()).toISOString().slice(0, 10) : "", supplier: s.supplier ?? "", notes: s.notes ?? "" }); } catch { setNf(true); } finally { setLoading(false); } })(); }, [id, form]);

  async function onSubmit(values: StockFormValues) { if (!user) return; setSubmitting(true); try { await StockRepository.update(id, { ...values, quantity: Number(values.quantity) || 0, purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined }, user.id); toast.success("Mis à jour"); router.push(ROUTES.private.stock.detail(id)); } catch { toast.error("Erreur"); } finally { setSubmitting(false); } }

  if (loading) return <PageContainer><Loader /></PageContainer>;
  if (nf) return <PageContainer><div className="flex flex-col items-center gap-3 py-20 text-center"><ShieldAlert className="h-10 w-10 text-muted-foreground/50" /><h2 className="text-lg font-bold">Introuvable</h2><Link href={ROUTES.private.stock.list}><Button variant="outline" className="mt-2 rounded-xl">Retour</Button></Link></div></PageContainer>;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <Breadcrumb items={[{ label: "Stock", href: ROUTES.private.stock.list }, { label: form.watch("name") || "Article", href: ROUTES.private.stock.detail(id) }, { label: "Modifier" }]} />
        <h1 className="text-2xl font-extrabold">Modifier l&apos;article</h1>
        <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/40 bg-white/80 shadow-sm"><CardHeader><CardTitle className="text-sm font-bold"><Package className="h-4 w-4 inline text-primary mr-2" />Détails</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Nom *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Layers className="h-3.5 w-3.5" />Catégorie *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Quantité *</FormLabel><FormControl><Input type="number" min="0" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unité</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="purchasePrice" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" />Prix (FCFA)</FormLabel><FormControl><Input type="number" min="0" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="purchaseDate" render={({ field }) => (<FormItem><FormLabel>Date d&apos;achat</FormLabel><FormControl><Input type="date" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="supplier" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" />Fournisseur</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />Description</FormLabel><FormControl><Textarea className="min-h-[80px] rounded-xl border-border/50 bg-white shadow-sm resize-none" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea className="min-h-[80px] rounded-xl border-border/50 bg-white shadow-sm resize-none" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CardContent></Card>
          <div className="flex justify-end gap-3"><Link href={ROUTES.private.stock.detail(id)}><Button type="button" variant="outline" className="h-11 rounded-xl">Annuler</Button></Link><Button type="submit" disabled={submitting} className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Mise à jour...</> : <><Save className="h-4 w-4" />Enregistrer</>}</Button></div>
        </form></Form>
      </motion.div>
    </PageContainer>
  );
}
