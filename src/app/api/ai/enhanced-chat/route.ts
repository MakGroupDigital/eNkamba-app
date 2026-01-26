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

    // Créer un stream de réponse
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Phase 1: Réflexion
          if (options.reflection) {
            controller.enqueue(
              encoder.encode('# Réflexion\n\n')
            );
            controller.enqueue(
              encoder.encode('Analyse de votre question...\n\n')
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // Phase 2: Recherche Web
          let searchResults = null;
          if (options.searchWeb) {
            controller.enqueue(
              encoder.encode('## Recherche Web\n\n')
            );
            controller.enqueue(
              encoder.encode('Recherche des informations les plus récentes...\n\n')
            );

            try {
              searchResults = await remote_web_search({ query: message });
              if (searchResults && searchResults.length > 0) {
                controller.enqueue(
                  encoder.encode(`Trouvé ${searchResults.length} résultats pertinents.\n\n`)
                );
              }
            } catch (error) {
              console.error('Erreur recherche web:', error);
            }
          }

          // Phase 3: Analyse
          if (options.analysis) {
            controller.enqueue(
              encoder.encode('## Analyse Approfondie\n\n')
            );
            controller.enqueue(
              encoder.encode(generateAnalysis(message, searchResults) + '\n\n')
            );
          }

          // Phase 4: Réponse principale
          controller.enqueue(
            encoder.encode('## Réponse\n\n')
          );
          controller.enqueue(
            encoder.encode(generateMainResponse(message, options) + '\n\n')
          );

          // Phase 5: Code si demandé
          if (options.code) {
            controller.enqueue(
              encoder.encode('## Exemples de Code\n\n')
            );
            controller.enqueue(
              encoder.encode(generateCodeExamples(message) + '\n\n')
            );
          }

          // Phase 6: Conclusion
          controller.enqueue(
            encoder.encode('## Conclusion\n\n')
          );
          controller.enqueue(
            encoder.encode(generateConclusion(message) + '\n\n')
          );

          controller.close();
        } catch (error) {
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

function generateAnalysis(message: string, searchResults: any): string {
  const analysis = `
### Points Clés

- **Sujet Principal**: ${extractMainTopic(message)}
- **Contexte**: Analyse contextuelle de votre question
- **Pertinence**: Informations directement liées à votre demande

### Approche

1. Comprendre les nuances de votre question
2. Identifier les éléments clés
3. Fournir une réponse structurée et complète
`;
  return analysis.trim();
}

function generateMainResponse(message: string, options: any): string {
  const response = `
### Réponse Détaillée

Votre question porte sur: **${extractMainTopic(message)}**

#### Points Importants

- **Point 1**: Explication détaillée du premier aspect
- **Point 2**: Développement du deuxième aspect
- **Point 3**: Clarification du troisième aspect

#### Détails Supplémentaires

La réponse à votre question nécessite une compréhension approfondie de plusieurs éléments:

1. **Fondamentaux**: Les bases essentielles
2. **Application**: Comment cela s'applique concrètement
3. **Cas d'Usage**: Exemples pratiques et réels
4. **Bonnes Pratiques**: Recommandations et conseils

#### Résumé

En résumé, la réponse à votre question est multifacette et dépend de plusieurs facteurs contextuels.
`;
  return response.trim();
}

function generateCodeExamples(message: string): string {
  const code = `
### Exemple 1: Implémentation Simple

\`\`\`javascript
// Exemple de code simple
function example() {
  console.log('Ceci est un exemple');
  return true;
}
\`\`\`

### Exemple 2: Implémentation Avancée

\`\`\`typescript
// Exemple plus avancé avec TypeScript
interface Config {
  name: string;
  value: number;
}

class Example {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  execute(): void {
    console.log(\`Exécution avec \${this.config.name}\`);
  }
}
\`\`\`

### Exemple 3: Cas d'Usage Réel

\`\`\`python
# Exemple en Python
def process_data(data):
    """Traite les données"""
    result = []
    for item in data:
        result.append(item * 2)
    return result
\`\`\`
`;
  return code.trim();
}

function generateConclusion(message: string): string {
  const conclusion = `
### Points à Retenir

- La réponse dépend du contexte spécifique
- Il existe plusieurs approches possibles
- Les bonnes pratiques sont essentielles
- L'expérience pratique est importante

### Prochaines Étapes

1. Appliquer les concepts présentés
2. Tester avec vos propres données
3. Adapter selon vos besoins spécifiques
4. Consulter la documentation officielle si nécessaire

### Ressources Utiles

- Documentation officielle
- Tutoriels pratiques
- Communautés d'entraide
- Exemples de code
`;
  return conclusion.trim();
}

function extractMainTopic(message: string): string {
  // Extraire le sujet principal du message
  const words = message.split(' ');
  return words.slice(0, Math.min(5, words.length)).join(' ');
}
