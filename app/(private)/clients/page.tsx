"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Phone,
  Building2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  ImportExportButtons,
} from "@/components/common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientRepository } from "@/src/repositories";
import { formatDate, formatPhone } from "@/src/utils";
import { CUSTOMER_TYPES, SOURCES, PAGINATION, ROUTES, hasPermission } from "@/src/constants";
import { useAuth } from "@/src/providers";
import type { Client } from "@/src/types";
import Link from "next/link";

export default function ClientsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      if (search.trim()) {
        const results = await ClientRepository.search(search.trim());
        setClients(results);
      } else {
        const result = await ClientRepository.getAll(pageSize);
        setClients(result.data);
      }
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [search, pageSize]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const paginated = clients.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(clients.length / pageSize);

  const columns: ColumnDef<Client>[] = [
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => {
        const c = row.original;
        const initials = `${c.firstName[0]}${c.lastName[0]}`;
        return (
          <Link href={ROUTES.private.clients.detail(c.id)} className="flex items-center gap-3 group">
            <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-[11px] font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                {c.firstName} {c.lastName}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {formatPhone(c.phone)}
              </p>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "company",
      header: "Entreprise",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return val ? (
          <span className="flex items-center gap-1.5 text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {val}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/50">—</span>
        );
      },
    },
    {
      accessorKey: "customerType",
      header: "Type",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
          <Badge variant="outline" className="border-border/50 text-xs font-medium">
            {CUSTOMER_TYPES[val as keyof typeof CUSTOMER_TYPES] ?? val}
          </Badge>
        );
      },
    },
    {
      accessorKey: "city",
      header: "Ville",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>() || "—"}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return (
          <span className="text-xs text-muted-foreground">
            {SOURCES[val as keyof typeof SOURCES] ?? val}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ getValue }) => {
        const val = getValue<{ toDate: () => Date }>();
        return (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDate(val?.toDate())}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => router.push(ROUTES.private.clients.detail(c.id))}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(ROUTES.private.clients.edit(c.id))}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              {hasPermission(role ?? "employee", "clients:archive") && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    if (!confirm("Supprimer ce client ? Cette action est irréversible.")) return;
                    try {
                      await ClientRepository.delete(c.id);
                      toast.success("Client supprimé avec succès");
                      loadClients();
                    } catch {
                      toast.error("Erreur lors de la suppression");
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: paginated,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length > 1 ? "s" : ""} dans la base`}
      >
        <Link
          href={ROUTES.private.clients.new}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un client
        </Link>
      </PageHeader>

      {/* Search + Filters + Import/Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Rechercher par nom, téléphone, email, ville..."
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

      {/* Table */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" exit={{ opacity: 0 }}>
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4">
                      <div className="h-9 w-9 rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-36 rounded bg-muted" />
                        <div className="h-3 w-24 rounded bg-muted" />
                      </div>
                      <div className="h-5 w-20 rounded-full bg-muted" />
                      <div className="h-4 w-16 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : clients.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmptyState
              icon={UserPlus}
              title={search ? "Aucun résultat" : "Aucun client"}
              description={
                search
                  ? `Aucun client ne correspond à "${search}".`
                  : "Commencez par ajouter votre premier client."
              }
              actionLabel={search ? undefined : "Ajouter un client"}
              onAction={search ? undefined : () => router.push(ROUTES.private.clients.new)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="border-border/30 hover:bg-transparent">
                        {hg.headers.map((h) => (
                          <TableHead key={h.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="border-border/20 transition-colors hover:bg-muted/30">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} sur {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={page === 0}
                    onClick={() => setPage(Math.max(0, page - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = page < 3 ? i : page + i - 2;
                    if (pageNum >= totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 rounded-lg text-xs font-medium"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
