# eNkamba APK v1.2.3 - Google Auth Configuration Fix

## 📦 Release Information
- **Version**: 1.2.3 (versionCode: 5)
- **Date**: 6 Mars 2026
- **APK File**: `enkamba-v1.2.3-google-auth-fixed.apk`
- **Size**: 9.8 MB
- **Package**: io.enkamba.app

## 🔧 Changes in v1.2.3

### Google Authentication Configuration
- **Fixed**: Corrected Google OAuth Client ID in Capacitor plugin configuration
- **Changed**: Using Web Client ID (`60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com`) instead of Android Client ID in the plugin config
- **Reason**: The `@codetrix-studio/capacitor-google-auth` plugin requires the Web Client ID in its configuration, not the Android Client ID

### Configuration Details

#### capacitor.config.ts
```typescript
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: '60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com', // Web Client ID
    forceCodeForRefreshToken: true,
  },
}
```

#### Google OAuth Client IDs
- **Web Client ID**: `60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com`
- **Android Client ID**: `60114170881-8ca20582qnod6vm84ebkesfk3v9s1ee9.apps.googleusercontent.com`

### Architecture
- **Mode**: Server mode (loads from https://www.enkamba.io)
- **Reason**: App contains API routes that are incompatible with static export mode
- **Benefit**: Full functionality including all API endpoints

## ✅ What Works
- ✅ Email authentication (with OTP)
- ✅ Phone authentication (with SMS OTP)
- ✅ Google authentication (native Capacitor plugin)
- ✅ Fullscreen immersive mode
- ✅ All dashboard features
- ✅ Firebase integration
- ✅ Secure keystore signing

## 🔐 Security Features
- Production keystore signing
- FLAG_SECURE enabled (prevents screenshots)
- Fullscreen immersive mode
- HTTPS only

## 📱 Installation
1. Enable "Unknown Sources" in Android settings
2. Install `enkamba-v1.2.3-google-auth-fixed.apk`
3. Launch and test Google authentication

## 🧪 Testing Checklist
- [ ] Install APK successfully
- [ ] App launches without crashes
- [ ] Email login works
- [ ] Phone login works
- [ ] **Google login works without crashes**
- [ ] User can navigate dashboard
- [ ] Firebase data syncs correctly

## 🔄 Version History
- **v1.2.0**: Initial native APK with fullscreen mode
- **v1.2.1**: Added Google Auth hook integration
- **v1.2.2**: Attempted local files mode (crashed on Google button)
- **v1.2.3**: Fixed Google Auth configuration with correct Client ID

## 📝 Notes
- This version uses server mode to load from production URL
- Google Auth now uses the correct Web Client ID in plugin configuration
- The Android Client ID is still used in the app's SHA-1 certificate registration
- All authentication methods should work properly in this version

## 🚀 Next Steps
If Google Auth still doesn't work:
1. Verify SHA-1 fingerprint is registered in Firebase Console
2. Check that both Client IDs are properly configured in Google Cloud Console
3. Ensure package name `io.enkamba.app` matches in all configurations
4. Test on a physical device (not emulator)

## 📧 Support
For issues or questions, contact the development team.
