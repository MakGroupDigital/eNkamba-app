# 🔧 FIX: reCAPTCHA v2 Configuration - Phone Authentication

## Problem Identified

The app was loading **reCAPTCHA Enterprise** script but trying to use **reCAPTCHA v2** (invisible). These are two incompatible versions, causing the error:

```
FirebaseError: Firebase: Error (auth/invalid-app-credential)
```

## Root Cause

In `src/app/layout.tsx`, the script was loading:
```html
<!-- ❌ WRONG - reCAPTCHA Enterprise -->
<script src="https://www.google.com/recaptcha/api.js?render=SITE_KEY"></script>
```

But the code was trying to use reCAPTCHA v2 (invisible):
```typescript
// ❌ Incompatible with Enterprise
new RecaptchaVerifier(auth, "container", { size: "invisible" })
```

## Solution Applied

### 1. Fixed Script Loading (✅ DONE)

Changed `src/app/layout.tsx` to load reCAPTCHA v2:
```html
<!-- ✅ CORRECT - reCAPTCHA v2 -->
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

### 2. Removed Duplicate Code (✅ DONE)

Removed duplicate reCAPTCHA initialization in `src/app/login/page.tsx` that was causing conflicts.

## What You Need to Do in Firebase Console

### Step 1: Configure reCAPTCHA v2 in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `studio-1153706651-6032b`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone**
5. Look for **reCAPTCHA configuration** section
6. Click the link to configure reCAPTCHA

### Step 2: Select reCAPTCHA v2

- Choose **reCAPTCHA v2** (NOT Enterprise)
- Select **"Invisible reCAPTCHA badge"**

### Step 3: Enter Site Key

Enter the Site Key:
```
6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7
```

### Step 4: Save Configuration

Click **Save** and wait 5-10 minutes for propagation.

## Verification Checklist

After making changes:

- [ ] reCAPTCHA script loads without errors (check browser console)
- [ ] RecaptchaVerifier initializes successfully
- [ ] Phone authentication SMS sends without `auth/invalid-app-credential` error
- [ ] SMS code verification works
- [ ] User is redirected to `/dashboard/miyiki-chat` after successful auth

## Testing Steps

1. Clear browser cache and cookies
2. Restart development server: `npm run dev`
3. Go to login page
4. Try phone authentication with a test number
5. Check browser console for errors
6. If SMS sends successfully, the fix is working

## Files Modified

- ✅ `src/app/layout.tsx` - Fixed reCAPTCHA script loading
- ✅ `src/app/login/page.tsx` - Removed duplicate initialization code

## Environment Variables

Current configuration in `.env.local`:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7
```

This is correct and matches the Firebase configuration.

## Common Issues & Solutions

### Issue: Still getting `auth/invalid-app-credential`

**Solution:**
1. Verify reCAPTCHA v2 is selected (not Enterprise)
2. Check that Site Key matches in Firebase Console
3. Wait 10 minutes for propagation
4. Clear browser cache completely
5. Restart dev server

### Issue: reCAPTCHA script not loading

**Solution:**
1. Check browser console for CSP errors
2. Verify internet connection
3. Check that `https://www.google.com/recaptcha/api.js` is accessible

### Issue: RecaptchaVerifier initialization fails

**Solution:**
1. Ensure `enkamba-recaptcha-container` div exists in DOM
2. Check that `auth` is properly initialized
3. Verify reCAPTCHA script loaded before RecaptchaVerifier creation

## Next Steps

1. Apply the Firebase Console configuration (Step 1-4 above)
2. Test phone authentication
3. If still failing, check browser console for specific error messages
4. Report any new errors with full console output

---

**Status:** Code fix applied ✅  
**Waiting for:** Firebase Console configuration  
**Date:** January 21, 2026
