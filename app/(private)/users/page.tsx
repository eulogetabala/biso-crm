"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserPlus,
  Loader2,
  Power,
  PowerOff,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageContainer, PageHeader, Loader } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserRepository } from "@/src/repositories";
import { useAuth } from "@/src/providers";
import { ROUTES, ROLES, PAGINATION } from "@/src/constants";
import type { User as UserType } from "@/src/types";
import { toast } from "sonner";

const API_KEY = "AIzaSyAgxUuP_1S0xBjN8stO7mZMJmj9rqCX68g";

export default function UsersPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
  const [newUser, setNewUser] = useState<{ firstName: string; lastName: string; email: string; password: string; newRole: "admin" | "employee" }>({ firstName: "", lastName: "", email: "", password: "", newRole: "employee" });

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

  async function createUser() {
    setCreating(true);
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUser.email, password: newUser.password, returnSecureToken: false }),
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
            firstName: { stringValue: newUser.firstName },
            lastName: { stringValue: newUser.lastName },
            email: { stringValue: newUser.email },
            role: { stringValue: newUser.newRole },
            isActive: { booleanValue: true },
            createdAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      });

      toast.success("Utilisateur créé");
      setDialogOpen(false);
      setNewUser({ firstName: "", lastName: "", email: "", password: "", newRole: "employee" });
      await loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setCreating(false); }
  }

  if (role !== "admin") return null;

  const totalPages = Math.ceil(users.length / pageSize);
  const paginated = users.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Utilisateurs" description="Gérez les comptes du CRM.">
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter
          </Button>
        </PageHeader>

        {loading ? <Loader /> : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">Aucun utilisateur</p>
          </div>
        ) : (
          <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              {paginated.map((u) => {
                const initials = `${u.firstName[0]}${u.lastName[0]}`;
                return (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border/20 last:border-0">
                    <Avatar className="h-10 w-10 ring-2 ring-border/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="border-border/50 text-xs font-medium">
                      {ROLES[u.role]}
                    </Badge>
                    <Badge variant={u.isActive ? "secondary" : "outline"} className="text-xs">
                      {u.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => toggleUser(u)}
                      title={u.isActive ? "Désactiver" : "Activer"}
                    >
                      {u.isActive ? <PowerOff className="h-4 w-4 text-amber-500" /> : <Power className="h-4 w-4 text-emerald-500" />}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-1">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                <Button
                  key={i}
                  variant={i === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 rounded-lg text-xs"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Ajouter un utilisateur</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Créez un compte pour un nouvel employé.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Prénom</label>
                <Input className="h-10 rounded-xl border-border/50" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Nom</label>
                <Input className="h-10 rounded-xl border-border/50" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Email</label>
              <Input type="email" className="h-10 rounded-xl border-border/50" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Mot de passe</label>
              <Input type="password" className="h-10 rounded-xl border-border/50" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Rôle</label>
              <select
                className="w-full h-10 rounded-xl border border-border/50 bg-white px-3 text-sm"
                value={newUser.newRole}
                onChange={(e) => setNewUser({ ...newUser, newRole: e.target.value as "admin" | "employee" })}
              >
                <option value="employee">Employé</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={createUser} disabled={creating} className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
              {creating ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
