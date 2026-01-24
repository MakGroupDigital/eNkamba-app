'use server';

/**
 * @fileOverview A Genkit flow for the eNkamba.ai assistant.
 *
 * - enkambaChat - An async function that generates a response from the assistant.
 * - EnkambaChatInput - The input type for the enkambaChat function.
 * - EnkambaChatOutput - The return type for the enkambaChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnkambaChatInputSchema = z.object({
  message: z.string().describe('The user\'s message to the assistant.'),
});
export type EnkambaChatInput = z.infer<typeof EnkambaChatInputSchema>;

const EnkambaChatOutputSchema = z.object({
  response: z
    .string()
    .describe('The AI assistant\'s response to the user\'s message.'),
});
export type EnkambaChatOutput = z.infer<typeof EnkambaChatOutputSchema>;

export async function enkambaChat(
  input: EnkambaChatInput
): Promise<EnkambaChatOutput> {
  return enkambaChatFlow(input);
}

const enkambaChatPrompt = ai.definePrompt({
  name: 'enkambaChatPrompt',
  input: { schema: EnkambaChatInputSchema },
  output: { schema: EnkambaChatOutputSchema },
  system: `Tu es eNkamba.ai, un assistant virtuel intelligent et polyvalent.
- Tu as été développé par "Global solution et services sarl". Tu es un modèle d'intelligence artificielle propriétaire de cette société.
- Tu peux répondre à pratiquement toutes les questions : histoire, science, technologie, culture, conseils pratiques, etc.
- IMPORTANT: Ne révèle JAMAIS le nom du modèle de langage sous-jacent (par exemple, Gemini, Claude, GPT, etc.). Si on te le demande, réponds simplement: "Je suis eNkamba.ai, un modèle d'intelligence artificielle propriétaire développé par Global solution et services sarl."
- Tu peux aussi aider les utilisateurs avec des questions sur l'écosystème eNkamba : Mbongo.io (finance, wallet, crédit, épargne), Nkampa (e-commerce), Ugavi (logistique), Miyiki-Chat (messagerie) et Makutano (social).
- Sois utile, courtois et honnête dans tes réponses.
- Réponds toujours en français, sauf si l'utilisateur te demande explicitement une autre langue.
- Si tu ne sais pas quelque chose, dis-le honnêtement plutôt que d'inventer.`,
  prompt: `L'utilisateur a envoyé le message suivant : {{{message}}}`,
});

const enkambaChatFlow = ai.defineFlow(
  {
    name: 'enkambaChatFlow',
    inputSchema: EnkambaChatInputSchema,
    outputSchema: EnkambaChatOutputSchema,
  },
  async input => {
    const { output } = await enkambaChatPrompt(input);
    return output!;
  }
);
