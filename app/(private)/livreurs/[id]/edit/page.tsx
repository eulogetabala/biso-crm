"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { User, Bike, FileText, MapPin, Save, Loader2, ShieldAlert } from "lucide-react";
import { PageContainer, Breadcrumb, Loader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { livreurSchema, type LivreurFormValues } from "@/src/schemas";
import { LivreurRepository } from "@/src/repositories";
import { useAuth } from "@/src/providers";
import { ROUTES } from "@/src/constants";
import { toast } from "sonner";
import Link from "next/link";

export default function EditLivreurPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nf, setNf] = useState(false);
  const form = useForm<LivreurFormValues>({ resolver: zodResolver(livreurSchema) });

  useEffect(() => { (async () => { try { const l = await LivreurRepository.getById(id); if (!l) { setNf(true); return; } form.reset({ firstName: l.firstName, lastName: l.lastName, phone: l.phone, address: l.address ?? "", motorcycleBrand: l.motorcycleBrand ?? "", registrationNumber: l.registrationNumber ?? "" }); } catch { setNf(true); } finally { setLoading(false); } })(); }, [id, form]);

  async function onSubmit(values: LivreurFormValues) { if (!user) return; setSubmitting(true); try { await LivreurRepository.update(id, values, user.id); toast.success("Mis à jour"); router.push(ROUTES.private.livreurs.detail(id)); } catch { toast.error("Erreur"); } finally { setSubmitting(false); } }

  if (loading) return <PageContainer><Loader /></PageContainer>;
  if (nf) return <PageContainer><div className="flex flex-col items-center gap-3 py-20 text-center"><ShieldAlert className="h-10 w-10 text-muted-foreground/50" /><h2 className="text-lg font-bold">Introuvable</h2><Link href={ROUTES.private.livreurs.list}><Button variant="outline" className="mt-2 rounded-xl">Retour</Button></Link></div></PageContainer>;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <Breadcrumb items={[{ label: "Livreurs", href: ROUTES.private.livreurs.list }, { label: `${form.watch("firstName")} ${form.watch("lastName")}`, href: ROUTES.private.livreurs.detail(id) }, { label: "Modifier" }]} />
        <h1 className="text-2xl font-extrabold">Modifier le livreur</h1>
        <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/40 bg-white/80 shadow-sm"><CardHeader><CardTitle className="text-sm font-bold"><User className="h-4 w-4 inline text-primary mr-2" />Identité</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><FormField control={form.control} name="lastName" render={({ field: f }) => (<FormItem><FormLabel>Nom *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...f} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="firstName" render={({ field: f }) => (<FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...f} /></FormControl><FormMessage /></FormItem>)} /></CardContent></Card>
          <Card className="border-border/40 bg-white/80 shadow-sm"><CardHeader><CardTitle className="text-sm font-bold"><Bike className="h-4 w-4 inline text-primary mr-2" />Contact & Moto</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><FormLabel className="text-sm font-medium mb-2 block">Téléphone *</FormLabel><Controller name="phone" control={form.control} render={({ field: f }) => (<PhoneInput international countryCallingCodeEditable={false} defaultCountry="CG" value={f.value} onChange={f.onChange} className="[&_.PhoneInputInput]:h-11 [&_.PhoneInputInput]:rounded-xl [&_.PhoneInputInput]:border-border/50 [&_.PhoneInputInput]:bg-white [&_.PhoneInputInput]:pl-3 [&_.PhoneInputInput]:text-sm [&_.PhoneInputCountry]:rounded-xl [&_.PhoneInputCountry]:border [&_.PhoneInputCountry]:border-border/50 [&_.PhoneInputCountry]:bg-white [&_.PhoneInputCountry]:px-3 [&_.PhoneInputCountry]:mr-2" />)} />{form.formState.errors.phone && <p className="text-sm text-destructive mt-1.5">{form.formState.errors.phone.message}</p>}</div><FormField control={form.control} name="address" render={({ field: f }) => (<FormItem className="sm:col-span-2"><FormLabel><MapPin className="h-3.5 w-3.5 inline mr-1" />Adresse</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...f} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="motorcycleBrand" render={({ field: f }) => (<FormItem><FormLabel><Bike className="h-3.5 w-3.5 inline mr-1" />Marque moto</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...f} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="registrationNumber" render={({ field: f }) => (<FormItem><FormLabel><FileText className="h-3.5 w-3.5 inline mr-1" />Matricule</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...f} /></FormControl><FormMessage /></FormItem>)} /></CardContent></Card>
          <div className="flex justify-end gap-3"><Link href={ROUTES.private.livreurs.detail(id)}><Button type="button" variant="outline" className="h-11 rounded-xl">Annuler</Button></Link><Button type="submit" disabled={submitting} className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Mise à jour...</> : <><Save className="h-4 w-4" />Enregistrer</>}</Button></div>
        </form></Form>
      </motion.div>
    </PageContainer>
  );
}
