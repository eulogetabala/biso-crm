"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Plus, Truck, BarChart3, BadgeCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClientRepository } from "@/src/repositories";
import { getDb } from "@/src/firebase";
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import type { Client } from "@/src/types";

interface Partner {
  id: string;
  name: string;
}

interface Delivery {
  id: string;
  deliveryDate: string;
  clientId: string;
  partnerId: string;
  quantity: number;
  notes: string;
  createdAt: string;
}

const emptyForm = {
  deliveryDate: new Date().toISOString().slice(0, 10),
  clientId: "",
  partnerId: "",
  quantity: 1,
  notes: "",
};

function getPeriodBounds(period: string, referenceDate: Date) {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "week") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function LivraisonsPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState("day");

  const loadData = async () => {
    setLoading(true);
    try {
      const db = getDb();
      const [clientResponse, partnerSnapshot, deliverySnapshot] = await Promise.all([
        ClientRepository.getAll(300),
        getDocs(query(collection(db, "partners"), orderBy("name", "asc"))),
        getDocs(query(collection(db, "deliveries"), orderBy("deliveryDate", "desc"))),
      ]);

      const partnerData = partnerSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Partner, "id">),
      }));

      const deliveryData = deliverySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Delivery, "id">),
      }));

      setClients(clientResponse.data);
      setPartners(partnerData);
      setDeliveries(deliveryData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const summary = useMemo(() => {
    const { start, end } = getPeriodBounds(period, new Date());
    const filtered = deliveries.filter((delivery) => {
      const dateValue = new Date(delivery.deliveryDate);
      return dateValue >= start && dateValue <= end;
    });

    const totals = filtered.reduce((acc, delivery) => acc + delivery.quantity, 0);

    const breakdown = filtered.reduce<Record<string, { clientName: string; count: number; quantity: number }>>((acc, delivery) => {
      const client = clients.find((item) => item.id === delivery.clientId);
      const clientName = client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
      if (!acc[delivery.clientId]) {
        acc[delivery.clientId] = { clientName, count: 0, quantity: 0 };
      }
      acc[delivery.clientId].count += 1;
      acc[delivery.clientId].quantity += delivery.quantity;
      acc[delivery.clientId].clientName = clientName;
      return acc;
    }, {});

    return {
      totals,
      filteredCount: filtered.length,
      breakdown: Object.values(breakdown).sort((a, b) => b.quantity - a.quantity),
    };
  }, [clients, deliveries, period]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.clientId || !form.partnerId) return;

    setSaving(true);
    setMessage("");

    try {
      const db = getDb();
      await addDoc(collection(db, "deliveries"), {
        deliveryDate: form.deliveryDate,
        clientId: form.clientId,
        partnerId: form.partnerId,
        quantity: Number(form.quantity || 1),
        notes: form.notes,
        createdAt: new Date().toISOString(),
      });
      setMessage("Livraison enregistrée.");
      setForm(emptyForm);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Livraisons"
        description="Suivez les livraisons journalières, hebdomadaires et mensuelles par client"
      />

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <p className="font-semibold">Résumé</p>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select value={period} onValueChange={(value) => setPeriod(value ?? "day")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Aujourd’hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/30 bg-orange-50 p-4">
                  <p className="text-sm text-muted-foreground">Total livraisons</p>
                  <p className="text-2xl font-semibold">{summary.filteredCount}</p>
                </div>
                <div className="rounded-xl border border-border/30 bg-emerald-50 p-4">
                  <p className="text-sm text-muted-foreground">Quantité totale</p>
                  <p className="text-2xl font-semibold">{summary.totals}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {summary.breakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune livraison enregistrée pour cette période.</p>
                ) : (
                  summary.breakdown.map((entry) => (
                    <div key={entry.clientName} className="flex items-center justify-between rounded-xl border border-border/30 px-3 py-2 text-sm">
                      <span className="font-medium">{entry.clientName}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{entry.count} livraison(s)</Badge>
                        <Badge className="bg-orange-100 text-orange-700">{entry.quantity} unité(s)</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-orange-600" />
              <p className="font-semibold">Enregistrer une livraison</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={form.clientId} onValueChange={(value) => setForm({ ...form, clientId: value ?? "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Partenaire</Label>
                <Select value={form.partnerId} onValueChange={(value) => setForm({ ...form, partnerId: value ?? "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nombre d’unités / colis</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex. 15 livraisons pour ce client"
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Enregistrement…" : "Enregistrer la livraison"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
