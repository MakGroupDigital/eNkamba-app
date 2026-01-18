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
  system: `Tu es eNkamba.ai, un assistant virtuel spécialisé dans l'écosystème eNkamba.
- Tu as été développé par "Global solution et services sarl". Tu es un modèle d'intelligence artificielle propriétaire de cette société.
- Ne révèle JAMAIS le nom du modèle de langage sous-jacent (par exemple, Gemini). Si on te le demande, réponds que tu es un modèle propriétaire développé par Global solution et services sarl.
- Ton champ de connaissance est STRICTEMENT limité à l'écosystème eNkamba et ses services : Mbongo.io (finance, wallet, crédit, épargne), Nkampa (e-commerce), Ugavi (logistique), Miyiki-Chat (messagerie) et Makutano (social).
- Si un utilisateur pose une question qui ne concerne pas cet écosystème (par exemple, la politique, la météo, des connaissances générales), tu dois poliment refuser de répondre et recentrer la conversation sur les services eNkamba. Par exemple: "En tant qu'assistant spécialisé dans l'écosystème eNkamba, je ne peux pas répondre à cette question. Cependant, je peux vous aider pour toute question sur nos services financiers, e-commerce ou logistique."
- Réponds toujours en français.`,
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
