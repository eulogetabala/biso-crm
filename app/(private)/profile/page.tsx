"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  ShieldAlert,
  Phone,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/src/providers";
import { toast } from "sonner";
import { updatePassword, updateProfile } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, getDb } from "@/src/firebase";

const profileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire"),
  lastName: z.string().min(1, "Le nom est obligatoire"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional().or(z.literal("")),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, firebaseUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSaveProfile(values: ProfileFormValues) {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(getDb(), "users", user.id), {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        updatedAt: serverTimestamp(),
      });
      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName: `${values.firstName} ${values.lastName}` });
      }
      toast.success("Profil mis à jour");
    } catch { toast.error("Erreur lors de la mise à jour"); }
    finally { setSaving(false); }
  }

  async function onChangePassword(values: PasswordFormValues) {
    if (!firebaseUser) return;
    setChangingPwd(true);
    try {
      await updatePassword(firebaseUser, values.password);
      toast.success("Mot de passe modifié");
      passwordForm.reset();
    } catch { toast.error("Erreur. Reconnectez-vous puis réessayez."); }
    finally { setChangingPwd(false); }
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-lg font-bold">Profil non disponible</h2>
          <p className="text-sm text-muted-foreground">Vous devez être connecté.</p>
        </div>
      </PageContainer>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Mon profil" description="Gérez vos informations personnelles." />

        {/* Avatar */}
        <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardContent className="flex items-center gap-5 p-6">
            <Avatar className="h-16 w-16 ring-4 ring-border/30">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-muted-foreground">{user.role === "admin" ? "Administrateur" : "Employé"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel>Nom</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={profileForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />Email</FormLabel>
                    <FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" disabled {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />Téléphone</FormLabel>
                    <FormControl><Input className="h-11 rounded-xl border-border/50 bg-white shadow-sm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <FormField control={passwordForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Nouveau mot de passe</FormLabel><FormControl><Input type="password" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirmer</FormLabel><FormControl><Input type="password" className="h-11 rounded-xl border-border/50 bg-white shadow-sm" placeholder="••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={changingPwd} variant="outline" className="h-11 gap-2 rounded-xl border-border/50 shadow-sm">
                    {changingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {changingPwd ? "Modification..." : "Changer le mot de passe"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}
