import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminAppInstance: App | null = null;
let adminDbInstance: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK (server-side only)
 * Uses service account credentials from environment variable
 */
function initializeFirebaseAdmin(): App {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAppInstance = existingApps[0];
    return adminAppInstance;
  }

  // Parse service account JSON from environment variable
  const serviceAccount = process.env.FIREBASE_ADMIN_SDK_JSON
    ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON)
    : undefined;

  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_ADMIN_SDK_JSON environment variable is not set. " +
      "Please set it with your Firebase service account credentials."
    );
  }

  adminAppInstance = initializeApp({
    credential: cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized");
  return adminAppInstance;
}

/**
 * Get Firestore Admin instance (server-side)
 * Lazy initialization - only initializes when first accessed
 */
function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    initializeFirebaseAdmin(); // Ensure admin app is initialized
    adminDbInstance = getFirestore();
  }
  return adminDbInstance;
}

// Proxy object for lazy initialization
export const adminDb = new Proxy({} as Firestore, {
  get(target, prop) {
    const db = getAdminDb();
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});
