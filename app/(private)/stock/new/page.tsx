"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Package, ArrowLeft, Save, Loader2, DollarSign, Layers, Tag, MapPin, FileText } from "lucide-react";
import { PageContainer } from "@/components/common";
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

export default function NewStockPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<StockFormValues>({ resolver: zodResolver(stockSchema), defaultValues: { name: "", description: "", category: "", quantity: "1", unit: "", purchasePrice: "", purchaseDate: "", supplier: "", notes: "" } });

  async function onSubmit(values: StockFormValues) { if (!user) return; setSubmitting(true); try { const data = { ...values, quantity: Number(values.quantity) || 0, purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined, purchaseDate: values.purchaseDate ? new Date(values.purchaseDate) : undefined }; await StockRepository.create(data, user.id); toast.success("Article ajouté"); router.push(ROUTES.private.stock.list); } catch { toast.error("Erreur"); } finally { setSubmitting(false); } }

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-0.5"><Link href={ROUTES.private.stock.list} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-1"><ArrowLeft className="h-3.5 w-3.5" />Retour</Link><h1 className="text-2xl font-extrabold">Nouvel article</h1></div>
        <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/40 bg-white/80 shadow-sm"><CardHeader><CardTitle className="text-sm font-bold"><Package className="h-4 w-4 inline text-primary mr-2" />Détails</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Nom de l&apos;article *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="Carton, Casque..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Layers className="h-3.5 w-3.5" />Catégorie *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="Équipement, Fourniture..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Quantité *</FormLabel><FormControl><Input type="number" min="0" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unité</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="pièce, kg, litre..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="purchasePrice" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" />Prix d&apos;achat (FCFA)</FormLabel><FormControl><Input type="number" min="0" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="purchaseDate" render={({ field }) => (<FormItem><FormLabel>Date d&apos;achat</FormLabel><FormControl><Input type="date" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="supplier" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" />Fournisseur</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />Description</FormLabel><FormControl><Textarea className="min-h-[80px] rounded-xl border-border/50 bg-white shadow-sm resize-none" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea className="min-h-[80px] rounded-xl border-border/50 bg-white shadow-sm resize-none" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CardContent></Card>
          <div className="flex justify-end gap-3"><Link href={ROUTES.private.stock.list}><Button type="button" variant="outline" className="h-11 rounded-xl">Annuler</Button></Link><Button type="submit" disabled={submitting} className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Création...</> : <><Save className="h-4 w-4" />Enregistrer</>}</Button></div>
        </form></Form>
      </motion.div>
    </PageContainer>
  );
}
