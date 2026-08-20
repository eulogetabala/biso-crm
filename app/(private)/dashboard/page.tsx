"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Truck,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { PageContainer } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/src/providers";
import { ClientRepository } from "@/src/repositories";
import { getDb } from "@/src/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { formatDate, formatPhone } from "@/src/utils";
import { CUSTOMER_TYPES, ROUTES } from "@/src/constants";
import type { Client, Stats } from "@/src/types";
import Link from "next/link";
import { toast } from "sonner";

function AnimatedCounter({ to }: { to: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      let start = 0;
      const duration = 1400;
      const startTime = performance.now();

      function update(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setCount(Math.round(start + (to - start) * eased));
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
    }
  }, [to]);

  return <span>{count}</span>;
}

interface StatItemProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  delay: number;
}

function StatItem({ label, value, icon: Icon, accent, delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group relative overflow-hidden border-border/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-border/80">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.03] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.06]" style={{ backgroundColor: accent }} />
        <CardContent className="relative flex items-center gap-4 p-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${accent}15, ${accent}08)`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
            <p
              className="text-2xl font-bold tracking-tight tabular-nums transition-colors duration-300 group-hover:text-foreground"
              style={{ color: accent }}
            >
              <AnimatedCounter to={value} />
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ClientRow({ client, index }: { client: Client; index: number }) {
  const initials = `${client.firstName[0]}${client.lastName[0]}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.05, duration: 0.35 }}
    >
      <Link
        href={ROUTES.private.clients.detail(client.id)}
        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-muted/60"
      >
        <Avatar className="h-9 w-9 ring-2 ring-transparent transition-all group-hover:ring-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {client.firstName} {client.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {formatPhone(client.phone)}
            {client.company ? ` · ${client.company}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 border-border/50 px-1.5 text-[10px] font-medium text-muted-foreground">
            {CUSTOMER_TYPES[client.customerType]}
          </Badge>
          <span className="hidden text-[10px] text-muted-foreground/60 sm:inline-block">
            {formatDate(client.createdAt.toDate())}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function DonutChart({ individuals, businesses }: { individuals: number; businesses: number }) {
  const data = [
    { name: "Particuliers", value: individuals },
    { name: "Entreprises", value: businesses },
  ];

  const COLORS = ["#f97316", "#6366f1"];
  const total = individuals + businesses;

  return (
    <div className="relative mx-auto h-[220px] w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
            animationBegin={200}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index]}
                className="transition-all duration-300 hover:opacity-90"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border/50 bg-white px-3 py-2 shadow-lg">
                    <p className="text-xs font-semibold">{payload[0].name}</p>
                    <p className="text-sm font-bold" style={{ color: payload[0].color }}>
                      {payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-black leading-none tracking-tight">
          {total}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
          total
        </span>
      </div>
    </div>
  );
}

function BarChartCard({ stats: s }: { stats: Stats }) {
  const data = [
    { name: "Particuliers", value: s.totalIndividuals, fill: "#f97316" },
    { name: "Entreprises", value: s.totalBusinesses, fill: "#6366f1" },
  ];

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fontWeight: 600, fill: "#888" }}
          width={90}
        />
        <Bar
          dataKey="value"
          radius={[0, 6, 6, 0]}
          barSize={18}
          animationBegin={400}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="animate-pulse space-y-2 rounded-2xl bg-muted/30 p-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-muted/30 p-5">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-7 w-12 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [dailyDeliveries, setDailyDeliveries] = useState(0);
  const [loading, setLoading] = useState(true);
  const todayString = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, deliverySnapshot] = await Promise.all([
          ClientRepository.getStats(),
          ClientRepository.getRecentClients(8),
          getDocs(
            query(
              collection(getDb(), "deliveries"),
              where("deliveryDate", "==", todayString)
            )
          ),
        ]);
        setStats(s);
        setRecentClients(r);
        setDailyDeliveries(deliverySnapshot.size);
      } catch (err) {
        console.error("[Dashboard] Erreur Firestore:", err);
        const message =
          err instanceof Error ? err.message : "Erreur de connexion à la base";
        toast.error(
          message.includes("permission") || message.includes("Permission")
            ? "Accès Firestore refusé (permission-denied). Vérifiez la connexion et les règles Firebase."
            : `Impossible de charger les données: ${message}`
        );
      }
      finally { setLoading(false); }
    })();
  }, [todayString]);

  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Bonjour" : hours < 18 ? "Bon après-midi" : "Bonsoir";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const accent = "#f97316";
  const indigo = "#6366f1";
  const emerald = "#10b981";
  const violet = "#8b5cf6";

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" exit={{ opacity: 0 }}>
            <SkeletonBlock />
          </motion.div>
        ) : (
          <motion.div
            key="loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                  {today}
                </p>
                <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-tight">
                  {greeting},{" "}
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    {user?.firstName}
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Voici les performances de votre base clients.
                </p>
              </div>
              <div className="mt-3 flex gap-2 sm:mt-0">
                <Link
                  href={ROUTES.private.clients.new}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau client
                </Link>
                <Link
                  href={ROUTES.private.clients.list}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-white/80 px-4 py-2.5 text-sm font-medium shadow-sm backdrop-blur-sm transition-all hover:bg-muted/30 hover:border-border"
                >
                  <Search className="h-4 w-4" />
                  Rechercher
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatItem label="Total clients" value={stats?.totalClients ?? 0} icon={Users} accent={accent} delay={0.1} />
              <StatItem label="Clients aujourd'hui" value={stats?.clientsToday ?? 0} icon={UserPlus} accent={emerald} delay={0.18} />
              <StatItem label="Livraisons aujourd'hui" value={dailyDeliveries} icon={Truck} accent="#22c55e" delay={0.26} />
              <StatItem label="Entreprises" value={stats?.totalBusinesses ?? 0} icon={Building2} accent={indigo} delay={0.34} />
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Clients — spans 2 cols */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="lg:col-span-2"
              >
                <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-bold">
                        Derniers clients
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {recentClients.length} ajouts récents
                      </p>
                    </div>
                    <Link
                      href={ROUTES.private.clients.list}
                      className="group inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                    >
                      Tout voir
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentClients.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                          <Users className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Aucun client pour le moment
                        </p>
                        <Link
                          href={ROUTES.private.clients.new}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Ajouter votre premier client →
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {recentClients.map((c, i) => (
                          <ClientRow key={c.id} client={c} index={i} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Side Panel — Charts */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48, duration: 0.5 }}
                className="space-y-6"
              >
                {/* Donut Chart */}
                <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-bold">
                      Répartition
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground">
                      Particuliers · Entreprises
                    </p>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <DonutChart
                      individuals={stats?.totalIndividuals ?? 0}
                      businesses={stats?.totalBusinesses ?? 0}
                    />
                    <div className="mt-3 flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Particuliers
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Entreprises
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">
                      Comparaison
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground">
                      Nombre par catégorie
                    </p>
                  </CardHeader>
                  <CardContent>
                    {stats && <BarChartCard stats={stats} />}
                  </CardContent>
                </Card>

              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
