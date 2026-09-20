import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getFirebaseWebConfig = () => ({
  apiKey: process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_WEB_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_WEB_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_WEB_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

export async function GET() {
  const firebaseConfig = getFirebaseWebConfig();
  const vapidKey = process.env.FIREBASE_WEB_VAPID_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const requiredValues = {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    vapidKey,
  };
  const missing = Object.entries(requiredValues)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const enabled = missing.length === 0;

  return NextResponse.json(
    { enabled, missing, firebaseConfig: enabled ? firebaseConfig : null, vapidKey: enabled ? vapidKey : null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}