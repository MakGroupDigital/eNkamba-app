import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { remote_web_search } from '@/lib/web-search';

interface RequestBody {
  message: string;
  options: {
    searchWeb: boolean;
    analysis: boolean;
    reflection: boolean;
    code: boolean;
  };
}

const genai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, options } = body;

    // Effectuer la recherche web si demandée
    let searchContext = '';
    if (options.searchWeb) {
      try {
        const searchResults = await remote_web_search({ query: message });
        if (searchResults && searchResults.length > 0) {
          searchContext = '\n\nRésultats de recherche web:\n';
          searchResults.forEach((result: any, idx: number) => {
            searchContext += `${idx + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.url}\n`;
          });
        }
      } catch (error) {
        console.error('Erreur lors de la recherche web:', error);
      }
    }

    // Construire le prompt avec les options
    let systemPrompt = 'Tu es un assistant IA utile et informatif. Réponds en français.';
    
    if (options.reflection) {
      systemPrompt += ' Réfléchis profondément à la question avant de répondre.';
    }
    if (options.analysis) {
      systemPrompt += ' Fournis une analyse approfondie et détaillée.';
    }
    if (options.code) {
      systemPrompt += ' Si pertinent, fournis des exemples de code.';
    }

    // Ajouter le contexte de recherche au message
    const fullMessage = searchContext ? `${message}${searchContext}` : message;

    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Créer un stream de réponse
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream(fullMessage);

          for await (const chunk of result.stream) {
            const text = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }

          controller.close();
        } catch (error) {
          console.error('Erreur Gemini:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Erreur API:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête' },
      { status: 500 }
    );
  }
}
