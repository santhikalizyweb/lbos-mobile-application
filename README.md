# LBOS Mobile

Expo (SDK 58, React Native 0.88) app for the **Lizy Main-Backend**
(`../lizyweb-main-backend`). One sign-in covers all three backend modules,
through `POST /api/auth/login`.

| Signed in as | What the app shows |
|---|---|
| **Admin / Employee** | OMS: dashboard, orders, leads, tasks, reminders, customers & resellers, tickets, fund, notifications, LizyMart catalogue. Partnership overview and commission approvals, and Website-admin enquiries, when the login has those tokens. |
| **Partner** | Partner portal: dashboard (money summary and per-type stats), earnings and transactions, notifications, profile. |

## See it on your phone with Expo Go

1. Install **Expo Go** from the Play Store or App Store. It must support SDK 58, which the current store version does.
2. Start the backend so the phone can reach it:
   ```powershell
   cd ..\lizyweb-main-backend
   php artisan serve --host=0.0.0.0 --port=8000
   ```
3. Start the app:
   ```powershell
   cd lbos-mobile
   npm install        # first time only
   npx expo start
   ```
4. Scan the QR code shown in the terminal. On Android, scan it from the Expo Go app; on iPhone, use the Camera app.
   The phone and the PC must be on the same Wi-Fi. If they can't be, use `npx expo start --tunnel`.
5. On the login screen, enter the server as your PC's Wi-Fi IP (run `ipconfig`), e.g. `192.168.1.10:8000`.

Saving a file reloads the app on the phone. Press `r` in the terminal to reload by hand.

## Build an APK (Gradle)

Requirements: JDK 17 and the Android SDK. `android/local.properties` points Gradle at the SDK.

```powershell
cd android
.\gradlew assembleRelease
# -> android\app\build\outputs\apk\release\app-release.apk
```

The `android` folder is generated from `app.json` by `npx expo prebuild --platform android`.
Rerun that after changing `app.json` or adding a package with native code. Prebuild
re-applies the settings in `app.json`: package `com.lizyweb.lbos`, plain-HTTP allowed through
`expo-build-properties`, and `plugins/withShortCxxPath.js`.

On Windows, `withShortCxxPath` builds the native C++ part in `%TEMP%\lbos-cxx` instead of
`android\app\.cxx`. This keeps library object paths under the 260-character path limit.

The release build is signed with the debug keystore. Before publishing to the Play Store,
create your own keystore and set `signingConfigs.release` in `android/app/build.gradle`,
or build with EAS (`eas build`).

## Develop

```powershell
npx expo start       # dev server and QR code for Expo Go
npx tsc --noEmit     # type check
npm run lint
npm test
npx expo-doctor      # checks package versions match the Expo SDK
```

Add packages with `npx expo install <package>` so the version matches SDK 58.
Expo Go can only run packages that are built into it. For other native libraries,
build a development build (`npx expo run:android`) instead of using Expo Go.

## Server address

The login screen asks for the backend address the first time. It is remembered and can be
changed with "Change" under the password field.

- `https://api.yourdomain.com` (production)
- `192.168.1.10:8000` (your PC on the same Wi-Fi)
- `10.0.2.2:8000` (Android emulator reaching the same PC)

## How it talks to the backend

`src/api/client.ts` sends each request with the token of the module it belongs to:

| Module | URL prefix | Token |
|---|---|---|
| OMS | `/api/...` | `tokens.oms` |
| Partnership | `/api/v1/...` | `tokens.partnership` |
| Universal (website admin) | `/api/admin/...` | `tokens.universal` |

Sign-out revokes every token on its module's logout route. If any request returns 401,
the app drops the session and returns to the login screen.

## Layout

```
App.tsx, index.js   entry (registerRootComponent)
app.json            Expo config (name, package, plugins)
plugins/            config plugin for the Windows build path
src/
  api/          client.ts (fetch wrapper), constants.ts (statuses mirrored from the backend)
  auth/         AuthContext.tsx (single sign-in, session storage)
  hooks/        useApi.ts (load / paginate / refresh-on-focus)
  components/   ui.tsx (cards, badges, chips, sheets, forms)
  navigation/   RootNavigator.tsx (staff tabs, partner tabs)
  screens/      LoginScreen, staff/*, partner/*
  utils/        format.ts (₹ money, dates, labels)
_old-react-native-cli/   previous non-Expo native folders (backup; safe to delete)
```
