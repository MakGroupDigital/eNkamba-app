'use server';

/**
 * @fileOverview A Genkit flow for generating financial reports with anomaly detection.
 *
 * - generateFinancialReport - An async function that generates a financial report.
 * - FinancialReportInput - The input type for the generateFinancialReport function.
 * - FinancialReportOutput - The return type for the generateFinancialReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialReportInputSchema = z.object({
  accountHistory: z
    .string()
    .describe('Un historique détaillé du compte utilisateur, y compris les transactions.'),
});
export type FinancialReportInput = z.infer<typeof FinancialReportInputSchema>;

const FinancialReportOutputSchema = z.object({
  summary: z.string().describe('Un résumé de l\'historique du compte.'),
  anomalies: z.string().describe('Toute anomalie ou risque de sécurité détecté dans l\'historique du compte.'),
  recommendations:
    z.string().describe('Recommandations pour différents produits de compte ou d\'investissement.'),
});
export type FinancialReportOutput = z.infer<typeof FinancialReportOutputSchema>;

export async function generateFinancialReport(
  input: FinancialReportInput
): Promise<FinancialReportOutput> {
  return generateFinancialReportFlow(input);
}

const financialReportPrompt = ai.definePrompt({
  name: 'financialReportPrompt',
  input: {schema: FinancialReportInputSchema},
  output: {schema: FinancialReportOutputSchema},
  prompt: `Vous êtes un expert financier analysant l'historique de compte d'un utilisateur pour fournir un résumé,
identifier les anomalies ou les risques de sécurité, et donner des recommandations en français. Les suggestions sont à titre informatif uniquement et l'utilisateur est responsable des actions qu'il prend.

Analysez l'historique de compte suivant :

{{{accountHistory}}}

Répondez uniquement avec les données JSON structurées, sans texte supplémentaire.`,
});

const generateFinancialReportFlow = ai.defineFlow(
  {
    name: 'generateFinancialReportFlow',
    inputSchema: FinancialReportInputSchema,
    outputSchema: FinancialReportOutputSchema,
  },
  async input => {
    const {output} = await financialReportPrompt(input);
    return output!;
  }
);
