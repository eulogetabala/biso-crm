import { NextResponse } from "next/server";
import { getDb } from "@/src/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export async function GET() {
  try {
    const db = getDb();
    const snapshot = await getDocs(query(collection(db, "clients"), orderBy("createdAt", "desc")));
    const clients = snapshot.docs.map((d) => d.data());

    const rows = clients.map((c) => ({
      Nom: c.lastName ?? "",
      Prénom: c.firstName ?? "",
      Téléphone: c.phone ?? "",
      Email: c.email ?? "",
      Entreprise: c.company ?? "",
      Adresse: c.address ?? "",
      Ville: c.city ?? "",
      Pays: c.country ?? "",
      Type: c.customerType ?? "",
      Source: c.source ?? "",
      Archivé: c.isArchived ? "Oui" : "Non",
      "Date création": c.createdAt?.toDate?.() ? new Date(c.createdAt.toDate()).toISOString() : "",
    }));

    const headers = Object.keys(rows[0] ?? {}).join(",");
    const csv = [
      headers,
      ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="clients-biso-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 });
  }
}
