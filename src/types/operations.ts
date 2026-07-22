import type { Timestamp } from "firebase/firestore";

export interface Livreur {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  motorcycleBrand?: string;
  registrationNumber?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StockItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit?: string;
  purchasePrice?: number;
  purchaseDate?: Timestamp;
  supplier?: string;
  notes?: string;
  isArchived: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
