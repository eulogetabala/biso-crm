import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  type DocumentSnapshot,
  type QueryConstraint,
  type Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "@/src/firebase";
import type { Livreur } from "@/src/types";

const COLLECTION = "livreurs";

function getCol() { return collection(getDb(), COLLECTION); }
function getRef(id: string) { return doc(getDb(), COLLECTION, id); }
function mapDoc(d: DocumentSnapshot): Livreur { return { id: d.id, ...d.data() } as Livreur; }

export const LivreurRepository = {
  async getAll() {
    const snap = await getDocs(query(getCol(), orderBy("createdAt", "desc")));
    return snap.docs.map(mapDoc);
  },

  async getById(id: string) {
    const snap = await getDoc(getRef(id));
    return snap.exists() ? mapDoc(snap) : null;
  },

  async create(data: Record<string, unknown>, userId: string) {
    const now = serverTimestamp() as Timestamp;
    const ref = await addDoc(getCol(), { ...data, isActive: true, createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now });
    return ref.id;
  },

  async update(id: string, data: Record<string, unknown>, userId: string) {
    await updateDoc(getRef(id), { ...data, updatedBy: userId, updatedAt: serverTimestamp() as Timestamp });
  },

  async toggleActive(id: string, isActive: boolean) {
    await updateDoc(getRef(id), { isActive, updatedAt: serverTimestamp() as Timestamp });
  },
};
