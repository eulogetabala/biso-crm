"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CalendarDays,
  Receipt,
  MessageSquare,
  Save,
  Loader2,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
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
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { expenseSchema, type ExpenseFormValues } from "@/src/schemas";
import { toast } from "sonner";
import { PAGINATION } from "@/src/constants";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  expenseDate: string;
  label: string;
  amount: number;
  notes: string;
  createdAt: string;
}

const QUICK_PERIODS = [
  { value: "all", label: "Toutes" },
  { value: "day", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
] as const;

function toYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
}

function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getAvailableMonths(expenses: Expense[]) {
  const now = new Date();
  const months = new Set<string>();

  for (let i = 0; i < 12; i += 1) {
    months.add(toYearMonth(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }

  for (const expense of expenses) {
    const date = parseLocalDate(expense.expenseDate);
    if (!Number.isNaN(date.getTime())) {
      months.add(toYearMonth(date));
    }
  }

  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

function getPeriodBounds(period: string, referenceDate: Date) {
  if (period === "all") {
    return { start: null, end: null };
  }

  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-").map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

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

function isInPeriod(dateValue: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return true;
  return dateValue >= start && dateValue <= end;
}

function getPeriodDescription(period: string) {
  if (period === "all") return "au total";
  if (period === "day") return "aujourd'hui";
  if (period === "week") return "cette semaine";
  if (period === "month") return "ce mois";
  if (/^\d{4}-\d{2}$/.test(period)) {
    return `en ${formatMonthLabel(period).toLowerCase()}`;
  }
  return "";
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} FCFA`;
}

function formatExpenseDate(value: string) {
  const date = parseLocalDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DepensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      label: "",
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const db = getDb();
        const snapshot = await getDocs(
          query(collection(db, "expenses"), orderBy("expenseDate", "desc")),
        );
        if (cancelled) return;
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Expense, "id">),
        }));
        setExpenses(data);
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Impossible de charger les dépenses.",
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
  const monthOptions = useMemo(() => getAvailableMonths(expenses), [expenses]);
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

  const summary = useMemo(() => {
    const { start, end } = getPeriodBounds(period, new Date());
    const filtered = expenses.filter((expense) =>
      isInPeriod(parseLocalDate(expense.expenseDate), start, end),
    );
    const totalAmount = filtered.reduce((acc, expense) => acc + Number(expense.amount || 0), 0);

    const breakdown = filtered.reduce<
      Record<string, { label: string; count: number; amount: number }>
    >((acc, expense) => {
      const key = expense.label.trim().toLowerCase() || "sans libellé";
      if (!acc[key]) {
        acc[key] = { label: expense.label.trim() || "Sans libellé", count: 0, amount: 0 };
      }
      acc[key].count += 1;
      acc[key].amount += Number(expense.amount || 0);
      return acc;
    }, {});

    return {
      totalAmount,
      filtered,
      filteredCount: filtered.length,
      breakdown: Object.values(breakdown).sort((a, b) => b.amount - a.amount),
    };
  }, [expenses, period]);

  const filteredExpenses = useMemo(() => {
    const { start, end } = getPeriodBounds(period, new Date());
    return expenses.filter((expense) => {
      const inPeriod = isInPeriod(parseLocalDate(expense.expenseDate), start, end);
      if (!search.trim()) return inPeriod;
      const term = search.toLowerCase();
      return (
        inPeriod &&
        `${expense.label} ${expense.notes} ${expense.amount}`.toLowerCase().includes(term)
      );
    });
  }, [expenses, period, search]);

  const paginatedExpenses = filteredExpenses.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredExpenses.length / pageSize);

  const openCreate = () => {
    form.reset({
      label: "",
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    setSaving(true);
    try {
      const db = getDb();
      const payload = {
        expenseDate: values.expenseDate,
        label: values.label.trim(),
        amount: Number(values.amount),
        notes: values.notes ?? "",
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "expenses"), payload);
      toast.success("Dépense enregistrée avec succès.");
      setExpenses((prev) => [{ id: docRef.id, ...payload }, ...prev]);
      form.reset({
        label: "",
        amount: 0,
        expenseDate: new Date().toISOString().slice(0, 10),
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

  const periodLabel = getPeriodDescription(period);

  return (
    <PageContainer>
      <PageHeader
        title="Dépenses"
        description={`${summary.filteredCount} dépense${summary.filteredCount !== 1 ? "s" : ""} ${periodLabel}`}
      >
        <Button
          onClick={openCreate}
          className="h-10 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Nouvelle dépense
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                    ? "bg-orange-500 text-white shadow-sm"
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
                  icon={Wallet}
                  title="Aucune dépense"
                  description={
                    period === "all"
                      ? `Aucune dépense enregistrée. Cliquez sur "Nouvelle dépense" pour commencer.`
                      : `Aucune dépense enregistrée ${periodLabel}. Cliquez sur "Nouvelle dépense" pour commencer.`
                  }
                  actionLabel="Première dépense"
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
                    <div className="rounded-xl bg-orange-100 p-2.5 text-orange-700">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coût total</p>
                      <p className="text-2xl font-semibold">{formatAmount(summary.totalAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre de dépenses</p>
                      <p className="text-2xl font-semibold">{summary.filteredCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
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

            {filteredExpenses.length > 0 && (
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Liste des dépenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/20">
                    {paginatedExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        onClick={() => setDetailExpense(expense)}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{expense.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {parseLocalDate(expense.expenseDate).toLocaleDateString("fr-FR")}
                            {expense.notes ? ` · ${expense.notes}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0">{formatAmount(Number(expense.amount || 0))}</p>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-6 py-5 border-b border-border/30">
            <DialogHeader className="gap-1">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-orange-500 p-2 text-white shadow-sm shadow-orange-500/20">
                  <Wallet className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold">Nouvelle dépense</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground ml-10">
                Saisissez le libellé librement, par exemple carburant, loyer ou réparation.
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
                        placeholder="Ex. Carburant, Entretien moto..."
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
                          onChange={(event) => field.onChange(event.target.value === "" ? 0 : event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseDate"
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
                  className="rounded-xl h-10 px-5 font-semibold bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-500/10"
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

      <Dialog open={!!detailExpense} onOpenChange={(open) => { if (!open) setDetailExpense(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border/40 shadow-2xl bg-white">
          {detailExpense && (
            <>
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-6 py-5 border-b border-border/30">
                <DialogHeader className="gap-1">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-orange-500 p-2 text-white shadow-sm shadow-orange-500/20">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-lg font-bold">Détail de la dépense</DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground ml-10">
                    {formatExpenseDate(detailExpense.expenseDate)}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Libellé</p>
                  <p className="text-sm font-semibold mt-1">{detailExpense.label}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Montant</p>
                  <p className="text-sm font-semibold mt-1">{formatAmount(Number(detailExpense.amount || 0))}</p>
                </div>
                {detailExpense.notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Notes
                    </p>
                    <p className="text-sm mt-1 text-muted-foreground">{detailExpense.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
