import { TavilyClient } from '@tavily/core';

const tavilyClient = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY || '',
});

export async function remote_web_search(params: { query: string }) {
  try {
    // Si pas de clé Tavily, retourner des résultats mockés
    if (!process.env.TAVILY_API_KEY) {
      console.warn('TAVILY_API_KEY not set, using mock results');
      return getMockResults(params.query);
    }

    const response = await tavilyClient.search(params.query, {
      maxResults: 5,
      includeAnswer: true,
    });

    return response.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet || result.content,
    }));
  } catch (error) {
    console.error('Erreur recherche web Tavily:', error);
    // Fallback sur les résultats mockés
    return getMockResults(params.query);
  }
}

export async function searchWeb(query: string) {
  return remote_web_search({ query });
}

function getMockResults(query: string) {
  return [
    {
      title: 'Résultat 1 - ' + query,
      url: 'https://example.com/1',
      snippet: 'Ceci est un résultat de recherche pertinent pour votre requête.',
    },
    {
      title: 'Résultat 2 - ' + query,
      url: 'https://example.com/2',
      snippet: 'Un autre résultat pertinent avec des informations utiles.',
    },
    {
      title: 'Résultat 3 - ' + query,
      url: 'https://example.com/3',
      snippet: 'Résultat supplémentaire contenant des détails importants.',
    },
  ];
}
