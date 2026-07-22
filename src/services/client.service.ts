import { ClientRepository } from "@/src/repositories";
import { clientSchema, type ClientFormValues } from "@/src/schemas";
import type { Client, UpdateClientPayload } from "@/src/types";

export const ClientService = {
  async create(data: ClientFormValues, userId: string) {
    const parsed = clientSchema.parse(data);
    const existing = await ClientRepository.getByPhone(parsed.phone);
    if (existing) {
      throw new Error("Ce numéro de téléphone est déjà utilisé.");
    }
    return ClientRepository.create(parsed, userId);
  },

  async update(id: string, data: Partial<ClientFormValues>, userId: string) {
    const payload: UpdateClientPayload = data;
    if (data.phone) {
      const existing = await ClientRepository.getByPhone(data.phone);
      if (existing && existing.id !== id) {
        throw new Error("Ce numéro de téléphone est déjà utilisé.");
      }
    }
    return ClientRepository.update(id, payload, userId);
  },

  async archive(id: string, userId: string) {
    return ClientRepository.archive(id, userId);
  },

  async getById(id: string): Promise<Client | null> {
    return ClientRepository.getById(id);
  },

  async search(term: string) {
    return ClientRepository.search(term);
  },

  async getAll(pageSize?: number) {
    return ClientRepository.getAll(pageSize);
  },

  async getStats() {
    return ClientRepository.getStats();
  },

  async getRecentClients() {
    return ClientRepository.getRecentClients();
  },
};
