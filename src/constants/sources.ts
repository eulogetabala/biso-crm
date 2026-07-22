import type { CustomerSource } from "@/src/types";

export const SOURCES: Record<CustomerSource, string> = {
  phone: "Téléphone",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  website: "Site Web",
  referral: "Recommandation",
  other: "Autre",
} as const;
