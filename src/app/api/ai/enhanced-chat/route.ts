import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, options } = body;

    // Effectuer la recherche web si demandée
    let searchContext = '';
    let hasSearchResults = false;
    
    if (options.searchWeb) {
      try {
        // Ajouter un timeout pour la recherche web
        const searchPromise = remote_web_search({ query: message });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Search timeout')), 5000)
        );
        
        const searchResults = await Promise.race([searchPromise, timeoutPromise]) as any[];
        
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
        // Continuer sans résultats de recherche
      }
    }

    // Construire le prompt avec les options
    let systemPrompt = 'Tu es eNkamba AI, un assistant IA intelligent développé par Global Solution and Services SARL. Tu es un modèle LLM avancé conçu pour aider les utilisateurs avec leurs questions et tâches. Réponds toujours en français de manière professionnelle et utile.';
    
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
      finalMessage = `${message}${searchContext}`;
    }

    // Appeler Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it', // Groq model - Gemma 2 9B (currently available)
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: finalMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('Erreur Groq:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'appel à Groq API' },
        { status: groqResponse.status }
      );
    }

    // Créer un stream de réponse
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = groqResponse.body?.getReader();
          if (!reader) {
            throw new Error('Pas de reader disponible');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // Ignorer les erreurs de parsing
                }
              }
            }
          }

          controller.close();
        } catch (error: any) {
          console.error('Erreur stream Groq:', error);
          const errorMessage = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
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
      { error: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}
