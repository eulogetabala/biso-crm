import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire"),
  lastName: z.string().min(1, "Le nom est obligatoire"),
  email: z.string().min(1, "L'email est obligatoire").email("Email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
  role: z.enum(["admin", "employee"]),
});

export type UserFormValues = z.infer<typeof userSchema>;
