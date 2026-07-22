import type { Timestamp } from "firebase/firestore";

export interface Settings {
  companyName: string;
  logo: string;
  supportEmail: string;
  supportPhone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
