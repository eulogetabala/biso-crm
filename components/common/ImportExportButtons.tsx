"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClientService } from "@/src/services";
import { clientSchema } from "@/src/schemas";
import { downloadCSV } from "@/src/utils";
import { useAuth } from "@/src/providers";
import { CUSTOMER_TYPES, SOURCES } from "@/src/constants";
import { toast } from "sonner";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  messages: string[];
}

export function ImportExportButtons() {
  const { user, role } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"import" | "export">("import");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (role !== "admin") return null;

  function openImport() { setMode("import"); setResult(null); setDialogOpen(true); }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { toast.error("Fichier CSV vide"); return; }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1);

      const messages: string[] = [];
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (let i = 0; i < rows.length; i++) {
        const values = rows[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });

        const data = {
          firstName: row["prenom"] ?? row["prenoms"] ?? row["firstname"] ?? row["first_name"] ?? "",
          lastName: row["nom"] ?? row["name"] ?? row["lastname"] ?? row["last_name"] ?? "",
          phone: row["telephone"] ?? row["phone"] ?? row["tel"] ?? "",
          email: row["email"] ?? row["mail"] ?? "",
          company: row["entreprise"] ?? row["company"] ?? "",
          address: row["adresse"] ?? row["address"] ?? "",
          city: row["ville"] ?? row["city"] ?? "",
          country: row["pays"] ?? row["country"] ?? "",
          customerType: (row["type"] ?? row["customer_type"] ?? "individual") as "individual" | "business",
          source: (row["source"] ?? "other") as "phone" | "whatsapp" | "facebook" | "instagram" | "website" | "referral" | "other",
          notes: row["notes"] ?? "",
        };

        const parsed = clientSchema.safeParse(data);
        if (!parsed.success) {
          errors++;
          messages.push(`Ligne ${i + 2} : ${parsed.error.issues[0].message}`);
          continue;
        }

        try {
          await ClientService.create(parsed.data, user.id);
          imported++;
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes("déjà utilisé")) {
            skipped++;
            messages.push(`Ligne ${i + 2} : téléphone déjà utilisé`);
          } else {
            errors++;
            messages.push(`Ligne ${i + 2} : ${err instanceof Error ? err.message : "Erreur"}`);
          }
        }
      }

      const r: ImportResult = { imported, skipped, errors, messages: messages.slice(0, 15) };
      setResult(r);
      if (imported > 0) toast.success(`${imported} client(s) importé(s)`);
      else if (errors > 0) toast.error("Aucun client importé");
    } catch {
      toast.error("Erreur lors de la lecture du fichier");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openImport}
          className="h-9 gap-2 rounded-xl border-border/50 bg-white shadow-sm text-sm"
        >
          <Upload className="h-4 w-4" />
          Importer CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("/api/export-clients", "_blank")}
          className="h-9 gap-2 rounded-xl border-border/50 bg-white shadow-sm text-sm"
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Importer des clients</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Importez un fichier CSV avec vos clients.
              {!result && " Les doublons (téléphone) seront ignorés."}
            </DialogDescription>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/60 p-10 transition-colors hover:border-primary/50 hover:bg-muted/20"
              >
                {importing ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">
                  {importing ? "Importation en cours..." : "Cliquez pour sélectionner un fichier CSV"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Colonnes attendues : nom, prenom, telephone, email, entreprise, adresse, ville, pays, type, source
                </p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center bg-emerald-50/50 border-emerald-200">
                  <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                  <p className="text-2xl font-bold text-emerald-700">{result.imported}</p>
                  <p className="text-[10px] font-medium text-emerald-600">Importé(s)</p>
                </Card>
                <Card className="p-4 text-center bg-amber-50/50 border-amber-200">
                  <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
                  <p className="text-[10px] font-medium text-amber-600">Ignoré(s)</p>
                </Card>
                <Card className="p-4 text-center bg-red-50/50 border-red-200">
                  <X className="mx-auto mb-1 h-5 w-5 text-red-600" />
                  <p className="text-2xl font-bold text-red-700">{result.errors}</p>
                  <p className="text-[10px] font-medium text-red-600">Erreur(s)</p>
                </Card>
              </div>
              {result.messages.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto rounded-xl border border-border/40 p-3 space-y-1">
                  {result.messages.map((m, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{m}</p>
                  ))}
                  {result.messages.length >= 15 && (
                    <p className="text-xs text-muted-foreground/60 italic">...et plus</p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setDialogOpen(false)}>Fermer</Button>
                <Button size="sm" className="rounded-xl" onClick={() => { setResult(null); if (fileRef.current) fileRef.current.value = ""; }}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Nouvel import
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
