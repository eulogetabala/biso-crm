"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  User,
  Mail,
  Building2,
  MapPin,
  Tag,
  MessageSquare,
  Save,
  Loader2,
  ShieldAlert,
  Search,
} from "lucide-react";
import { PageContainer, Breadcrumb, Loader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { clientSchema, type ClientFormValues } from "@/src/schemas";
import { ClientRepository } from "@/src/repositories";
import { ClientService } from "@/src/services";
import { useAuth } from "@/src/providers";
import { CUSTOMER_TYPES, SOURCES, COUNTRIES, ROUTES } from "@/src/constants";
import { toast } from "sonner";
import Link from "next/link";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    (async () => {
      try {
        const c = await ClientRepository.getById(id);
        if (!c) { setNotFound(true); return; }
        form.reset({
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          email: c.email ?? "",
          company: c.company ?? "",
          address: c.address ?? "",
          city: c.city ?? "",
          country: c.country ?? "CG",
          customerType: c.customerType,
          source: c.source,
          notes: "",
        });
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [id, form]);

  async function onSubmit(values: ClientFormValues) {
    if (!user) return;
    setSubmitting(true);
    try {
      await ClientService.update(id, values, user.id);
      toast.success("Client mis à jour");
      router.push(ROUTES.private.clients.detail(id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageContainer><Loader /></PageContainer>;

  if (notFound) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-lg font-bold">Client introuvable</h2>
          <Link href={ROUTES.private.clients.list}>
            <Button variant="outline" className="mt-2 rounded-xl">Retour à la liste</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-3xl space-y-6">
        <Breadcrumb items={[
          { label: "Clients", href: ROUTES.private.clients.list },
          { label: form.watch("firstName") ? `${form.watch("firstName")} ${form.watch("lastName")}` : "Client", href: ROUTES.private.clients.detail(id) },
          { label: "Modifier" },
        ]} />

        <div className="space-y-0.5">
          <h1 className="text-2xl font-extrabold tracking-tight">Modifier le client</h1>
          <p className="text-sm text-muted-foreground">
            {form.watch("firstName")} {form.watch("lastName")}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Identité</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Nom *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormLabel className="text-sm font-medium leading-none mb-2 block">Téléphone *</FormLabel>
                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field }) => (
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="CG"
                        placeholder="06 123 45 67"
                        value={field.value}
                        onChange={field.onChange}
                        className="[&_.PhoneInputInput]:h-11 [&_.PhoneInputInput]:rounded-xl [&_.PhoneInputInput]:border-border/50 [&_.PhoneInputInput]:bg-white [&_.PhoneInputInput]:pl-3 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:shadow-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputCountry]:rounded-xl [&_.PhoneInputCountry]:border [&_.PhoneInputCountry]:border-border/50 [&_.PhoneInputCountry]:bg-white [&_.PhoneInputCountry]:px-3 [&_.PhoneInputCountry]:mr-2"
                      />
                    )}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive mt-1.5">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" /><Input className="h-11 rounded-xl border-border/50 bg-white pl-11 shadow-sm" {...field} /></div></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem><FormLabel>Entreprise</FormLabel><FormControl><div className="relative"><Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" /><Input className="h-11 rounded-xl border-border/50 bg-white pl-11 shadow-sm" {...field} /></div></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Adresse</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="sm:col-span-2"><FormLabel>Adresse</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Ville</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-border/50 bg-white shadow-sm">
                          <SelectValue>
                            {field.value && (
                              <span className="flex items-center gap-2">
                                <span>{COUNTRIES.find(c => c.code === field.value)?.flag}</span>
                                <span>{COUNTRIES.find(c => c.code === field.value)?.name}</span>
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[280px]">
                        <div className="sticky top-0 z-10 bg-popover px-2 pb-1 pt-1">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        </div>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="flex items-center gap-2">
                              <span className="text-base">{c.flag}</span>
                              <span>{c.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />Classification</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="customerType" render={({ field }) => (
                  <FormItem><FormLabel>Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 rounded-xl border-border/50 bg-white shadow-sm"><SelectValue>{CUSTOMER_TYPES[field.value as keyof typeof CUSTOMER_TYPES] ?? "Sélectionner..."}</SelectValue></SelectTrigger></FormControl><SelectContent>{Object.entries(CUSTOMER_TYPES).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="source" render={({ field }) => (
                  <FormItem><FormLabel>Source *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 rounded-xl border-border/50 bg-white shadow-sm"><SelectValue>{SOURCES[field.value as keyof typeof SOURCES] ?? "Sélectionner..."}</SelectValue></SelectTrigger></FormControl><SelectContent>{Object.entries(SOURCES).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Note interne</FormLabel><FormControl><Textarea className="min-h-[100px] rounded-xl border-border/50 bg-white shadow-sm resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Link href={ROUTES.private.clients.detail(id)}><Button type="button" variant="outline" className="h-11 rounded-xl border-border/50 shadow-sm">Annuler</Button></Link>
              <Button type="submit" disabled={submitting} className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Mise à jour...</> : <><Save className="h-4 w-4" />Enregistrer</>}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </PageContainer>
  );
}
