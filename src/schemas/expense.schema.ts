import { z } from "zod";

export const expenseSchema = z.object({
  label: z.string().min(1, "Le libellé est obligatoire"),
  amount: z.coerce.number().positive("Le montant doit être supérieur à 0"),
  expenseDate: z.string().min(1, "La date est obligatoire"),
  notes: z.string().optional().or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
