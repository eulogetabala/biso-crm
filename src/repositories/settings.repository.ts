import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore";
import { getDb } from "@/src/firebase";
import type { Settings } from "@/src/types";

const DOC_PATH = "settings/general";

export const SettingsRepository = {
  async get(): Promise<Settings | null> {
    const snap = await getDoc(doc(getDb(), DOC_PATH));
    if (!snap.exists()) return null;
    return snap.data() as Settings;
  },

  async save(data: Partial<Settings>) {
    const now = serverTimestamp() as Timestamp;
    const snap = await getDoc(doc(getDb(), DOC_PATH));
    if (snap.exists()) {
      await setDoc(doc(getDb(), DOC_PATH), {
        ...data,
        updatedAt: now,
      }, { merge: true });
    } else {
      await setDoc(doc(getDb(), DOC_PATH), {
        companyName: "",
        logo: "",
        supportEmail: "",
        supportPhone: "",
        ...data,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
};
