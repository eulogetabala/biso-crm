import { z } from "zod";

export const partnerSchema = z.object({
  name: z.string().min(1, "Le nom de l'entreprise est obligatoire"),
  type: z.enum(["partenaire", "fournisseur", "transporteur"]),
  contactName: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;
