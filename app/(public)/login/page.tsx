"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react";
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
import { loginSchema, type LoginFormValues } from "@/src/schemas";
import { useAuth } from "@/src/providers";
import { ROUTES } from "@/src/constants";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      await signIn(values.email, values.password);
      toast.success("Connexion réussie");
      router.push(ROUTES.private.dashboard);
    } catch {
      toast.error("Email ou mot de passe incorrect");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Left — Branding */}
      <div className="relative hidden w-[46%] overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 lg:flex lg:flex-col lg:justify-between">
        {/* Decorative shapes */}
        <div className="absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-3 w-3 rounded-full bg-white/40" />
        <div className="absolute left-1/4 top-2/3 h-2 w-2 rounded-full bg-white/30" />
        <div className="absolute right-1/3 top-1/4 h-4 w-4 rounded-full bg-white/20" />

        <div className="relative px-12 pt-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold leading-none tracking-tight text-white">
                Biso CRM
              </h2>
              <p className="text-xs text-orange-200/70 tracking-wide">
                by Biso Express
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative px-12"
        >
          <div className="space-y-3">
            <h1 className="max-w-md text-[40px] font-extrabold leading-[1.1] tracking-tight text-white">
              Votre CRM,
              <br />
              <span className="text-orange-200">en toute simplicité.</span>
            </h1>
            <p className="max-w-sm text-[15px] leading-relaxed text-orange-100/70">
              Centralisez votre base clients, suivez votre activité et gagnez du
              temps chaque jour.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Instantané", desc: "Recherche rapide" },
              { icon: Shield, label: "Sécurisé", desc: "Données protégées" },
              { icon: TrendingUp, label: "Évolutif", desc: "Prêt à grandir" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex flex-col gap-1 rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/15"
              >
                <Icon className="h-5 w-5 text-orange-200 mb-1" />
                <span className="text-sm font-bold text-white">{label}</span>
                <span className="text-[11px] leading-tight text-orange-200/60">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative px-12 pb-10">
          <p className="text-[11px] font-medium text-orange-200/50">
            &copy; {new Date().getFullYear()} Biso Express
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex w-full items-center justify-center lg:w-[54%]">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px] px-8"
        >
          {/* Mobile logo */}
          <div className="mb-12 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Biso CRM</h2>
            </div>
          </div>

          <div className="mb-10 space-y-1.5">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
              Connexion
            </h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre espace.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <Input
                          placeholder="admin@bisoexpress.com"
                          className="h-12 rounded-xl border-border/50 bg-white pl-11 text-[15px] shadow-sm transition-shadow focus:shadow-md"
                          autoComplete="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                      Mot de passe
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-12 rounded-xl border-border/50 bg-white pl-11 pr-11 text-[15px] shadow-sm transition-shadow focus:shadow-md"
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-[15px] font-bold shadow-md transition-all hover:shadow-lg hover:brightness-105 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connexion en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-[18px] w-[18px]" />
                    Se connecter
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
