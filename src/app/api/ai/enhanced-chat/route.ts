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
    let hasSearchResults = false;
    
    if (options.searchWeb) {
      try {
        const searchResults = await remote_web_search({ query: message });
        if (searchResults && searchResults.length > 0) {
          hasSearchResults = true;
          searchContext = '\n\n=== RÉSULTATS DE RECHERCHE WEB EN TEMPS RÉEL ===\n';
          searchResults.forEach((result: any, idx: number) => {
            searchContext += `\n[${idx + 1}] ${result.title}\n`;
            searchContext += `Contenu: ${result.snippet}\n`;
            searchContext += `Source: ${result.url}\n`;
          });
          searchContext += '\n=== FIN DES RÉSULTATS DE RECHERCHE ===\n';
          searchContext += '\nIMPORTANT: Utilise les informations ci-dessus pour répondre à la question. Ces résultats sont en temps réel et à jour.\n';
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

    // Si recherche web activée, ajouter une instruction spéciale
    if (hasSearchResults) {
      systemPrompt += ' Tu as accès à des résultats de recherche web en temps réel. Utilise-les pour fournir des informations actuelles et précises.';
    }

    // Construire le message final
    let finalMessage = message;
    if (searchContext) {
      finalMessage = `${systemPrompt}\n\n${message}${searchContext}`;
    } else {
      finalMessage = `${systemPrompt}\n\n${message}`;
    }

    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Créer un stream de réponse
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream(finalMessage);

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
