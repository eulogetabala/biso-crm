"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  CalendarDays,
  CircleDollarSign,
  MessageSquare,
  Save,
  Loader2,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  PencilLine,
  Trash2,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState, ConfirmDialog, PrintExportButtons } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDb } from "@/src/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { incomeSchema, type IncomeFormValues } from "@/src/schemas";
import { useAuth } from "@/src/providers";
import { toast } from "sonner";
import { PAGINATION } from "@/src/constants";
import {
  QUICK_PERIODS,
  toYearMonth,
  parseLocalDate,
  formatMonthLabel,
  getAvailableMonths,
  getPeriodDescription,
  formatAmount,
  formatRecordDate,
  summarizeRecords,
  filterRecords,
  downloadCSV,
} from "@/src/utils";
import { cn } from "@/lib/utils";

interface Income {
  id: string;
  incomeDate: string;
  label: string;
  amount: number;
  notes: string;
  createdAt: string;
}

export default function EntreesPage() {
  const { role } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [period, setPeriod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [detailIncome, setDetailIncome] = useState<Income | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null);
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      label: "",
      amount: 0,
      incomeDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const db = getDb();
        const snapshot = await getDocs(
          query(collection(db, "incomes"), orderBy("incomeDate", "desc")),
        );
        if (cancelled) return;
        setIncomes(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Income, "id">),
          })),
        );
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Impossible de charger les entrées.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentYearMonth = toYearMonth(new Date());
  const monthOptions = useMemo(
    () => getAvailableMonths(incomes.map((income) => income.incomeDate)),
    [incomes],
  );
  const pastMonthOptions = monthOptions.filter((month) => month !== currentYearMonth);
  const selectedMonth =
    period === "month" ? currentYearMonth : /^\d{4}-\d{2}$/.test(period) ? period : null;
  const activeQuickPeriod =
    period === "all" || period === "day" || period === "week"
      ? period
      : period === "month" || period === currentYearMonth
        ? "month"
        : null;

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setPage(0);
  };

  const summary = useMemo(
    () => summarizeRecords(incomes, (income) => income.incomeDate, period),
    [incomes, period],
  );

  const filteredIncomes = useMemo(
    () => filterRecords(incomes, (income) => income.incomeDate, period, search),
    [incomes, period, search],
  );

  const paginatedIncomes = filteredIncomes.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredIncomes.length / pageSize);
  const periodLabel = getPeriodDescription(period);

  const openCreate = () => {
    setEditingIncome(null);
    form.reset({
      label: "",
      amount: 0,
      incomeDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (income: Income) => {
    setEditingIncome(income);
    setDetailIncome(null);
    form.reset({
      label: income.label,
      amount: Number(income.amount),
      incomeDate: income.incomeDate.slice(0, 10),
      notes: income.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (filteredIncomes.length === 0) {
      toast.error("Aucune entrée à exporter.");
      return;
    }
    downloadCSV(
      filteredIncomes.map((income) => ({
        Date: parseLocalDate(income.incomeDate).toLocaleDateString("fr-FR"),
        Libellé: income.label,
        Montant: income.amount,
        Notes: income.notes,
      })),
      `entrees-biso-${period}`,
    );
  };

  const onSubmit = async (values: IncomeFormValues) => {
    setSaving(true);
    try {
      const db = getDb();
      const payload = {
        incomeDate: values.incomeDate,
        label: values.label.trim(),
        amount: Number(values.amount),
        notes: values.notes ?? "",
      };

      if (editingIncome) {
        await updateDoc(doc(db, "incomes", editingIncome.id), payload);
        toast.success("Entrée modifiée avec succès.");
        setIncomes((prev) =>
          prev.map((item) =>
            item.id === editingIncome.id
              ? { ...item, ...payload, createdAt: item.createdAt }
              : item,
          ),
        );
      } else {
        const fullPayload = { ...payload, createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, "incomes"), fullPayload);
        toast.success("Entrée enregistrée avec succès.");
        setIncomes((prev) => [{ id: docRef.id, ...fullPayload }, ...prev]);
      }

      setEditingIncome(null);
      form.reset({
        label: "",
        amount: 0,
        incomeDate: new Date().toISOString().slice(0, 10),
        notes: "",
      });
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const db = getDb();
      await deleteDoc(doc(db, "incomes", deleteTarget.id));
      toast.success("Entrée supprimée.");
      setIncomes((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDetailIncome(null);
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Entrées"
        description={`${summary.filteredCount} entrée${summary.filteredCount !== 1 ? "s" : ""} ${periodLabel}`}
      >
        <Button
          onClick={openCreate}
          className="h-10 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Nouvelle entrée
        </Button>
      </PageHeader>

      <div className="no-print flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex flex-wrap items-center rounded-xl border border-border/50 bg-white p-1 shadow-sm">
            {QUICK_PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handlePeriodChange(item.value)}
                className={cn(
                  "h-9 rounded-lg px-3 text-sm font-medium transition-colors",
                  activeQuickPeriod === item.value
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Select
            value={selectedMonth}
            onValueChange={(value) => {
              if (!value) return;
              handlePeriodChange(value === currentYearMonth ? "month" : value);
            }}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-border/50 bg-white shadow-sm sm:w-[220px]">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className={cn("flex-1 truncate text-left", !selectedMonth && "text-muted-foreground")}>
                {selectedMonth ? formatMonthLabel(selectedMonth) : "Mois passés"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Ce mois</SelectLabel>
                <SelectItem value={currentYearMonth}>
                  {formatMonthLabel(currentYearMonth)}
                </SelectItem>
              </SelectGroup>
              {pastMonthOptions.length > 0 && <SelectSeparator />}
              {pastMonthOptions.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Mois passés</SelectLabel>
                  {pastMonthOptions.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Rechercher par libellé, notes..."
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
        <PrintExportButtons
          onExport={handleExport}
          exportLabel="CSV"
          disabled={filteredIncomes.length === 0}
        />
      </div>

      <div className="print-only mb-4">
        <h1 className="text-xl font-bold">Entrées — Biso CRM</h1>
        <p className="text-sm text-muted-foreground">
          {summary.filteredCount} entrée{summary.filteredCount !== 1 ? "s" : ""} {periodLabel} · Total : {formatAmount(summary.totalAmount)}
        </p>
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
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardContent className="p-12">
                <EmptyState
                  icon={TrendingUp}
                  title="Aucune entrée"
                  description={
                    period === "all"
                      ? 'Aucune entrée enregistrée. Cliquez sur "Nouvelle entrée" pour commencer.'
                      : `Aucune entrée enregistrée ${periodLabel}. Cliquez sur "Nouvelle entrée" pour commencer.`
                  }
                  actionLabel="Première entrée"
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
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total entrées</p>
                      <p className="text-2xl font-semibold">{formatAmount(summary.totalAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                      <CircleDollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre d&apos;entrées</p>
                      <p className="text-2xl font-semibold">{summary.filteredCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-orange-100 p-2.5 text-orange-700">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Éléments distincts</p>
                      <p className="text-2xl font-semibold">{summary.breakdown.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {filteredIncomes.length > 0 && (
              <Card className="print-area border-border/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Liste des entrées
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/20">
                    {paginatedIncomes.map((income) => (
                      <div
                        key={income.id}
                        onClick={() => setDetailIncome(income)}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <CircleDollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{income.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {parseLocalDate(income.incomeDate).toLocaleDateString("fr-FR")}
                            {income.notes ? ` · ${income.notes}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0 text-emerald-700">
                          {formatAmount(Number(income.amount || 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/20 px-5 py-3">
                      <p className="text-xs text-muted-foreground">
                        Page {page + 1} / {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          disabled={page === 0}
                          onClick={() => setPage((current) => Math.max(0, current - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingIncome(null);
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 px-6 py-5 border-b border-border/30">
            <DialogHeader className="gap-1">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-emerald-500 p-2 text-white shadow-sm shadow-emerald-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold">
                  {editingIncome ? "Modifier l'entrée" : "Nouvelle entrée"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground ml-10">
                {editingIncome
                  ? "Mettez à jour les informations de cette entrée."
                  : "Saisissez le libellé librement, par exemple livraison, commission ou remboursement."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground/80">Libellé *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex. Livraison, Commission..."
                        className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground/80">Montant (FCFA) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="h-10 rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value === "" ? 0 : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incomeDate"
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground/80">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Détails optionnels..."
                        className="min-h-[80px] rounded-xl border-border/50 bg-muted/10 focus-visible:bg-white transition-colors text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 px-5 font-semibold"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl h-10 px-5 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailIncome} onOpenChange={(open) => { if (!open) setDetailIncome(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          {detailIncome && (
            <>
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 px-6 py-5 border-b border-border/30">
                <DialogHeader className="gap-1">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-emerald-500 p-2 text-white shadow-sm shadow-emerald-500/20">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-lg font-bold">Détail de l&apos;entrée</DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground ml-10">
                    {formatRecordDate(detailIncome.incomeDate)}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Libellé</p>
                  <p className="text-sm font-semibold mt-1">{detailIncome.label}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Montant</p>
                  <p className="text-sm font-semibold mt-1 text-emerald-700">
                    {formatAmount(Number(detailIncome.amount || 0))}
                  </p>
                </div>
                {detailIncome.notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Notes
                    </p>
                    <p className="text-sm mt-1 text-muted-foreground">{detailIncome.notes}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl h-10 gap-2"
                    onClick={() => openEdit(detailIncome)}
                  >
                    <PencilLine className="h-4 w-4" />
                    Modifier
                  </Button>
                  {role === "admin" && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-xl h-10 gap-2"
                      onClick={() => setDeleteTarget(detailIncome)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Supprimer cette entrée ?"
        description="Cette action est définitive et ne peut pas être annulée."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleting}
      />
    </PageContainer>
  );
}
