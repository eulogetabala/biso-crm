import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  type DocumentSnapshot,
  type QueryConstraint,
  type Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "@/src/firebase";
import type { Client, ClientNote, CreateClientPayload, UpdateClientPayload } from "@/src/types";
import { PAGINATION } from "@/src/constants";

const COLLECTION = "clients";

function getCollection() {
  return collection(getDb(), COLLECTION);
}

function getDocRef(id: string) {
  return doc(getDb(), COLLECTION, id);
}

function docToClient(docSnap: DocumentSnapshot): Client {
  return { id: docSnap.id, ...docSnap.data() } as Client;
}

export const ClientRepository = {
  async getAll(pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE, startAfterDoc?: DocumentSnapshot) {
    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      limit(pageSize),
    ];
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    const snapshot = await getDocs(query(getCollection(), ...constraints));
    return {
      data: snapshot.docs.map(docToClient),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
      hasMore: snapshot.docs.length === pageSize,
    };
  },

  async getById(id: string) {
    const docSnap = await getDoc(getDocRef(id));
    if (!docSnap.exists()) return null;
    return docToClient(docSnap);
  },

  async create(payload: CreateClientPayload, userId: string) {
    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection(), {
      ...payload,
      notes: [],
      isArchived: false,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async update(id: string, payload: UpdateClientPayload, userId: string) {
    const now = serverTimestamp() as Timestamp;
    await updateDoc(getDocRef(id), {
      ...payload,
      updatedBy: userId,
      updatedAt: now,
    });
  },

  async archive(id: string, userId: string) {
    const now = serverTimestamp() as Timestamp;
    await updateDoc(getDocRef(id), {
      isArchived: true,
      updatedBy: userId,
      updatedAt: now,
    });
  },

  async delete(id: string) {
    await deleteDoc(getDocRef(id));
  },

  async getByPhone(phone: string) {
    const snapshot = await getDocs(
      query(getCollection(), where("phone", "==", phone), limit(1))
    );
    if (snapshot.empty) return null;
    return docToClient(snapshot.docs[0]);
  },

  async search(searchTerm: string, pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE) {
    const term = searchTerm.toLowerCase();
    const snapshot = await getDocs(
      query(getCollection(), orderBy("createdAt", "desc"), limit(100))
    );
    const filtered = snapshot.docs
      .map(docToClient)
      .filter(
        (c) =>
          c.firstName.toLowerCase().includes(term) ||
          c.lastName.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.company?.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term)
      )
      .slice(0, pageSize);
    return filtered;
  },

  async getStats() {
    const snapshot = await getDocs(getCollection());
    const clients = snapshot.docs.map(docToClient);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      totalClients: clients.length,
      clientsToday: clients.filter((c) => c.createdAt.toDate() >= today).length,
      clientsThisMonth: clients.filter((c) => c.createdAt.toDate() >= monthStart).length,
      totalIndividuals: clients.filter((c) => c.customerType === "individual").length,
      totalBusinesses: clients.filter((c) => c.customerType === "business").length,
    };
  },

  async getRecentClients(limitCount: number = 5) {
    const snapshot = await getDocs(
      query(getCollection(), orderBy("createdAt", "desc"), limit(limitCount))
    );
    return snapshot.docs.map(docToClient);
  },

  async addNote(clientId: string, content: string, userId: string) {
    const now = serverTimestamp() as Timestamp;
    const note: ClientNote = {
      id: crypto.randomUUID(),
      content,
      createdBy: userId,
      createdAt: now,
    };
    await updateDoc(getDocRef(clientId), {
      notes: arrayUnion(note),
      updatedBy: userId,
      updatedAt: now,
    });
    return note;
  },

  async deleteNote(clientId: string, noteId: string, userId: string) {
    const client = await this.getById(clientId);
    if (!client) throw new Error("Client introuvable");
    const note = client.notes.find((n) => n.id === noteId);
    if (!note) throw new Error("Note introuvable");
    const now = serverTimestamp() as Timestamp;
    await updateDoc(getDocRef(clientId), {
      notes: arrayRemove(note),
      updatedBy: userId,
      updatedAt: now,
    });
  },
};
