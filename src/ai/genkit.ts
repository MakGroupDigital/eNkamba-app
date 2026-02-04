import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Note: Genkit utilise Gemini. Pour Groq, on utilise l'API route /api/ai/enhanced-chat
// Ce fichier est gardé pour compatibilité mais Groq est utilisé en priorité
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
