import axios from 'axios';
import * as cheerio from 'cheerio';

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: 'google' | 'duckduckgo' | 'duckduckgo-html';
};

export async function remote_web_search(params: { query: string }) {
  const googleResults = await searchWithGoogleCustomSearch(params.query);
  if (googleResults.length > 0) {
    return googleResults;
  }

  const duckDuckGoHtmlResults = await searchWithDuckDuckGoHtml(params.query);
  if (duckDuckGoHtmlResults.length > 0) {
    return duckDuckGoHtmlResults;
  }

  return searchWithDuckDuckGoInstantAnswer(params.query);
}

async function searchWithGoogleCustomSearch(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY?.trim();
  const cx = (
    process.env.GOOGLE_CUSTOM_SEARCH_CX ||
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID ||
    process.env.GOOGLE_CSE_ID
  )?.trim();

  if (!apiKey || !cx) {
    console.warn('Recherche Google Custom Search non configurée: GOOGLE_CUSTOM_SEARCH_API_KEY et GOOGLE_CUSTOM_SEARCH_CX requis.');
    return [];
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx,
        q: query,
        num: 5,
        safe: 'active',
        hl: 'fr',
      },
      timeout: 7000,
    });

    const items = Array.isArray(response.data?.items) ? response.data.items : [];
    return items
      .map((item: any) => ({
        title: String(item.title || 'Résultat Google'),
        url: String(item.link || ''),
        snippet: String(item.snippet || item.htmlSnippet || ''),
        source: 'google' as const,
      }))
      .filter((result: WebSearchResult) => result.url && result.snippet)
      .slice(0, 5);
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.error?.message || error?.message || 'Erreur inconnue';
    console.error(`Erreur Google Custom Search${status ? ` (${status})` : ''}:`, message);
    return [];
  }
}

async function searchWithDuckDuckGoHtml(query: string): Promise<WebSearchResult[]> {
  try {
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      timeout: 8000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (compatible; eNkambaAI/1.0; +https://enkamba.com)',
      },
    });

    const $ = cheerio.load(response.data);
    const results: WebSearchResult[] = [];

    $('.result').each((_, element) => {
      if (results.length >= 6) {
        return false;
      }

      const title = $(element).find('.result__a').first().text().replace(/\s+/g, ' ').trim();
      const rawUrl = $(element).find('.result__a').first().attr('href') || '';
      const snippet = $(element).find('.result__snippet').first().text().replace(/\s+/g, ' ').trim();
      const url = normalizeDuckDuckGoUrl(rawUrl);

      if (title && url && snippet) {
        results.push({
          title,
          url,
          snippet,
          source: 'duckduckgo-html',
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Erreur recherche DuckDuckGo HTML:', error);
    return [];
  }
}

function normalizeDuckDuckGoUrl(rawUrl: string) {
  if (!rawUrl) {
    return '';
  }

  try {
    const url = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    const parsedUrl = new URL(url, 'https://duckduckgo.com');
    const redirectedUrl = parsedUrl.searchParams.get('uddg');
    return redirectedUrl ? decodeURIComponent(redirectedUrl) : parsedUrl.href;
  } catch {
    return rawUrl;
  }
}

async function searchWithDuckDuckGoInstantAnswer(query: string): Promise<WebSearchResult[]> {
  try {
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_html: 1,
        skip_disambig: 1,
      },
      timeout: 5000,
    });

    const results: WebSearchResult[] = [];

    if (response.data.AbstractText) {
      results.push({
        title: response.data.Heading || query,
        url: response.data.AbstractURL || '#',
        snippet: response.data.AbstractText,
        source: 'duckduckgo',
      });
    }

    if (response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
      response.data.RelatedTopics.slice(0, 4).forEach((topic: any) => {
        if (topic.Text && !topic.Topics) {
          results.push({
            title: topic.FirstURL?.split('/').pop() || 'Résultat',
            url: topic.FirstURL || '#',
            snippet: topic.Text,
            source: 'duckduckgo',
          });
        }
      });
    }

    return results.filter((result) => result.url !== '#').slice(0, 5);
  } catch (error) {
    console.error('Erreur recherche DuckDuckGo:', error);
    return [];
  }
}

export async function searchWeb(query: string) {
  return remote_web_search({ query });
}
