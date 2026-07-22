import type { Timestamp } from "firebase/firestore";

export type CustomerType = "individual" | "business";

export type CustomerSource =
  | "phone"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "website"
  | "referral"
  | "other";

export interface ClientNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  customerType: CustomerType;
  source: CustomerSource;
  notes: ClientNote[];
  isArchived: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateClientPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  customerType: CustomerType;
  source: CustomerSource;
  notes?: string;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  isArchived?: boolean;
}
