/*
  Lightweight dynamic Firebase initializer.
  - Lazy-loads firebase-admin for server-side usages to avoid importing it on the client or when not installed.
  - Export `getFirebaseAdmin()` for server-side code and `getFirebaseClient()` for browser code.
  Install packages when using Firebase: `npm install firebase firebase-admin`
*/

declare global {
  var __firebase_admin: unknown;
}

export async function getFirebaseAdmin() {
  if (global.__firebase_admin) return global.__firebase_admin;
  const admin = await import('firebase-admin');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase admin credentials in environment variables.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: process.env.FIREBASE_DB_URL,
    });
  }

  global.__firebase_admin = admin;
  return admin;
}

export function getFirebaseClient() {
  // Client-side firebase SDK should be initialized in components/pages that run in the browser.
  // This helper returns the `firebase/app` module if needed.
  return import('firebase/app').then((mod) => mod);
}
