"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getAuth, getDb } from "@/src/firebase";
import type { User, UserRole } from "@/src/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authInstance = getAuth();
    const dbInstance = getDb();
    const unsubscribe = onAuthStateChanged(authInstance, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(dbInstance, "users", fbUser.uid));
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            console.error(
              `[Auth] Document users/${fbUser.uid} introuvable. Sans ce document, le profil et souvent les règles Firestore échouent.`
            );
            setUser(null);
          }
        } catch (err) {
          console.error("[Auth] Impossible de lire users/{uid}:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const role = user?.role ?? null;

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(getAuth(), email, password);
  };

  const logOut = async () => {
    await signOut(getAuth());
    setFirebaseUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, user, role, isLoading, signIn, logOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
