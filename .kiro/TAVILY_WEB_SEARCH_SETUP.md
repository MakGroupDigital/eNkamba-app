# Tavily Web Search API Setup - January 26, 2026

## Overview
Tavily est une API de recherche web gratuite et facile à intégrer. Elle permet à l'IA d'accéder à des informations en temps réel.

## Why Tavily?
- ✅ Gratuit (5,000 requêtes/mois)
- ✅ Facile à intégrer
- ✅ Résultats de qualité
- ✅ Pas de limite de débit pour les petits projets
- ✅ Support du français

## Getting Started

### 1. Create a Tavily Account
1. Go to https://tavily.com
2. Click "Sign Up"
3. Create your account (email + password)
4. Verify your email

### 2. Get Your API Key
1. Log in to Tavily dashboard
2. Go to "API Keys" section
3. Copy your API key
4. Add to `.env.local`:
```bash
TAVILY_API_KEY=your_api_key_here
```

### 3. Test the Integration
The web search will automatically work when:
- User enables "Recherche Web" option in chat
- AI receives the search results
- AI includes them in the response

## How It Works

### Flow
```
User Message + "Recherche Web" enabled
    ↓
API Route receives request
    ↓
Tavily API searches the web
    ↓
Results are formatted and added to prompt
    ↓
Gemini AI receives context with search results
    ↓
AI generates response with real-time information
```

### Example
**User**: "Quelle est la dernière version de Node.js?"
**With Web Search**:
1. Tavily searches for "latest Node.js version"
2. Returns current version info
3. Gemini includes this in response
4. User gets accurate, up-to-date answer

## Code Integration

### Web Search Function
```typescript
// src/lib/web-search.ts
import { TavilyClient } from '@tavily/core';

const tavilyClient = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY || '',
});

export async function remote_web_search(params: { query: string }) {
  const response = await tavilyClient.search(params.query, {
    maxResults: 5,
    includeAnswer: true,
  });

  return response.results.map((result: any) => ({
    title: result.title,
    url: result.url,
    snippet: result.snippet || result.content,
  }));
}
```

### API Route Integration
```typescript
// src/app/api/ai/enhanced-chat/route.ts
if (options.searchWeb) {
  const searchResults = await remote_web_search({ query: message });
  searchContext = formatResults(searchResults);
}

const fullMessage = `${message}${searchContext}`;
const result = await model.generateContentStream(fullMessage);
```

## Features

### Search Options
- ✅ Real-time web search
- ✅ Multiple results (up to 5)
- ✅ Snippet extraction
- ✅ Source URLs
- ✅ Fallback to mock results if API unavailable

### Error Handling
- If `TAVILY_API_KEY` not set → uses mock results
- If API fails → gracefully falls back to mock results
- No breaking errors

## Pricing

### Free Tier
- 5,000 searches/month
- Perfect for development
- No credit card required

### Paid Tiers
- Pro: $10/month (50,000 searches)
- Enterprise: Custom pricing

## Troubleshooting

### "No access to real-time search engine"
**Solution**: Add `TAVILY_API_KEY` to `.env.local`

### Search results not appearing
1. Check `.env.local` has `TAVILY_API_KEY`
2. Verify API key is correct
3. Check browser console for errors
4. Restart dev server: `npm run dev -- -p 9002`

### API rate limit exceeded
- Free tier: 5,000/month
- Wait until next month or upgrade plan

## Testing

### Local Testing
1. Enable "Recherche Web" in chat UI
2. Ask a question about current events
3. Check that results appear in response

### Example Questions
- "Quelle est la dernière version de Python?"
- "Qui a gagné la Coupe du Monde 2024?"
- "Quel est le prix du Bitcoin aujourd'hui?"

## Production Deployment

### On Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add: `TAVILY_API_KEY=your_key`
5. Redeploy

### On Other Platforms
Add `TAVILY_API_KEY` to your environment variables

## Security
- ✅ API key stored in `.env.local` (not in Git)
- ✅ Server-side only (not exposed to client)
- ✅ Safe to use in production

## Next Steps
1. Sign up at https://tavily.com
2. Get your API key
3. Add to `.env.local`
4. Restart dev server
5. Test web search in chat

## Resources
- [Tavily Documentation](https://docs.tavily.com)
- [Tavily API Reference](https://api.tavily.com/docs)
- [GitHub: @tavily/core](https://github.com/tavilyai/tavily-node)
