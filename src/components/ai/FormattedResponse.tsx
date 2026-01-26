'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Search, Code2, CheckCircle2 } from 'lucide-react';

interface FormattedResponseProps {
  isThinking: boolean;
  isStreaming: boolean;
  content: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  options?: {
    searchWeb?: boolean;
    analysis?: boolean;
    reflection?: boolean;
    code?: boolean;
  };
}

export function FormattedResponse({
  isThinking,
  isStreaming,
  content,
  sources,
  options,
}: FormattedResponseProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Streaming du contenu
  useEffect(() => {
    if (!isStreaming || currentIndex >= content.length) return;

    const timer = setTimeout(() => {
      setDisplayedContent((prev) => prev + content[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, 10);

    return () => clearTimeout(timer);
  }, [isStreaming, content, currentIndex]);

  // Phase de réflexion
  if (isThinking) {
    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
          <div>
            <p className="font-semibold text-blue-900">Réflexion en cours...</p>
            <p className="text-sm text-blue-700">L'IA analyse votre question</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Options utilisées */}
      {options && (
        <div className="flex flex-wrap gap-2">
          {options.searchWeb && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Recherche Web
            </Badge>
          )}
          {options.analysis && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Analyse
            </Badge>
          )}
          {options.reflection && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Réflexion
            </Badge>
          )}
          {options.code && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Code2 className="h-3 w-3" />
              Code
            </Badge>
          )}
        </div>
      )}

      {/* Contenu formaté */}
      <Card className="p-6 bg-white border-gray-200">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {parseAndRenderContent(displayedContent)}
        </div>

        {isStreaming && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Génération en cours...
          </div>
        )}
      </Card>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <Card className="p-4 bg-gray-50 border-gray-200">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Sources
          </h4>
          <div className="space-y-2">
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded hover:bg-gray-100 transition-colors"
              >
                <p className="font-medium text-sm text-blue-600 hover:underline">
                  {source.title}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {source.snippet}
                </p>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function parseAndRenderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let codeBlock = '';
  let inCode = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(
          <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
            <code>{codeBlock}</code>
          </pre>
        );
        codeBlock = '';
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBlock += line + '\n';
      continue;
    }

    // Titres
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold mt-6 mb-3 text-gray-900">
          {line.replace('# ', '')}
        </h1>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold mt-5 mb-2 text-gray-800">
          {line.replace('## ', '')}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-semibold mt-4 mb-2 text-gray-700">
          {line.replace('### ', '')}
        </h3>
      );
      continue;
    }

    // Listes
    if (line.startsWith('- ')) {
      elements.push(
        <li key={`li-${i}`} className="ml-4 text-gray-700 my-1">
          {line.replace('- ', '')}
        </li>
      );
      continue;
    }

    // Paragraphes
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="text-gray-700 my-3 leading-relaxed">
          {line}
        </p>
      );
    }
  }

  return elements;
}
