export const QUICK_PERIODS = [
  { value: "all", label: "Toutes" },
  { value: "day", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
] as const;

export function toYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
}

export function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getAvailableMonths(dateValues: string[]) {
  const now = new Date();
  const months = new Set<string>();

  for (let i = 0; i < 12; i += 1) {
    months.add(toYearMonth(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }

  for (const value of dateValues) {
    const date = parseLocalDate(value);
    if (!Number.isNaN(date.getTime())) {
      months.add(toYearMonth(date));
    }
  }

  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export function getPeriodBounds(period: string, referenceDate: Date) {
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

export function isInPeriod(dateValue: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return true;
  return dateValue >= start && dateValue <= end;
}

export function getPeriodDescription(period: string) {
  if (period === "all") return "au total";
  if (period === "day") return "aujourd'hui";
  if (period === "week") return "cette semaine";
  if (period === "month") return "ce mois";
  if (/^\d{4}-\d{2}$/.test(period)) {
    return `en ${formatMonthLabel(period).toLowerCase()}`;
  }
  return "";
}

export function formatAmount(amount: number) {
  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} FCFA`;
}

export function formatRecordDate(value: string) {
  const date = parseLocalDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function summarizeRecords<T extends { label: string; amount: number }>(
  records: T[],
  getDate: (record: T) => string,
  period: string,
) {
  const { start, end } = getPeriodBounds(period, new Date());
  const filtered = records.filter((record) =>
    isInPeriod(parseLocalDate(getDate(record)), start, end),
  );
  const totalAmount = filtered.reduce((acc, record) => acc + Number(record.amount || 0), 0);

  const breakdown = filtered.reduce<
    Record<string, { label: string; count: number; amount: number }>
  >((acc, record) => {
    const key = record.label.trim().toLowerCase() || "sans libellé";
    if (!acc[key]) {
      acc[key] = { label: record.label.trim() || "Sans libellé", count: 0, amount: 0 };
    }
    acc[key].count += 1;
    acc[key].amount += Number(record.amount || 0);
    return acc;
  }, {});

  return {
    totalAmount,
    filtered,
    filteredCount: filtered.length,
    breakdown: Object.values(breakdown).sort((a, b) => b.amount - a.amount),
  };
}

export function filterRecords<T extends { label: string; amount: number; notes: string }>(
  records: T[],
  getDate: (record: T) => string,
  period: string,
  search: string,
) {
  const { start, end } = getPeriodBounds(period, new Date());
  return records.filter((record) => {
    const inPeriod = isInPeriod(parseLocalDate(getDate(record)), start, end);
    if (!search.trim()) return inPeriod;
    const term = search.toLowerCase();
    return (
      inPeriod &&
      `${record.label} ${record.notes} ${record.amount}`.toLowerCase().includes(term)
    );
  });
}
