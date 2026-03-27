import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let initialized = false;

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

    // ✅ Fixed: also detect relative paths like "Koinonia-TV/file.json"
    const trimmed = raw.trim();
    const isFilePath =
      trimmed.startsWith('/') ||
      trimmed.startsWith('.') ||
      trimmed.endsWith('.json');

    if (isFilePath) {
      // Resolve relative paths from the project root (process.cwd())
      const resolvedPath = path.isAbsolute(trimmed)
        ? trimmed
        : path.resolve(process.cwd(), trimmed);

      console.log(`[Firebase] Resolving service account path: ${resolvedPath}`);

      if (!fs.existsSync(resolvedPath)) {
        console.error(`[Firebase] Service account file not found: ${resolvedPath}`);
        return;
      }

      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      console.log('[Firebase] Loaded service account from file');
    } else {
      // Mode 2 — parse as JSON string (used on Railway/Render/local)
      serviceAccount = JSON.parse(trimmed);
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