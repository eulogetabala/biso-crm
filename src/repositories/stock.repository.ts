import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  type DocumentSnapshot,
  type Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "@/src/firebase";
import type { StockItem } from "@/src/types";

const COLLECTION = "stock";

function getCol() { return collection(getDb(), COLLECTION); }
function getRef(id: string) { return doc(getDb(), COLLECTION, id); }
function mapDoc(d: DocumentSnapshot): StockItem { return { id: d.id, ...d.data() } as StockItem; }

export const StockRepository = {
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
    const ref = await addDoc(getCol(), { ...data, isArchived: false, createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now });
    return ref.id;
  },

  async update(id: string, data: Record<string, unknown>, userId: string) {
    await updateDoc(getRef(id), { ...data, updatedBy: userId, updatedAt: serverTimestamp() as Timestamp });
  },

  async archive(id: string, userId: string) {
    await updateDoc(getRef(id), { isArchived: true, updatedBy: userId, updatedAt: serverTimestamp() as Timestamp });
  },
};
