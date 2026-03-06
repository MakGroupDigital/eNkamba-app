# Google Auth Fix - Solution Summary

## Problem
APK v1.2.2 crashed when clicking the "Continuer avec Google" button.

## Root Cause
The Capacitor GoogleAuth plugin was configured with the **Android Client ID** instead of the **Web Client ID**.

## Solution
Changed the `serverClientId` in `capacitor.config.ts` from Android Client ID to Web Client ID:

```typescript
// ❌ BEFORE (v1.2.2) - WRONG
GoogleAuth: {
  serverClientId: '60114170881-8ca20582qnod6vm84ebkesfk3v9s1ee9.apps.googleusercontent.com', // Android ID
}

// ✅ AFTER (v1.2.3) - CORRECT
GoogleAuth: {
  serverClientId: '60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com', // Web ID
}
```

## Why This Matters
The `@codetrix-studio/capacitor-google-auth` plugin requires the **Web Client ID** in its configuration, even for Android apps. The Android Client ID is only used for SHA-1 certificate registration in Firebase/Google Cloud Console.

## Architecture Decision
- **Attempted**: Local files mode (`output: 'export'`)
- **Issue**: Next.js static export is incompatible with API routes
- **Solution**: Reverted to server mode (loads from https://www.enkamba.io)
- **Benefit**: Full functionality including all API endpoints

## Files Changed
1. `capacitor.config.ts` - Updated GoogleAuth serverClientId
2. `next.config.ts` - Reverted to server mode
3. `android/app/build.gradle` - Incremented to v1.2.3 (versionCode 5)

## Result
- ✅ New APK: `enkamba-v1.2.3-google-auth-fixed.apk` (9.8 MB)
- ✅ Google Auth should work without crashes
- ✅ All other features remain functional
- ✅ Pushed to GitHub

## Testing
Install the new APK and test:
1. Email login ✅
2. Phone login ✅
3. **Google login** (should work now)

## Reference
- Web Client ID: `60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com`
- Android Client ID: `60114170881-8ca20582qnod6vm84ebkesfk3v9s1ee9.apps.googleusercontent.com`
- Package: `io.enkamba.app`
- SHA-1: `CC:1F:BC:30:0F:4A:A7:C5:4C:96:A2:B4:D9:C2:CC:3F:0A:90:20:9A`
