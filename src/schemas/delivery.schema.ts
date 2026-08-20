import { z } from "zod";

export const deliverySchema = z.object({
  clientName: z.string().min(1, "Le nom du client est obligatoire"),
  clientPhone: z.string().optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
  deliveryDate: z.string().min(1, "La date est obligatoire"),
  address: z.string().min(1, "L'adresse est obligatoire"),
  packageName: z.string().min(1, "Le nom du colis est obligatoire"),
  quantity: z.number().int().min(1, "Minimum 1"),
  notes: z.string().optional().or(z.literal("")),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;
