import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
