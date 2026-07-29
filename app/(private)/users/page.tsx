"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Loader2,
  Power,
  PowerOff,
  Users,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  Shield,
  Save,
  Search,
  X,
  ShieldAlert,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserRepository } from "@/src/repositories";
import { useAuth } from "@/src/providers";
import { ROUTES, ROLES, PAGINATION } from "@/src/constants";
import type { User as UserType } from "@/src/types";
import { userSchema, type UserFormValues } from "@/src/schemas";
import { toast } from "sonner";

const API_KEY = "AIzaSyAgxUuP_1S0xBjN8stO7mZMJmj9rqCX68g";

export default function UsersPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "employee",
    },
  });

  useEffect(() => {
    if (role !== "admin") { router.replace(ROUTES.private.dashboard); return; }
    loadUsers();
  }, [role, router]);

  async function loadUsers() {
    try { setUsers(await UserRepository.getAll()); } catch { /* */ }
    finally { setLoading(false); }
  }

  async function toggleUser(user: UserType) {
    try {
      await UserRepository.toggleActive(user.id, !user.isActive);
      toast.success(user.isActive ? "Utilisateur désactivé" : "Utilisateur activé");
      await loadUsers();
    } catch { toast.error("Erreur"); }
  }

  async function createUser(values: UserFormValues) {
    setCreating(true);
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password, returnSecureToken: false }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const idToken = data.idToken;
      const uid = data.localId;

      await fetch(`https://firestore.googleapis.com/v1/projects/connecthub-f4ef1/databases/(default)/documents/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          fields: {
            id: { stringValue: uid },
            firstName: { stringValue: values.firstName },
            lastName: { stringValue: values.lastName },
            email: { stringValue: values.email },
            role: { stringValue: values.role },
            isActive: { booleanValue: true },
            createdAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      });

      toast.success("Utilisateur créé");
      form.reset();
      setDialogOpen(false);
      setUsers((prev) => [
        {
          id: uid,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: values.role,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setCreating(false); }
  }

  if (role !== "admin") return null;

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return `${u.firstName} ${u.lastName} ${u.email} ${ROLES[u.role]}`.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginated = filteredUsers.slice(page * pageSize, (page + 1) * pageSize);

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
        <PageHeader
          title="Utilisateurs"
          description={`${users.length} utilisateur${users.length > 1 ? "s" : ""} — ${activeCount} actif${activeCount > 1 ? "s" : ""}, ${adminCount} administrateur${adminCount > 1 ? "s" : ""}`}
        >
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </PageHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Rechercher par nom, email, rôle..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="h-11 rounded-xl border-border/50 bg-white pl-11 text-sm shadow-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(0); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" exit={{ opacity: 0 }}>
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4">
                        <div className="h-10 w-10 rounded-xl bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/3 rounded bg-muted" />
                          <div className="h-3 w-1/2 rounded bg-muted" />
                        </div>
                        <div className="h-6 w-20 rounded bg-muted" />
                        <div className="h-6 w-14 rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : filteredUsers.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-12">
                  <EmptyState
                    icon={Users}
                    title={search ? "Aucun résultat" : "Aucun utilisateur"}
                    description={search ? `Aucun utilisateur ne correspond à "${search}".` : "Ajoutez votre premier utilisateur pour gérer les accès."}
                    actionLabel={search ? undefined : "Ajouter un utilisateur"}
                    onAction={search ? undefined : () => setDialogOpen(true)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {paginated.map((u) => {
                      const initials = `${u.firstName[0]}${u.lastName[0]}`;
                      return (
                        <div
                          key={u.id}
                          className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 text-xs font-bold text-orange-700 ring-1 ring-orange-200/50">
                                {initials}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                  u.isActive ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] font-medium ${
                                    u.role === "admin"
                                      ? "border-purple-200 bg-purple-50 text-purple-700"
                                      : "border-sky-200 bg-sky-50 text-sky-700"
                                  }`}
                                >
                                  {u.role === "admin" && <ShieldAlert className="mr-1 h-3 w-3" />}
                                  {ROLES[u.role]}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] font-medium ${
                                    u.isActive
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-slate-50 text-slate-500"
                                  }`}
                                >
                                  {u.isActive ? "Actif" : "Inactif"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUser(u)}
                              className="rounded-lg"
                              title={u.isActive ? "Désactiver" : "Activer"}
                            >
                              {u.isActive ? (
                                <>
                                  <PowerOff className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <Power className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                                  Activer
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">Page {page + 1} sur {totalPages}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = page < 3 ? i : page + i - 2;
                      if (pageNum >= totalPages) return null;
                      return (
                        <Button key={pageNum} variant={pageNum === page ? "default" : "outline"} size="icon" className="h-8 w-8 rounded-lg text-xs font-medium" onClick={() => setPage(pageNum)}>
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, page + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-6 py-5 border-b border-border/30">
              <DialogHeader className="gap-1">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-orange-500 p-2 text-white shadow-sm shadow-orange-500/20">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Ajouter un utilisateur
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground ml-10">
                  Créez un compte pour un nouvel employé ou administrateur.
                </DialogDescription>
              </DialogHeader>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(createUser)} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    <User className="h-3.5 w-3.5" />
                    <span>Identité</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground/80">Prénom *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jean"
                              className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground/80">Nom *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Dupont"
                              className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <hr className="border-border/20" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Identifiants</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">Email *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                              type="email"
                              placeholder="jean.dupont@bisocrm.com"
                              className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white pl-11 transition-colors text-sm"
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
                        <FormLabel className="text-xs font-semibold text-foreground/80">Mot de passe *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                              type="password"
                              placeholder="Minimum 6 caractères"
                              className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white pl-11 transition-colors text-sm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <hr className="border-border/20" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Rôle</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">Rôle *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm">
                              <SelectValue placeholder="Sélectionnez un rôle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employee">Employé</SelectItem>
                            <SelectItem value="admin">Administrateur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-2 border-t border-border/30 -mx-6 -mb-6 px-6 py-4 bg-muted/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="rounded-xl h-10 px-5 font-semibold text-foreground"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl h-10 px-5 font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all text-white shadow-md shadow-orange-500/10"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        Création…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1.5" />
                        Créer l'utilisateur
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </PageContainer>
  );
}
