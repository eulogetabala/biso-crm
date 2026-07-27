"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  CalendarDays,
  User,
  Package,
  MessageSquare,
  MapPin,
  Save,
  Loader2,
  Plus,
  Check,
  ChevronDown,
  ClipboardList,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientRepository } from "@/src/repositories";
import { getDb } from "@/src/firebase";
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { deliverySchema, type DeliveryFormValues } from "@/src/schemas";
import type { Client } from "@/src/types";
import { toast } from "sonner";
import { PAGINATION } from "@/src/constants";

interface Delivery {
  id: string;
  deliveryDate: string;
  clientId: string;
  address: string;
  packageName: string;
  quantity: number;
  notes: string;
  createdAt: string;
}

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState("day");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  // Client search state
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);

  // Quick create dialog
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  // Detail dialog
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientId: "",
      deliveryDate: new Date().toISOString().slice(0, 10),
      address: "",
      packageName: "",
      quantity: 1,
      notes: "",
    },
  });

  const selectedClientName = form.watch("clientName");
  const selectedClientId = form.watch("clientId");

  const loadData = async () => {
    setLoading(true);
    try {
      const db = getDb();
      const [clientResponse, deliverySnapshot] = await Promise.all([
        ClientRepository.getAll(500),
        getDocs(query(collection(db, "deliveries"), orderBy("deliveryDate", "desc"))),
      ]);

      const deliveryData = deliverySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Delivery, "id">),
      }));

      setClients(clientResponse.data);
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

    const breakdown = filtered.reduce<
      Record<string, { clientName: string; count: number; quantity: number }>
    >((acc, delivery) => {
      const client = clients.find((item) => item.id === delivery.clientId);
      const clientName = client
        ? `${client.firstName} ${client.lastName}`
        : "Client inconnu";
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
      filtered,
      filteredCount: filtered.length,
      breakdown: Object.values(breakdown).sort((a, b) => b.quantity - a.quantity),
    };
  }, [clients, deliveries, period]);

  // Filtered by search + period
  const filteredDeliveries = useMemo(() => {
    const { start, end } = getPeriodBounds(period, new Date());
    return deliveries.filter((delivery) => {
      const dateValue = new Date(delivery.deliveryDate);
      const inPeriod = dateValue >= start && dateValue <= end;
      if (!search.trim()) return inPeriod;
      const term = search.toLowerCase();
      const client = clients.find((item) => item.id === delivery.clientId);
      const clientName = client ? `${client.firstName} ${client.lastName}` : "";
      return inPeriod && `${clientName} ${delivery.packageName} ${delivery.address} ${delivery.notes}`.toLowerCase().includes(term);
    });
  }, [clients, deliveries, period, search]);

  const paginatedDeliveries = filteredDeliveries.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredDeliveries.length / pageSize);

  // Debounced client search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClientSearch = useCallback(
    async (term: string) => {
      setClientSearchTerm(term);
      form.setValue("clientName", term);
      form.setValue("clientId", "");

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const results = await ClientRepository.search(term);
          setSearchResults(results.slice(0, 10));
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [form],
  );

  const selectClient = useCallback(
    (client: Client) => {
      form.setValue("clientId", client.id);
      form.setValue("clientName", `${client.firstName} ${client.lastName}`);
      form.setValue("clientPhone", client.phone);
      if (client.address) {
        form.setValue("address", client.address);
      }
      setClientSearchOpen(false);
    },
    [form],
  );

  const handleQuickCreate = async () => {
    if (!newClientFirstName || !newClientLastName || !newClientPhone) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setCreatingClient(true);
    try {
      const clientId = await ClientRepository.create(
        {
          firstName: newClientFirstName,
          lastName: newClientLastName,
          phone: newClientPhone,
          customerType: "individual",
          source: "other",
        },
        "system",
      );

      const fullName = `${newClientFirstName} ${newClientLastName}`;
      form.setValue("clientId", clientId);
      form.setValue("clientName", fullName);
      form.setValue("clientPhone", newClientPhone);

      setQuickCreateOpen(false);
      setNewClientFirstName("");
      setNewClientLastName("");
      setNewClientPhone("");
      setClientSearchOpen(false);

      const response = await ClientRepository.getAll(500);
      setClients(response.data);

      toast.success("Client créé et sélectionné.");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la création du client.",
      );
    } finally {
      setCreatingClient(false);
    }
  };

  const openCreate = () => {
    form.reset({
      clientName: "",
      clientPhone: "",
      clientId: "",
      deliveryDate: new Date().toISOString().slice(0, 10),
      address: "",
      packageName: "",
      quantity: 1,
      notes: "",
    });
    setClientSearchTerm("");
    setSearchResults([]);
    setDialogOpen(true);
  };

  const onSubmit = async (values: DeliveryFormValues) => {
    if (!values.clientId) {
      toast.error("Veuillez sélectionner ou créer un client.");
      return;
    }

    setSaving(true);
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, "deliveries"), {
        deliveryDate: values.deliveryDate,
        clientId: values.clientId,
        address: values.address,
        packageName: values.packageName,
        quantity: values.quantity,
        notes: values.notes,
        createdAt: new Date().toISOString(),
      });

      toast.success("Livraison enregistrée avec succès.");

      // Add the new delivery to local state immediately
      const newDelivery: Delivery = {
        id: docRef.id,
        deliveryDate: values.deliveryDate,
        clientId: values.clientId,
        address: values.address,
        packageName: values.packageName,
        quantity: values.quantity,
        notes: values.notes ?? "",
        createdAt: new Date().toISOString(),
      };
      setDeliveries((prev) => [newDelivery, ...prev]);

      form.reset({
        clientName: "",
        clientPhone: "",
        clientId: "",
        deliveryDate: new Date().toISOString().slice(0, 10),
        address: "",
        packageName: "",
        quantity: 1,
        notes: "",
      });
      setClientSearchTerm("");
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  };

  const periodLabel = period === "day" ? "aujourd'hui" : period === "week" ? "cette semaine" : "ce mois";

  return (
    <PageContainer>
      <PageHeader
        title="Livraisons"
        description={`${summary.filteredCount} livraison${summary.filteredCount !== 1 ? "s" : ""} ${periodLabel}`}
      >
        <Button
          onClick={openCreate}
          className="h-10 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Nouvelle livraison
        </Button>
      </PageHeader>

      {/* Period selector + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value) => setPeriod(value ?? "day")}>
            <SelectTrigger className="h-11 w-[200px] rounded-xl border-border/50 bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Rechercher par client, colis, adresse..."
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
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : summary.filteredCount === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardContent className="p-12">
                <EmptyState
                  icon={ClipboardList}
                  title="Aucune livraison"
                  description={`Aucune livraison enregistrée ${periodLabel}. Cliquez sur "Nouvelle livraison" pour commencer.`}
                  actionLabel="Première livraison"
                  onAction={openCreate}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-orange-100 p-2.5 text-orange-700">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total livraisons</p>
                      <p className="text-2xl font-semibold">{summary.filteredCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantité totale</p>
                      <p className="text-2xl font-semibold">{summary.totals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clients livrés</p>
                      <p className="text-2xl font-semibold">{summary.breakdown.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deliveries table */}
            {filteredDeliveries.length > 0 && (
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Liste des livraisons
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/20">
                    {paginatedDeliveries.map((delivery) => {
                      const client = clients.find((item) => item.id === delivery.clientId);
                      const clientName = client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
                      return (
                        <div
                          key={delivery.id}
                          onClick={() => setDetailDelivery(delivery)}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-sm font-semibold text-muted-foreground">
                            {clientName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{clientName}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {delivery.packageName}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {delivery.address}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <div className="text-xs text-muted-foreground">
                              {new Date(delivery.deliveryDate).toLocaleDateString("fr-FR")}
                            </div>
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              x{delivery.quantity}
                            </Badge>
                            <Eye className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
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

      {/* Dialog: Nouvelle livraison */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-6 py-5 border-b border-border/30">
            <DialogHeader className="gap-1">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-orange-500 p-2 text-white shadow-sm shadow-orange-500/20">
                  <Truck className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Nouvelle livraison
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground ml-10">
                Enregistrez une nouvelle livraison avec les détails du colis.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Client */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <User className="h-3.5 w-3.5" />
                  <span>Client</span>
                </div>

                {/* Client name combobox */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Nom du client *</Label>
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="h-10 w-full justify-between rounded-xl border-border/50 bg-muted/10 font-normal focus-visible:bg-white transition-colors text-sm"
                        >
                          {selectedClientId && selectedClientName
                            ? selectedClientName
                            : "Rechercher ou créer un client..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-72 p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Tapez le nom du client..."
                          value={clientSearchTerm}
                          onValueChange={(val) => handleClientSearch(val)}
                        />
                        <CommandList>
                          {searching && (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {!searching && clientSearchTerm.length < 2 && (
                            <CommandEmpty>
                              Tapez au moins 2 caractères pour rechercher.
                            </CommandEmpty>
                          )}
                          {!searching &&
                            clientSearchTerm.length >= 2 &&
                            searchResults.length === 0 && (
                              <CommandEmpty>
                                <div className="flex flex-col items-center gap-2 py-2">
                                  <p className="text-sm text-muted-foreground">
                                    Aucun client trouvé.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl border-border/50"
                                    onClick={() => {
                                      setNewClientFirstName(clientSearchTerm);
                                      setNewClientLastName("");
                                      setNewClientPhone("");
                                      setClientSearchOpen(false);
                                      setQuickCreateOpen(true);
                                    }}
                                  >
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    Créer le client
                                  </Button>
                                </div>
                              </CommandEmpty>
                            )}
                          {!searching && searchResults.length > 0 && (
                            <CommandGroup>
                              {searchResults.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.id}
                                  onSelect={() => selectClient(client)}
                                >
                                  <span>
                                    {client.firstName} {client.lastName}
                                  </span>
                                  {selectedClientId === client.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() => {
                                  setNewClientFirstName(clientSearchTerm);
                                  setNewClientLastName("");
                                  setNewClientPhone("");
                                  setClientSearchOpen(false);
                                  setQuickCreateOpen(true);
                                }}
                                className="text-primary font-medium"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Créer un nouveau client
                              </CommandItem>
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Client phone (auto-populated) */}
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground/80">Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          className="h-10 rounded-xl border-border/50 bg-muted/30 text-sm"
                          placeholder="Renseigné automatiquement"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <hr className="border-border/20" />

              {/* Détails livraison */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Détails de la livraison</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">Date *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                              type="date"
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground/80">Adresse *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                          <Input
                            placeholder="123 Avenue de la Paix, Brazzaville"
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

              {/* Colis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <Package className="h-3.5 w-3.5" />
                  <span>Colis</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="packageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">Nom du colis *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex. Documents, Électroménager..."
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground/80">Nombre *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <hr className="border-border/20" />

              {/* Note */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Note</span>
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground/80">Note (optionnelle)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informations complémentaires sur cette livraison..."
                          className="rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm min-h-[80px]"
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
                  onClick={() => setDialogOpen(false)}
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
                      <Save className="h-4 w-4 mr-1.5" />
                      Enregistrer la livraison
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quick create client dialog */}
      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-6 py-5 border-b border-border/30">
            <DialogHeader className="gap-1">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-orange-500 p-2 text-white shadow-sm shadow-orange-500/20">
                  <User className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Nouveau client
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground ml-10">
                Remplissez les informations pour créer un nouveau client.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qc-firstname" className="text-xs font-semibold text-foreground/80">Prénom *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="qc-firstname"
                    className="h-10 pl-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                    placeholder="Jean"
                    value={newClientFirstName}
                    onChange={(e) => setNewClientFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qc-lastname" className="text-xs font-semibold text-foreground/80">Nom *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="qc-lastname"
                    className="h-10 pl-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                    placeholder="Dupont"
                    value={newClientLastName}
                    onChange={(e) => setNewClientLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qc-phone" className="text-xs font-semibold text-foreground/80">Téléphone *</Label>
                <Input
                  id="qc-phone"
                  className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                  placeholder="06 123 45 67"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="-mx-0 -mb-0">
            <Button
              variant="outline"
              className="rounded-xl h-10 px-5 font-semibold"
              onClick={() => setQuickCreateOpen(false)}
            >
              Annuler
            </Button>
            <Button
              disabled={creatingClient}
              onClick={handleQuickCreate}
              className="rounded-xl h-10 px-5 font-semibold bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-500/10"
            >
              {creatingClient ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Créer le client
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail delivery dialog */}
      <Dialog open={!!detailDelivery} onOpenChange={(open) => { if (!open) setDetailDelivery(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          {detailDelivery && (() => {
            const client = clients.find((item) => item.id === detailDelivery.clientId);
            const clientName = client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
            const clientPhone = client?.phone ?? "—";
            return (
              <>
                <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-6 py-5 border-b border-border/30">
                  <DialogHeader className="gap-1">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl bg-orange-500 p-2 text-white shadow-sm shadow-orange-500/20">
                        <Truck className="h-5 w-5" />
                      </div>
                      <DialogTitle className="text-lg font-bold text-foreground">
                        Détail de la livraison
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground ml-10">
                      {new Date(detailDelivery.deliveryDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-6 space-y-5">
                  {/* Client info */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">
                      {clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{clientName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {clientPhone}
                      </p>
                    </div>
                  </div>

                  <hr className="border-border/20" />

                  {/* Delivery details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Date</p>
                      <p className="text-sm font-medium">
                        {new Date(detailDelivery.deliveryDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Quantité</p>
                      <Badge className="bg-orange-100 text-orange-700 text-xs font-semibold">
                        x{detailDelivery.quantity}
                      </Badge>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Adresse</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {detailDelivery.address}
                      </p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Colis</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {detailDelivery.packageName}
                      </p>
                    </div>
                    {detailDelivery.notes && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Note</p>
                        <p className="text-sm text-muted-foreground">{detailDelivery.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30 -mx-6 -mb-6 bg-muted/30 px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => setDetailDelivery(null)}
                    className="rounded-xl h-10 px-5 font-semibold text-foreground"
                  >
                    Fermer
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
