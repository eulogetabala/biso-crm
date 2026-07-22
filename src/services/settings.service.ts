import { SettingsRepository } from "@/src/repositories";
import { settingsSchema, type SettingsFormValues } from "@/src/schemas";

export const SettingsService = {
  async get() {
    return SettingsRepository.get();
  },

  async save(data: SettingsFormValues) {
    const parsed = settingsSchema.parse(data);
    return SettingsRepository.save(parsed);
  },
};
