"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Building2,
  Image,
  Mail,
  Phone,
  Save,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { PageContainer, PageHeader, Loader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { settingsSchema, type SettingsFormValues } from "@/src/schemas";
import { SettingsService } from "@/src/services";
import { useAuth } from "@/src/providers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/constants";

export default function SettingsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: "",
      logo: "",
      supportEmail: "",
      supportPhone: "",
    },
  });

  useEffect(() => {
    if (role !== "admin") {
      router.replace(ROUTES.private.dashboard);
      return;
    }
    (async () => {
      try {
        const s = await SettingsService.get();
        if (s) form.reset({
          companyName: s.companyName,
          logo: s.logo ?? "",
          supportEmail: s.supportEmail ?? "",
          supportPhone: s.supportPhone ?? "",
        });
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [role, router, form]);

  async function onSubmit(values: SettingsFormValues) {
    setSaving(true);
    try {
      await SettingsService.save(values);
      toast.success("Paramètres enregistrés");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (role !== "admin") return null;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Paramètres" description="Gérez les informations de votre entreprise." />

        {loading ? (
          <Loader />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Informations de l&apos;entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l&apos;entreprise *</FormLabel>
                      <FormControl>
                        <Input placeholder="Biso Express" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="logo" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Image className="h-3.5 w-3.5" />
                        URL du logo
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="supportEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email support</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input placeholder="support@biso.com" className="h-11 rounded-xl border-border/50 bg-white pl-11 shadow-sm" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="supportPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone support</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input placeholder="+242..." className="h-11 rounded-xl border-border/50 bg-white pl-11 shadow-sm" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </motion.div>
    </PageContainer>
  );
}
