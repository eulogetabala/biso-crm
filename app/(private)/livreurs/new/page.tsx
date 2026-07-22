"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { User, Bike, FileText, MapPin, ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageContainer } from "@/components/common";
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

export default function NewLivreurPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LivreurFormValues>({
    resolver: zodResolver(livreurSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", address: "", motorcycleBrand: "", registrationNumber: "" },
  });

  async function onSubmit(values: LivreurFormValues) {
    if (!user) return;
    setSubmitting(true);
    try { await LivreurRepository.create(values, user.id); toast.success("Livreur créé"); router.push(ROUTES.private.livreurs.list); }
    catch { toast.error("Erreur"); }
    finally { setSubmitting(false); }
  }

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-0.5">
          <Link href={ROUTES.private.livreurs.list} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-1"><ArrowLeft className="h-3.5 w-3.5" />Retour</Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Nouveau livreur</h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Identité</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Nom *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="Dupont" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="Jean" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><Bike className="h-4 w-4 text-primary" />Contact & Moto</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormLabel className="text-sm font-medium mb-2 block">Téléphone *</FormLabel>
                  <Controller name="phone" control={form.control} render={({ field }) => (
                    <PhoneInput international countryCallingCodeEditable={false} defaultCountry="CG" placeholder="06 123 45 67" value={field.value} onChange={field.onChange}
                      className="[&_.PhoneInputInput]:h-11 [&_.PhoneInputInput]:rounded-xl [&_.PhoneInputInput]:border-border/50 [&_.PhoneInputInput]:bg-white [&_.PhoneInputInput]:pl-3 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:shadow-sm [&_.PhoneInputCountry]:rounded-xl [&_.PhoneInputCountry]:border [&_.PhoneInputCountry]:border-border/50 [&_.PhoneInputCountry]:bg-white [&_.PhoneInputCountry]:px-3 [&_.PhoneInputCountry]:mr-2" />
                  )} />
                  {form.formState.errors.phone && <p className="text-sm text-destructive mt-1.5">{form.formState.errors.phone.message}</p>}
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />Adresse</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="motorcycleBrand" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Bike className="h-3.5 w-3.5" />Marque moto</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="Yamaha, Honda..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />Matricule</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="CG-123-AB" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
            <div className="flex justify-end gap-3">
              <Link href={ROUTES.private.livreurs.list}><Button type="button" variant="outline" className="h-11 rounded-xl">Annuler</Button></Link>
              <Button type="submit" disabled={submitting} className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Création...</> : <><Save className="h-4 w-4" />Enregistrer</>}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </PageContainer>
  );
}
