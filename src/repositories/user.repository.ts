import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { getDb } from "@/src/firebase";
import type { User } from "@/src/types";

export const UserRepository = {
  async getAll(): Promise<User[]> {
    const snapshot = await getDocs(query(collection(getDb(), "users"), orderBy("createdAt", "desc")));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as User);
  },

  async toggleActive(userId: string, isActive: boolean) {
    await updateDoc(doc(getDb(), "users", userId), { isActive });
  },
};
