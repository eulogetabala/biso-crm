import { z } from "zod";

export const clientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire"),
  lastName: z.string().min(1, "Le nom est obligatoire"),
  phone: z.string().min(1, "Le téléphone est obligatoire"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  customerType: z.enum(["individual", "business"]),
  source: z.enum([
    "phone",
    "whatsapp",
    "facebook",
    "instagram",
    "website",
    "referral",
    "other",
  ]),
  notes: z.string().optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
