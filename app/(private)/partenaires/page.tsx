"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Building2, Mail, Phone, Plus, Search, Trash2, PencilLine, Handshake } from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDb } from "@/src/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";

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

const emptyForm = {
  id: "",
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
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setMessage("");

    try {
      const db = getDb();
      const payload = {
        name: form.name.trim(),
        type: form.type,
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      if (form.id) {
        await updateDoc(doc(db, "partners", form.id), payload);
        setMessage("Partenaire mis à jour.");
      } else {
        await addDoc(collection(db, "partners"), payload);
        setMessage("Partenaire ajouté.");
      }

      setForm(emptyForm);
      await loadPartners();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (partner: Partner) => {
    setForm({
      id: partner.id,
      name: partner.name,
      type: partner.type,
      contactName: partner.contactName,
      email: partner.email,
      phone: partner.phone,
      notes: partner.notes,
    });
  };

  const handleDelete = async (partnerId: string) => {
    const db = getDb();
    await deleteDoc(doc(db, "partners", partnerId));
    await loadPartners();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Partenaires"
        description="Gérez vos partenaires et leurs contacts de livraison"
      />

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
              <div>
                <p className="text-sm font-semibold">Liste des partenaires</p>
                <p className="text-sm text-muted-foreground">{filteredPartners.length} partenaire(s)</p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-5 text-sm text-muted-foreground">Chargement…</div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Handshake}
                  title="Aucun partenaire"
                  description="Ajoutez votre premier partenaire pour suivre les livraisons"
                />
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredPartners.map((partner) => (
                  <div key={partner.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-orange-100 p-2 text-orange-700">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{partner.name}</p>
                          <Badge variant="outline" className="text-xs">
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

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(partner)}>
                        <PencilLine className="mr-2 h-4 w-4" /> Modifier
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(partner.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-orange-600" />
              <p className="font-semibold">{form.id ? "Modifier le partenaire" : "Ajouter un partenaire"}</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Nom du partenaire</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex. Biso Logistics"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value ?? "partenaire" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partenaire">Partenaire</SelectItem>
                    <SelectItem value="fournisseur">Fournisseur</SelectItem>
                    <SelectItem value="transporteur">Transporteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contact</Label>
                <Input
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Nom du contact"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@exemple.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="06 00 00 00 00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Infos utiles sur le partenariat"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Enregistrement…" : form.id ? "Mettre à jour" : "Ajouter"}
                </Button>
                {form.id ? (
                  <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                    Annuler
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
