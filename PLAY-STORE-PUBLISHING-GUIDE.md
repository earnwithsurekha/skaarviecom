# SKAARVI Google Play Publishing Guide

Last verified against Google Play requirements: September 24, 2026.

This guide is specific to the Android project in this repository.

## Current Android Configuration

| Setting | Current value |
| --- | --- |
| App name | SKAARVI |
| Package/application ID | `com.skaarvi.marketplace` |
| Version name | `1.0` |
| Version code | `1` |
| Minimum Android version | API 24 (Android 7.0) |
| Target Android version | API 36 (Android 16) |
| App type | Capacitor shell loading `https://skaarvi.shop` |
| Firebase configuration | `android/app/google-services.json` exists |
| Current artifact | Debug APK |
| Play Store artifact needed | Signed release AAB |

The existing debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`
is for testing only. Do not upload it as the production release.

## Important Blockers Before Submission

Complete these items before submitting the app for review:

- [ ] Add a public privacy policy page on `https://skaarvi.shop`.
- [ ] Add an in-app account deletion option.
- [ ] Add a public web page where users can request account and data deletion.
- [ ] Create a dedicated Play review account with stable credentials.
- [ ] Configure secure release signing.
- [ ] Generate and test a signed Android App Bundle (`.aab`).
- [ ] Prepare the Play Store icon, feature graphic, and phone screenshots.
- [ ] Complete the Data safety and Financial features declarations accurately.
- [ ] Test the production website and all important user journeys from the app.

The repository currently has no privacy-policy or account-deletion page. Google
Play requires both an in-app deletion path and an external web deletion resource
when users can create accounts.

## 1. Create or Verify the Play Console Account

