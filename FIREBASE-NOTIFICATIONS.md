# Firebase Notifications

SKAARVI uses one Firebase project for browser and Android push delivery. In-app
bell notifications and order emails continue to work if Firebase is unavailable.

## 1. Web App

Configure these runtime environment variables on the frontend service:

```dotenv
FIREBASE_WEB_API_KEY=your_web_api_key
FIREBASE_WEB_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_WEB_PROJECT_ID=your-project-id
FIREBASE_WEB_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_WEB_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_WEB_APP_ID=your_web_app_id
FIREBASE_WEB_MEASUREMENT_ID=your_optional_measurement_id
FIREBASE_WEB_VAPID_KEY=your_public_web_push_certificate_key
```

Generate or copy the VAPID key from **Firebase Console > Project settings >
Cloud Messaging > Web configuration > Web Push certificates**. Use the public
key, not a service account key.

The application serves the Firebase config from
`/api/notifications/firebase-config` and the background worker from
`/firebase-messaging-sw.js`. An authenticated customer or manufacturer enables
browser push by clicking the notification bell and accepting the browser prompt.

## 2. Backend Sender

The backend requires a private Firebase Admin credential for the same Firebase
project. Store it in AWS Secrets Manager and expose one of these credential
methods to the backend ECS task.

Preferred single-secret method:

```dotenv
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_service_account_json
```

Alternative split fields:

```dotenv
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Never add the service account JSON, private key, or base64 value to frontend
environment variables or source control.

Apply the idempotent device-token migration before deploying the backend:

```powershell
Set-Location backend
npm run migrate:fcm
```

## 3. Android App

1. Add an Android app in the same Firebase project.
2. Use package name `com.skaarvi.marketplace`.
3. Download `google-services.json`.
4. Place it at `android/app/google-services.json`.
5. Sync and rebuild:

```powershell
npm run android:sync
npm run android:apk
```

The web app ID cannot be used as the Android app ID. The Android configuration
must come from the Android app registered in Firebase Console.

## 4. Verification

1. Confirm `/api/notifications/firebase-config` returns `enabled: true` and an
   empty `missing` array.
2. Sign in, click the notification bell, and grant browser permission.
3. Confirm an active `web` token exists in `device_tokens`.
4. Install the rebuilt APK, sign in, grant notifications, and confirm an active
   `android` token exists.
5. Place an order and verify customer and manufacturer bell, push, and email
   delivery.

If Firebase delivery fails, order processing still succeeds and the in-app
notification remains available.
