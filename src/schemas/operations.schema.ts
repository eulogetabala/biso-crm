import { z } from "zod";

export const livreurSchema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire"),
  lastName: z.string().min(1, "Le nom est obligatoire"),
  phone: z.string().min(1, "Le téléphone est obligatoire"),
  address: z.string().optional().or(z.literal("")),
  motorcycleBrand: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
});

export type LivreurFormValues = z.infer<typeof livreurSchema>;

export const stockSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "La catégorie est obligatoire"),
  quantity: z.string().min(1, "La quantité est obligatoire"),
  unit: z.string().optional().or(z.literal("")),
  purchasePrice: z.string().optional().or(z.literal("")),
  purchaseDate: z.string().optional().or(z.literal("")),
  supplier: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export interface StockFormValues {
  name: string;
  description?: string;
  category: string;
  quantity: string;
  unit?: string;
  purchasePrice?: string;
  purchaseDate?: string;
  supplier?: string;
  notes?: string;
}