Open [Google Play Console](https://play.google.com/console/).

Complete the developer account setup, identity verification, contact details,
and any device verification requested by Google.

Choose the account type carefully:

- Use an organization account if SKAARVI is operated by a registered business.
- Use a personal account only if the app is genuinely published by an individual.
- The public developer name, address, email, and phone may be displayed according
  to the account type and monetization settings.

### New personal account testing requirement

For personal developer accounts created after November 13, 2023, Google requires:

- A closed test with at least 12 opted-in testers.
- Every required tester must remain opted in continuously for at least 14 days.
- Production access must then be requested from the Play Console dashboard.
- The application asks about tester engagement, feedback, changes made, and
  production readiness.

Internal testing is recommended first but does not replace the required closed
test.

## 2. Confirm the Permanent Package Name

The package name is:

```text
com.skaarvi.marketplace
```

It appears in:

- `capacitor.config.json`
- `android/app/build.gradle`
- Firebase Android configuration

A Play Store package name is unique and permanent. It cannot be reused after an
app is created. Confirm this value before creating the Play Console app.

## 3. Prepare Privacy and Account Deletion

### Privacy policy

Publish a privacy policy at a stable HTTPS URL, for example:

```text
https://skaarvi.shop/privacy-policy
```

The policy should describe, at minimum:

- Legal entity and contact information.
- Personal data collected: name, email, phone, address, and profile details.
- Account credentials and authentication processing.
- Orders, purchase history, returns, and transaction records.
- Reseller/manufacturer business, tax, KYC, bank, UPI, wallet, earnings, and
  withdrawal information where applicable.
- Uploaded images and documents.
- Support messages and live chat.
- Product clicks, saves, shares, referrals, and analytics.
- Notification/device tokens and Firebase processing.
- Why each data category is collected and how long it is retained.
- Service providers and data sharing.
- Encryption and security practices.
- User rights, account deletion, and data deletion process.
- A contact method for privacy requests.

The policy must match actual production behavior. Do not copy a generic policy
without checking every SDK and backend integration.

### Account deletion

Because users can create accounts, implement both:

1. An in-app path such as `Profile > Account > Delete account`.
2. A public web page such as:

```text
https://skaarvi.shop/account-deletion
```

The web page must identify SKAARVI, explain how to request deletion, list data
that is deleted or retained, explain legitimate retention periods, and provide a
working submission method.

Add the external deletion URL to the Data safety form in Play Console.

## 4. Create a Secure Upload Key

Google Play App Signing should manage the app signing key. You retain a separate
upload key used to sign every AAB sent to Google.

Never commit a keystore or its passwords to Git.

Create a secure directory outside the repository, then run this in PowerShell:

```powershell
New-Item -ItemType Directory -Force C:\SkaarviSecrets
keytool -genkeypair -v `
  -keystore C:\SkaarviSecrets\skaarvi-upload-key.jks `
  -alias skaarvi-upload `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

Use strong, unique passwords and securely back up:

- `skaarvi-upload-key.jks`
- Keystore password
- Key alias
- Key password

Store at least two encrypted backups controlled by the organization. Do not send
these secrets through chat, email, source control, or issue trackers.

Verify the key:

```powershell
keytool -list -v `
  -keystore C:\SkaarviSecrets\skaarvi-upload-key.jks `
  -alias skaarvi-upload
```

## 5. Configure Release Signing

Create `android/keystore.properties` locally:

```properties
storeFile=C:/SkaarviSecrets/skaarvi-upload-key.jks
storePassword=REPLACE_WITH_KEYSTORE_PASSWORD
keyAlias=skaarvi-upload
keyPassword=REPLACE_WITH_KEY_PASSWORD
```

Add these rules to the repository `.gitignore` before creating the file:

```gitignore
# Android release signing secrets
/android/keystore.properties
*.jks
*.keystore
```

Do not place passwords directly in `android/app/build.gradle`.

In `android/app/build.gradle`, add this before the `android {` block:

```groovy
def keystorePropertiesFile = rootProject.file('keystore.properties')
def keystoreProperties = new Properties()

if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside the existing `android {}` block, add:

```groovy
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
```

Update the existing release build type:

```groovy
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

## 6. Set the Release Version

The current values are in `android/app/build.gradle`:

```groovy
versionCode 1
versionName "1.0"
```

Rules:

- `versionCode` must be a positive integer and must increase for every Play
  Console upload. It can never be reused for this package.
- `versionName` is user-visible and may follow semantic versioning.

Examples:

| Release | versionCode | versionName |
| --- | ---: | --- |
| First Play release | 1 | 1.0.0 |
| First patch | 2 | 1.0.1 |
| Feature release | 3 | 1.1.0 |

The current `targetSdkVersion 36` satisfies the Android 16/API 36 requirement
that applies to new apps and updates from August 31, 2026.

## 7. Prepare Firebase Push Notifications

The Android Firebase file exists at:

```text
android/app/google-services.json
```

In Firebase Console, confirm that its Android app uses exactly:

```text
com.skaarvi.marketplace
```

After Play App Signing is enabled:

1. Open Play Console > Release > Setup > App signing.
2. Copy the SHA-1 and SHA-256 fingerprints for the **app signing certificate**.
3. Open Firebase Console > Project settings > Android app.
4. Add both app-signing fingerprints.
5. Download an updated `google-services.json` if Firebase requests it.
6. Run `npm run android:sync` and rebuild.

The app's merged manifest currently includes Internet, network state,
notification, wake-lock, and Firebase messaging receiver permissions. Explain
push notification usage in the privacy policy and Data safety answers.

## 8. Build the Signed Android App Bundle

From the repository root:

```powershell
npm ci
npm run android:assets
npm run android:sync
Set-Location android
.\gradlew.bat clean bundleRelease
Set-Location ..
```

Expected artifact:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

If the bundle is unsigned or signing fails, check:

- `android/keystore.properties` exists.
- `storeFile` uses a valid absolute path.
- Alias and passwords are correct.
- The release build type references `signingConfigs.release`.

Verify the signed bundle:

```powershell
jarsigner -verify -verbose -certs `
  android\app\build\outputs\bundle\release\app-release.aab
```

Generate a signing report:

```powershell
Set-Location android
.\gradlew.bat signingReport
Set-Location ..
```

Do not upload `app-debug.apk`. Upload `app-release.aab`.

## 9. Test the Release Build Before Upload

An AAB is not directly installable. Use one of these approaches:

### Recommended: Play internal testing

Upload the AAB to Internal testing, add tester email addresses, publish the
internal release, and install it using the Play-provided opt-in link.

This validates the actual APK generated and signed by Google Play.

### Optional: local bundletool testing

Download `bundletool` from the official Android repository and run:

```powershell
java -jar bundletool-all.jar build-apks `
  --bundle=android\app\build\outputs\bundle\release\app-release.aab `
  --output=skaarvi.apks `
  --ks=C:\SkaarviSecrets\skaarvi-upload-key.jks `
  --ks-key-alias=skaarvi-upload

java -jar bundletool-all.jar install-apks --apks=skaarvi.apks
```

Test at least:

- Fresh install and first launch.
- No-network and poor-network behavior.
- Customer registration and login.
- Product browsing, cart, checkout, and order history.
- Reseller and manufacturer login and core workflows.
- Password reset/OTP flows.
- Push notification permission and delivery.
- Back button behavior and external links.
- Account deletion.
- Small phone and modern large-screen device layouts.
- Server maintenance or unavailable-server behavior.

Because this Capacitor app loads `https://skaarvi.shop`, the production website
must remain available and mobile-compatible. A broken or blank remote page can
cause review rejection even when the Android bundle itself builds successfully.

## 10. Create the App in Play Console

In Play Console, select **Home > Create app** and enter:

| Field | Suggested value |
| --- | --- |
| App name | SKAARVI |
| Default language | English (India), or the actual primary language |
| App or game | App |
| Free or paid | Free, unless the app itself has an upfront download price |
| User contact email | A monitored SKAARVI support address |

Accept the policy, export-law, and Play App Signing declarations.

Select **Shopping** as the likely category, then choose only tags that accurately
describe the marketplace.

## 11. Prepare the Store Listing

### Suggested short description

Maximum 80 characters:

```text
Shop products and grow your reseller business with SKAARVI.
```

### Suggested full description

Use only claims that are true in production:

```text
SKAARVI is a marketplace for customers, resellers, and manufacturers.

Customers can discover products, manage their cart, place orders, and track
purchases. Resellers can explore products, manage referrals, monitor earnings,
and build their store. Manufacturers can manage products, inventory, orders,
analytics, earnings, and settlements.

Key features:
- Browse and discover marketplace products
- Secure account access for each user role
- Cart, checkout, orders, and return management
- Reseller product sharing, referrals, wallet, and earnings tools
- Manufacturer product, inventory, and order management
- Notifications and customer support

An internet connection is required.
```

Do not use unverifiable claims such as “best,” “number one,” guaranteed income,
or guaranteed earnings.

### Required graphics

| Asset | Requirement |
| --- | --- |
| Play Store icon | 512 x 512, 32-bit PNG with alpha, maximum 1024 KB |
| Feature graphic | 1024 x 500, JPEG or 24-bit PNG without alpha |
| Phone screenshots | Minimum 2; JPEG or 24-bit PNG; each side 320-3840 px |

For stronger merchandising, provide at least four portrait screenshots at
1080 x 1920. Suggested screens:

1. Product discovery/home.
2. Product details.
3. Cart or checkout.
4. Order tracking.
5. Reseller dashboard.
6. Manufacturer product/inventory management.

Screenshots must show the real app, current branding, and no private customer
information. Avoid device frames, rankings, prices used as promotional claims,
“Download now,” and unrelated artwork.

## 12. Complete App Content Declarations

Open **Policy and programs > App content**.

### Privacy policy

Enter the public HTTPS privacy-policy URL. The same policy should be reachable
inside the app.

### Ads

Answer based on production behavior. Product listings and normal marketplace
promotions are commercial content, but paid/sponsored placements or ad SDKs may
require selecting **Contains ads**. Do not guess; review every banner source and
SDK before answering.

### App access

The app has authenticated and role-restricted areas. Provide Google with stable,
non-expiring test credentials and concise steps.

Recommended reviewer access package:

- Customer test account.
- Reseller test account.
- Manufacturer test account if manufacturer features are part of the listing.
- Any OTP/PIN required.
- Instructions for role selection and navigation.
- Confirmation that credentials work against production during review.

Do not require reviewers to contact you or use a personal phone number to obtain
access.

### Target audience

Choose the genuine intended age groups. A reseller marketplace with wallets,
bank details, earnings, and business tools is normally intended for adults. Do
not select children unless the entire app and data handling comply with Families
policies.

### Content rating

Complete the IARC questionnaire accurately. Unrated apps cannot remain
published.

### Financial features

Every published app must complete this declaration, even if no financial feature
applies.

SKAARVI includes reseller wallets, earnings, commissions, settlements, and
withdrawals. Review whether Play Console classifies any implementation as:

- Mobile payments or digital wallet.
- Money transfer.
- Rewards, points, or incentives.
- Other financial support/service.

Do not declare lending, banking, investment, or cryptocurrency features unless
they truly exist. Keep supporting business and regulatory documentation ready if
Play Console requests it.

SKAARVI appears to sell physical goods. Google Play Billing is not used for
physical goods. If the app later sells digital content, subscriptions, or app
functionality, review the Play Billing requirement before launch.

### Data safety

The declaration must cover data collected by the website, backend, Firebase,
and every third-party SDK, not only Android permissions.

Likely categories to review for SKAARVI include:

- Name, email address, phone number, and physical address.
- User IDs and account information.
- Purchase history, orders, returns, and transaction records.
- Bank account, IFSC, UPI, wallet, earnings, and withdrawal information.
- Photos and uploaded files, including business/KYC documents.
- Support and live-chat messages.
- Product interactions, saved products, clicks, shares, and referrals.
- Device or other identifiers used for push notifications.
- App interaction and diagnostics data, if collected.

For each category, declare:

- Whether it is collected, shared, or both.
- Whether collection is required or optional.
- Its purpose: app functionality, account management, analytics, fraud
  prevention, developer communications, and so on.
- Whether data is encrypted in transit.
- Whether users can request deletion.

Do not submit the form until it matches the privacy policy and actual server/SDK
behavior.

### Other declarations

Complete every item Play Console marks as required, including:

- News and magazine declaration.
- Government-app declaration.
- COVID-19 declaration.
- Sensitive permission declarations, if requested.
- Advertising ID declaration, if requested.

For the current Android build, the main runtime-sensitive permission is push
notifications. The app does not currently declare SMS, call log, contacts,
location, camera, or storage permissions in its merged manifest.

## 13. Upload to Internal Testing

1. Open **Test and release > Testing > Internal testing**.
2. Create a release.
3. Accept or configure Play App Signing.
4. Upload `app-release.aab`.
5. Add release notes, for example:

```text
Initial SKAARVI Android release for internal testing.
```

6. Resolve every blocking error and review each warning.
7. Save and publish the internal release.
8. Add testers or a Google Group.
9. Share the opt-in link.
10. Install from Google Play and complete the release test checklist.

Also review:

- Pre-launch report.
- Android vitals.
- Device compatibility.
- App bundle explorer.
- Policy status.

## 14. Run Closed Testing When Required

For a new personal developer account subject to testing requirements:

1. Open **Testing > Closed testing**.
2. Create a track, such as `production-readiness`.
3. Add at least 12 testers through an email list or Google Group.
4. Upload the tested AAB and publish the closed release.
5. Ensure all testers use the opt-in link.
6. Keep at least 12 testers continuously opted in for at least 14 days.
7. Ask testers to use core workflows and provide feedback.
8. Record feedback, defects, fixes, and test devices.
9. Apply for production access from the dashboard.

Google may require additional testing if testers were not continuously opted in
or engagement was insufficient.

## 15. Submit the Production Release

After testing and production access:

1. Open **Test and release > Production**.
2. Select **Create new release**.
3. Upload the signed AAB with a new, unused `versionCode`.
4. Add clear release notes.
5. Review Play's automated checks.
6. Fix all blocking issues.
7. Select the desired countries/regions and pricing/distribution settings.
8. Use managed publishing if you want manual control after approval.
9. Send all pending changes for review.
10. Monitor Play Console and the account-owner email for review questions.

For the first release, a staged rollout is safer than immediate 100% rollout
when Play Console makes that option available.

## 16. Future Update Process

For every Android-shell or native-plugin update:

1. Increase `versionCode`.
2. Update `versionName` when appropriate.
3. Regenerate assets if the logo/splash changed.
4. Run `npm run android:sync`.
5. Build `bundleRelease` using the same upload key.
6. Test through Internal testing.
7. Upload the new AAB to the desired track.
8. Use a staged rollout and monitor Android vitals.

Website-only changes normally do not require a new Android release because the
app loads `https://skaarvi.shop`. However, a new AAB is required for changes to:

- Capacitor or native plugins.
- Android permissions.
- Firebase Android configuration.
- Launcher icon or splash screen.
- Package metadata or version.
- Native security or compatibility behavior.

## 17. Common Rejection Risks for This App

Review these before submission:

- Missing privacy policy or account deletion paths.
- Reviewer cannot log in or complete OTP.
- Production website is unavailable or displays a blank/error page.
- App is judged as a low-value website wrapper with poor mobile behavior.
- Store screenshots do not match the current app.
- Data safety omits bank, order, chat, analytics, or notification data.
- Financial features declaration conflicts with wallet/withdrawal behavior.
- Misleading earning or income claims for resellers.
- Broken checkout, order, return, or support workflows.
- Push notifications fail because Firebase signing fingerprints are missing.
- AAB is unsigned, signed with the debug key, or reuses a version code.
- Store listing promises features that are not available to reviewers.

A remote-web Capacitor app should provide a reliable mobile experience, useful
app-specific value, clear navigation, graceful network failure handling, and no
broken desktop-only screens.

## Final Go-Live Checklist

### Application

- [ ] `https://skaarvi.shop` is healthy and uses valid HTTPS.
- [ ] Customer, reseller, and manufacturer core flows work on Android.
- [ ] Privacy policy is public and linked in-app.
- [ ] In-app account deletion works.
- [ ] External account-deletion page works.
- [ ] Reviewer accounts are active and documented.
- [ ] Push notifications work in the Play-installed build.
- [ ] Offline/unavailable-server behavior is understandable.

### Android release

- [ ] Package name is confirmed as `com.skaarvi.marketplace`.
- [ ] `versionCode` is unused and incremented.
- [ ] `versionName` is correct.
- [ ] Target SDK remains compliant (currently API 36).
- [ ] Release uses the private upload key, not the debug key.
- [ ] Upload key and passwords are securely backed up.
- [ ] Signed `app-release.aab` passes verification.
- [ ] Internal Play install has been tested.

### Play Console

- [ ] Store listing text is accurate.
- [ ] 512 x 512 icon uploaded.
- [ ] 1024 x 500 feature graphic uploaded.
- [ ] At least two real phone screenshots uploaded; four are recommended.
- [ ] Privacy policy entered.
- [ ] Data safety completed accurately.
- [ ] Account deletion URL entered.
- [ ] Ads declaration completed.
- [ ] App access credentials provided.
- [ ] Target audience completed.
- [ ] Content rating completed.
- [ ] Financial features declaration completed.
- [ ] Countries/regions and distribution selected.
- [ ] Closed-test requirement completed if applicable.
- [ ] Pre-launch report reviewed.
- [ ] Production release sent for review.

## Official References

- [Create and set up an app](https://support.google.com/googleplay/android-developer/answer/9859152)
- [Sign an Android app](https://developer.android.com/studio/publish/app-signing)
- [Personal account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Prepare an app for review](https://support.google.com/googleplay/android-developer/answer/9859455)
- [Data safety requirements](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Store listing asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Financial features declaration](https://support.google.com/googleplay/android-developer/answer/13849271)
- [Google Play payments policy guidance](https://support.google.com/googleplay/android-developer/answer/10281818)
