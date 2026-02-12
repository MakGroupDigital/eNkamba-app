# API Routes 404 Error - Fix Guide

## Problem
The error shows: `Failed to load resource: the server responded with a status of 404 (Not Found)` for `/api/chat/accept-transfer/`

## Root Cause
The dev server hasn't recompiled to recognize the new API routes that were just created:
- `/api/chat/transfer-money/route.ts`
- `/api/chat/accept-transfer/route.ts`
- `/api/chat/reject-transfer/route.ts`

## Solution

### Step 1: Stop the Dev Server
Press `Ctrl+C` in the terminal where the dev server is running.

### Step 2: Clear Next.js Cache
```bash
rm -rf .next
```

### Step 3: Restart the Dev Server
```bash
npm run dev
```

Or if using yarn:
```bash
yarn dev
```

## What This Does
1. Stops the current development server
2. Removes the `.next` build cache
3. Restarts the server, which will:
   - Rebuild all routes
   - Discover the new API routes
   - Recompile TypeScript
   - Hot-reload the application

## Expected Result
After restart, the API routes should be available:
- `POST /api/chat/transfer-money` ✅
- `POST /api/chat/accept-transfer` ✅
- `POST /api/chat/reject-transfer` ✅

## Verification
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try sending money in chat
4. You should see:
   - `POST /api/chat/transfer-money` → 200 OK
   - `POST /api/chat/accept-transfer` → 200 OK (when accepting)
   - `POST /api/chat/reject-transfer` → 200 OK (when rejecting)

## If Still Not Working

### Check 1: Verify Files Exist
```bash
ls -la src/app/api/chat/*/route.ts
```

Should show:
```
src/app/api/chat/accept-transfer/route.ts
src/app/api/chat/reject-transfer/route.ts
src/app/api/chat/transfer-money/route.ts
```

### Check 2: Check for Syntax Errors
```bash
npm run build
```

This will show any TypeScript or syntax errors in the API routes.

### Check 3: Check Console Logs
Look for any error messages in the terminal where dev server is running.

### Check 4: Hard Refresh Browser
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- This clears browser cache and reloads

## File Locations
All API routes are in the correct Next.js App Router structure:
```
src/app/api/chat/
├── transfer-money/
│   └── route.ts
├── accept-transfer/
│   └── route.ts
└── reject-transfer/
    └── route.ts
```

## Notes
- Next.js requires the dev server to be restarted when new route files are added
- The routes are automatically discovered by Next.js App Router
- No additional configuration needed
- All routes use `export async function POST()`
