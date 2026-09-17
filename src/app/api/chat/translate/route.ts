import { NextRequest, NextResponse } from 'next/server';

const LANGUAGE_NAMES: Record<string, string> = {
  auto: 'Auto',
  ar: 'Arabe',
  de: 'Allemand',
  en: 'Anglais',
  es: 'Espagnol',
  fr: 'Francais',
  hi: 'Hindi',
  it: 'Italien',
  kg: 'Kikongo',
  ln: 'Lingala',
  nl: 'Neerlandais',
  pt: 'Portugais',
  ru: 'Russe',
  sw: 'Swahili',
  tr: 'Turc',
  zh: 'Chinois',
};

function getLanguageName(code: string) {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

function extractGoogleTranslation(payload: unknown) {
  const data = payload as any[];
  const translatedText = Array.isArray(data?.[0])
    ? data[0].map((segment: any[]) => segment?.[0] || '').join('')
    : '';
  const detectedSourceLanguage = typeof data?.[2] === 'string' ? data[2] : 'auto';

  return {
    translatedText,
    detectedSourceLanguage,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage : 'fr';

    if (!text) {
      return NextResponse.json({ error: 'Texte vide' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Texte trop long pour la traduction' }, { status: 413 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', 'auto');
    url.searchParams.set('tl', targetLanguage);
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', text);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kenz-local-translation/1.0',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Service de traduction indisponible' },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const result = extractGoogleTranslation(payload);

    if (!result.translatedText) {
      return NextResponse.json(
        { error: 'Traduction vide renvoyee par le service' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      translatedText: result.translatedText,
      detectedSourceLanguage: result.detectedSourceLanguage,
      sourceLanguageName: getLanguageName(result.detectedSourceLanguage),
      targetLanguage,
      targetLanguageName: getLanguageName(targetLanguage),
      service: 'Google Translate gratuit',
    });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Delai de traduction depasse'
      : 'Impossible de traduire le message';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
