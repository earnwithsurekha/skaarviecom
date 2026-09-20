# Android APK

The Android project is a Capacitor shell for the deployed application at
`https://skaarvi.shop`. It requires an internet connection. Website-only
changes are served immediately and do not require rebuilding the APK.

## Requirements

- Node.js 22 or newer for Capacitor 8
- JDK 17 or newer, with `JAVA_HOME` configured
- Android SDK Platform 36, with `ANDROID_HOME` configured

## Build

```powershell
npm install
npm run android:apk
```

The installable debug APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

After changing `assets/logo.svg`, regenerate the Android icons and splash
screens before building:

```powershell
npm run android:assets
```

## Install On A Device

Enable USB debugging, connect the Android device, and run:

```powershell
npm run android:install
```

Alternatively, transfer `app-debug.apk` to the device and allow installation
from the file manager when Android prompts for permission.

This APK uses Android's debug signing key and is intended for direct testing.
A Play Store release requires a private release keystore and an Android App
Bundle (`.aab`).