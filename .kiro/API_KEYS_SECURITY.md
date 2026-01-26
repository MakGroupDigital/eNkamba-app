# API Keys Security Best Practices

## ⚠️ IMPORTANT: Never Commit API Keys to GitHub

### Why It's Dangerous
- 🔴 **Public Exposure**: Anyone can see your keys on GitHub
- 🔴 **Automated Scanning**: Bots scan GitHub for exposed credentials
- 🔴 **Financial Risk**: Attackers can use your keys and generate huge costs
- 🔴 **Compromised Keys**: Once exposed, the key must be regenerated

### Current Setup (✅ Secure)

#### 1. Local Development
```bash
# .env.local (NOT committed to Git)
GOOGLE_GENAI_API_KEY=AIzaSyCT0YHCqcGa500VSHy8xLVOVUFtujihyis
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### 2. .gitignore Configuration
```
# local env files
.env*.local
.env
```

✅ `.env.local` is properly ignored and won't be committed

#### 3. GitHub Repository
- ✅ No API keys in code
- ✅ No `.env.local` file
- ✅ Safe to share publicly

### Production Deployment (Vercel)

#### Setting Environment Variables on Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - `GOOGLE_GENAI_API_KEY` (Secret)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Public)
   - `CLERK_SECRET_KEY` (Secret)
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (Public)

#### Vercel Automatically Loads Them
- Vercel reads from `.env.local` during build
- Environment variables are injected at runtime
- Keys are never exposed in the built code

### If a Key Gets Exposed

1. **Immediately Regenerate** the key in Google Cloud Console
2. **Update** `.env.local` locally
3. **Update** Vercel environment variables
4. **Commit** the code (without the key)
5. **Monitor** usage for suspicious activity

### Files Structure

```
eNkamba/
├── .env.local              ← NOT in Git (local only)
├── .env.example            ← Template for developers
├── .gitignore              ← Includes .env.local
├── src/
│   └── app/api/
│       └── ai/enhanced-chat/
│           └── route.ts    ← Uses process.env.GOOGLE_GENAI_API_KEY
└── package.json            ← No secrets here
```

### .env.example (For Reference)
```bash
# Copy this file to .env.local and fill in your actual values
GOOGLE_GENAI_API_KEY=your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_key_here
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_key_here
```

### Accessing Keys in Code

#### Server-Side (Safe)
```typescript
// src/app/api/ai/enhanced-chat/route.ts
const genai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');
```

#### Client-Side (Public Keys Only)
```typescript
// src/components/auth.tsx
const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
```

### Key Naming Convention
- `NEXT_PUBLIC_*` = Public keys (safe to expose)
- `*` (no prefix) = Secret keys (server-side only)

### Checklist
- ✅ `.env.local` in `.gitignore`
- ✅ No API keys in source code
- ✅ No API keys in commits
- ✅ Environment variables set on Vercel
- ✅ Using `process.env` to access keys
- ✅ Server-side keys not exposed to client

### Resources
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
