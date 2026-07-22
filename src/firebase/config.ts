import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth as _getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";
import {
  getFirestore as _getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
  };
}

function initFirebase() {
  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    _auth = _getAuth(_app);
    _db = _getFirestore(_app);
    return;
  }

  const config = getConfig();
  const hasConfig = config.apiKey && config.projectId;

  if (hasConfig) {
    _app = initializeApp(config);
    _auth = _getAuth(_app);
    _db = _getFirestore(_app);

    if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true") {
      connectAuthEmulator(_auth, "http://localhost:9099", { disableWarnings: true });
      if (_db) connectFirestoreEmulator(_db, "localhost", 8080);
    }
  }
}

export function getApp(): FirebaseApp {
  if (!_app) initFirebase();
  if (!_app) throw new Error("Firebase not initialized. Set NEXT_PUBLIC_FIREBASE_* env vars.");
  return _app;
}

export function getAuth(): Auth {
  if (!_auth) initFirebase();
  if (!_auth) throw new Error("Firebase Auth not initialized. Set NEXT_PUBLIC_FIREBASE_* env vars.");
  return _auth;
}

export function getDb(): Firestore {
  if (!_db) initFirebase();
  if (!_db) throw new Error("Firestore not initialized. Set NEXT_PUBLIC_FIREBASE_* env vars.");
  return _db;
}
