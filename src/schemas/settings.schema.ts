import { z } from "zod";

export const settingsSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est obligatoire"),
  logo: z.string().optional().or(z.literal("")),
  supportEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  supportPhone: z.string().optional().or(z.literal("")),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
