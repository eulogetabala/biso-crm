import type { CustomerType } from "@/src/types";

export const CUSTOMER_TYPES: Record<CustomerType, string> = {
  individual: "Particulier",
  business: "Entreprise",
} as const;
