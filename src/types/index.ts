export type { Client, ClientNote, CreateClientPayload, UpdateClientPayload, CustomerType, CustomerSource } from "./client";
export type { User, UserRole } from "./user";
export type { Settings } from "./settings";
export type { Livreur, StockItem } from "./operations";

export interface PaginationParams {
  pageSize: number;
  startAfter?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  lastDocId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Stats {
  totalClients: number;
  clientsToday: number;
  clientsThisMonth: number;
  totalIndividuals: number;
  totalBusinesses: number;
}
