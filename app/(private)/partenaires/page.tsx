"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Phone, Plus, Search, Trash2, PencilLine, Handshake, X, Loader2, User, FileText, ChevronLeft, ChevronRight, Save,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { getDb } from "@/src/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { PAGINATION } from "@/src/constants";
import { partnerSchema, type PartnerFormValues } from "@/src/schemas";

interface Partner {
  id: string;
  name: string;
  type: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
}

const defaultFormValues: PartnerFormValues = {
  name: "",
  type: "partenaire",
  contactName: "",
  email: "",
  phone: "",
  notes: "",
};

export default function PartenairesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: defaultFormValues,
  });

  const loadPartners = async () => {
    setLoading(true);
    try {
      const db = getDb();
      const q = query(collection(db, "partners"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Partner, "id">),
      }));
      setPartners(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPartners();
  }, []);

  const filteredPartners = partners.filter((partner) => {
    const term = search.toLowerCase();
    return [partner.name, partner.contactName, partner.email, partner.phone, partner.notes]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });

  const paginatedPartners = filteredPartners.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredPartners.length / pageSize);

  const onSubmit = async (values: PartnerFormValues) => {
    setSaving(true);
    try {
      const db = getDb();
      const payload = {
        name: values.name.trim(),
        type: values.type,
        contactName: values.contactName?.trim() ?? "",
        email: values.email?.trim() ?? "",
        phone: values.phone?.trim() ?? "",
        notes: values.notes?.trim() ?? "",
        createdAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "partners", editingId), payload);
        toast.success("Partenaire mis à jour");
      } else {
        await addDoc(collection(db, "partners"), payload);
        toast.success("Partenaire ajouté");
      }

      form.reset(defaultFormValues);
      setEditingId(null);
      setDialogOpen(false);
      await loadPartners();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (partner: Partner) => {
    form.reset({
      name: partner.name,
      type: partner.type as PartnerFormValues["type"],
      contactName: partner.contactName,
      email: partner.email,
      phone: partner.phone,
      notes: partner.notes,
    });
    setEditingId(partner.id);
    setDialogOpen(true);
  };

  const openCreate = () => {
    form.reset(defaultFormValues);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleDelete = async (partnerId: string) => {
    const db = getDb();
    await deleteDoc(doc(db, "partners", partnerId));
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    toast.success("Partenaire supprimé");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Partenaires"
        description={`${partners.length} partenaire${partners.length > 1 ? "s" : ""} dans la base`}
      >
        <Button
          onClick={openCreate}
          className="h-10 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter un partenaire
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Rechercher par nom, contact, email, téléphone..."
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
                      <div className="h-8 w-20 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredPartners.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardContent className="p-12">
                <EmptyState
                  icon={Handshake}
                  title={search ? "Aucun résultat" : "Aucun partenaire"}
                  description={search ? `Aucun partenaire ne correspond à "${search}".` : "Ajoutez votre premier partenaire pour suivre les livraisons."}
                  actionLabel={search ? undefined : "Ajouter un partenaire"}
                  onAction={search ? undefined : openCreate}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {paginatedPartners.map((partner) => (
                    <div key={partner.id} className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 p-2.5 text-orange-700 ring-1 ring-orange-200/50">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{partner.name}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {partner.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{partner.contactName || "Contact principal non renseigné"}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {partner.email ? (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" /> {partner.email}
                              </span>
                            ) : null}
                            {partner.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" /> {partner.phone}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(partner)} className="rounded-lg">
                          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Modifier
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(partner.id)} className="rounded-lg text-destructive hover:text-destructive">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">Page {page + 1} sur {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = page < 3 ? i : page + i - 2;
                    if (pageNum >= totalPages) return null;
                    return (
                      <Button key={pageNum} variant={pageNum === page ? "default" : "outline"} size="icon" className="h-8 w-8 rounded-lg text-xs font-medium" onClick={() => setPage(pageNum)}>
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, page + 1))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog: Ajouter / Modifier */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-6 py-5 border-b border-border/30">
            <DialogHeader className="gap-1">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-orange-500 p-2 text-white shadow-sm shadow-orange-500/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {editingId ? "Modifier le partenaire" : "Nouveau partenaire"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground ml-10">
                {editingId ? "Mettez à jour les détails et coordonnées du partenaire." : "Enregistrez un nouveau partenaire pour simplifier vos livraisons."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Informations générales</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs font-semibold text-foreground/80">Nom de l'entreprise *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                              className="h-10 pl-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                              placeholder="Ex. Biso Logistics"
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="partenaire">Partenaire</SelectItem>
                            <SelectItem value="fournisseur">Fournisseur</SelectItem>
                            <SelectItem value="transporteur">Transporteur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <hr className="border-border/20" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <User className="h-3.5 w-3.5" />
                  <span>Contact & Coordonnées</span>
                </div>

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground/80">Nom du contact principal</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input
                            className="h-10 pl-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                            placeholder="Nom complet"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">Adresse Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                              type="email"
                              className="h-10 pl-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                              placeholder="contact@exemple.com"
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">N° de téléphone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                              className="h-10 pl-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                              placeholder="06 00 00 00 00"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <hr className="border-border/20" />

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Notes complémentaires</span>
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          className="rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm min-h-[80px]"
                          placeholder="Spécificités de livraison, horaires, tarifs contractuels, etc."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30 -mx-6 -mb-6 bg-muted/30 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDialogOpen(false); setEditingId(null); }}
                  className="rounded-xl h-10 px-5 font-semibold text-foreground"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl h-10 px-5 font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all text-white shadow-md shadow-orange-500/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      {editingId ? (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          Enregistrer
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1.5" />
                          Créer le partenaire
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
