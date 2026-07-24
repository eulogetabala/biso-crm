"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Tag,
  CalendarDays,
  Pencil,
  Archive,
  User,
  MessageSquare,
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  Send,
} from "lucide-react";
import { PageContainer, Breadcrumb, Loader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ClientRepository } from "@/src/repositories";
import { useAuth } from "@/src/providers";
import { formatDate, formatPhone } from "@/src/utils";
import { CUSTOMER_TYPES, SOURCES, COUNTRIES, ROUTES, hasPermission } from "@/src/constants";
import type { Client } from "@/src/types";
import { toast } from "sonner";
import Link from "next/link";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  async function loadClient() {
    try {
      const c = await ClientRepository.getById(id);
      setClient(c);
    } catch { /* not found */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadClient(); }, [id]);

  async function handleDelete() {
    if (!client) return;
    if (!confirm("Supprimer ce client ? Cette action est irréversible.")) return;
    setArchiving(true);
    try {
      await ClientRepository.delete(client.id);
      toast.success("Client supprimé");
      router.push(ROUTES.private.clients.list);
    } catch { toast.error("Erreur lors de la suppression"); }
    finally { setArchiving(false); }
  }

  async function handleAddNote() {
    if (!noteContent.trim() || !user) return;
    setAddingNote(true);
    try {
      await ClientRepository.addNote(id, noteContent.trim(), user.id);
      toast.success("Note ajoutée");
      setNoteContent("");
      await loadClient();
    } catch { toast.error("Erreur lors de l'ajout de la note"); }
    finally { setAddingNote(false); }
  }

  async function handleDeleteNote(noteId: string) {
    if (!user) return;
    setDeletingNoteId(noteId);
    try {
      await ClientRepository.deleteNote(id, noteId, user.id);
      toast.success("Note supprimée");
      await loadClient();
    } catch { toast.error("Erreur lors de la suppression"); }
    finally { setDeletingNoteId(null); }
  }

  if (loading) return <PageContainer><Loader /></PageContainer>;

  if (!client) {
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

  const initials = `${client.firstName[0]}${client.lastName[0]}`;
  const country = COUNTRIES.find((c) => c.code === client.country);

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-4xl space-y-6">
        <Breadcrumb items={[
          { label: "Clients", href: ROUTES.private.clients.list },
          { label: `${client.firstName} ${client.lastName}` },
        ]} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-border/30">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight">{client.firstName} {client.lastName}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="border-border/50 text-xs">{CUSTOMER_TYPES[client.customerType]}</Badge>
                <Badge variant="secondary" className="text-xs">{SOURCES[client.source]}</Badge>
                {client.isArchived && <Badge variant="destructive" className="text-xs">Archivé</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission(role ?? "employee", "clients:edit") && (
              <Link href={ROUTES.private.clients.edit(client.id)}>
                <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl border-border/50"><Pencil className="h-4 w-4" />Modifier</Button>
              </Link>
            )}
            {hasPermission(role ?? "employee", "clients:archive") && !client.isArchived && (
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={archiving} className="h-10 gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Supprimer
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow icon={Phone} label="Téléphone" value={formatPhone(client.phone)} />
              {client.email && <InfoRow icon={Mail} label="Email" value={client.email} />}
              {client.company && <InfoRow icon={Building2} label="Entreprise" value={client.company} />}
              {client.address && <InfoRow icon={MapPin} label="Adresse" value={client.address} />}
              {client.city && <InfoRow icon={MapPin} label="Ville" value={`${client.city}${country ? `, ${country.flag} ${country.name}` : client.country ? `, ${client.country}` : ""}`} />}
              {!client.city && country && <InfoRow icon={Globe} label="Pays" value={`${country.flag} ${country.name}`} />}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Détails</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <MetaRow icon={CalendarDays} label={`Créé le ${formatDate(client.createdAt.toDate())}`} />
                <MetaRow icon={Pencil} label={`Modifié le ${formatDate(client.updatedAt.toDate())}`} />
                <MetaRow icon={Tag} label={`${CUSTOMER_TYPES[client.customerType]} · ${SOURCES[client.source]}`} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notes */}
        <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ajouter une note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[60px] rounded-xl border-border/50 bg-white shadow-sm resize-none text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
              />
              <Button
                onClick={handleAddNote}
                disabled={addingNote || !noteContent.trim()}
                className="h-11 w-11 rounded-xl shrink-0 p-0"
                size="icon"
              >
                {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {client.notes && client.notes.length > 0 ? (
              <div className="space-y-3">
                {[...client.notes].reverse().map((note) => (
                  <div key={note.id} className="group flex items-start gap-3 rounded-xl bg-muted/30 p-3.5">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      <p className="text-[10px] text-muted-foreground/60">{formatDate(note.createdAt.toDate())}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingNoteId === note.id}
                    >
                      {deletingNoteId === note.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/70 py-6 text-center">Aucune note. Ajoutez la première.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/40">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div className="space-y-0.5 min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</p><p className="text-sm font-medium break-words">{value}</p></div>
    </div>
  );
}

function MetaRow({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs"><Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{label}</span></div>
  );
}
