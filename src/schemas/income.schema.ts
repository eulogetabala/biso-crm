import { z } from "zod";

export const incomeSchema = z.object({
  label: z.string().min(1, "Le libellé est obligatoire"),
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  incomeDate: z.string().min(1, "La date est obligatoire"),
  notes: z.string().optional().or(z.literal("")),
});

export type IncomeFormValues = z.infer<typeof incomeSchema>;
