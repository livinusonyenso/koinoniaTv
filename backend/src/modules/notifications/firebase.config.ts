import * as admin from 'firebase-admin';

let initialized = false;

/**
 * Initialises Firebase Admin SDK once.
 * Requires FIREBASE_SERVICE_ACCOUNT env var (JSON string of the service account key).
 * Silently skips if the var is missing so the app boots without Firebase configured.
 */
export function initFirebase(): void {
  if (initialized || admin.apps.length > 0) { initialized = true; return; }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
    return;
  }
  try {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    initialized = true;
    console.log('[Firebase] Admin SDK initialised');
  } catch (err: any) {
    console.error('[Firebase] Init failed:', err.message);
  }
}

/** Returns the Messaging instance, or null when Firebase is not configured. */
export function getMessaging(): admin.messaging.Messaging | null {
  if (!initialized) return null;
  try { return admin.messaging(); } catch { return null; }
}
