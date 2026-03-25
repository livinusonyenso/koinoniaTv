import * as admin from 'firebase-admin';
import * as fs from 'fs';

let initialized = false;

/**
 * Initialises Firebase Admin SDK once.
 *
 * Supports two modes via FIREBASE_SERVICE_ACCOUNT env var:
 *   1. File path  — e.g. /home/ontiqaqp/Koinonia-TV/firebase-service-account.json
 *   2. JSON string — e.g. {"type":"service_account","project_id":...}
 *
 * Silently skips if the var is missing so the app boots without Firebase.
 */
export function initFirebase(): void {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
    return;
  }

  try {
    let serviceAccount: object;

    // Check if it's a file path or a JSON string
    const isFilePath = raw.trim().startsWith('/') || raw.trim().startsWith('.');

    if (isFilePath) {
      // Mode 1 — read from file (used on cPanel/shared hosting)
      if (!fs.existsSync(raw)) {
        console.error(`[Firebase] Service account file not found: ${raw}`);
        return;
      }
      const fileContent = fs.readFileSync(raw, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      console.log('[Firebase] Loaded service account from file');
    } else {
      // Mode 2 — parse as JSON string (used on Railway/Render/local)
      serviceAccount = JSON.parse(raw);
      console.log('[Firebase] Loaded service account from env JSON');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    initialized = true;
    console.log('[Firebase] Admin SDK initialised successfully');

  } catch (err: any) {
    console.error('[Firebase] Init failed:', err.message);
  }
}

/** Returns the Messaging instance, or null when Firebase is not configured. */
export function getMessaging(): admin.messaging.Messaging | null {
  if (!initialized) return null;
  try {
    return admin.messaging();
  } catch {
    return null;
  }
}