import { useState, useCallback } from 'react';

export type SearchOption = 'web' | 'analysis' | 'reflection' | 'code' | 'none';

export interface AiOptions {
  searchWeb: boolean;
  analysis: boolean;
  reflection: boolean;
  code: boolean;
}

export interface AiResponse {
  id: string;
  thinking: string;
  response: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  sections: Array<{
    title: string;
    content: string;
    type: 'title' | 'subtitle' | 'paragraph' | 'list' | 'code';
  }>;
  isStreaming: boolean;
}

export function useAiEnhanced() {
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AiResponse | null>(null);

  const generateResponse = useCallback(
    async (
      message: string,
      options: AiOptions,
      onChunk?: (chunk: string) => void
    ): Promise<AiResponse> => {
      setIsThinking(true);
      setIsStreaming(false);
      setCurrentResponse(null);

      try {
        // Simuler la phase de réflexion
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsThinking(false);
        setIsStreaming(true);

        // Appeler l'API avec les options
        const response = await fetch('/api/ai/enhanced-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            options,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        // Traiter le streaming
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        let fullResponse = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;
          onChunk?.(chunk);
        }

        setIsStreaming(false);

        // Parser la réponse formatée
        const parsedResponse = parseFormattedResponse(fullResponse);
        setCurrentResponse(parsedResponse);

        return parsedResponse;
      } catch (error) {
        setIsThinking(false);
        setIsStreaming(false);
        console.error('Error in generateResponse:', error);
        throw error;
      }
    },
    []
  );

  return {
    generateResponse,
    isThinking,
    isStreaming,
    currentResponse,
  };
}

function parseFormattedResponse(text: string): AiResponse {
  const sections: AiResponse['sections'] = [];
  const lines = text.split('\n');
  let currentSection = '';
  let currentType: AiResponse['sections'][0]['type'] = 'paragraph';

  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: '',
          type: currentType,
        });
      }
      currentSection = line.replace('# ', '');
      currentType = 'title';
    } else if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: '',
          type: currentType,
        });
      }
      currentSection = line.replace('## ', '');
      currentType = 'subtitle';
    } else if (line.startsWith('- ')) {
      currentType = 'list';
      currentSection += (currentSection ? '\n' : '') + line.replace('- ', '');
    } else if (line.startsWith('```')) {
      currentType = 'code';
    } else if (currentSection) {
      currentSection += (currentSection ? '\n' : '') + line;
    }
  }

  if (currentSection) {
    sections.push({
      title: currentSection,
      content: '',
      type: currentType,
    });
  }

  return {
    id: Date.now().toString(),
    thinking: 'Réflexion en cours...',
    response: text,
    sections,
    isStreaming: false,
  };
}
