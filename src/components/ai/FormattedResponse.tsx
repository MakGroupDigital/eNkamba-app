'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, Search, Code2, CheckCircle2, Copy, Check } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as XLSX from 'xlsx';

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
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Réinitialiser quand le contenu change
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      setCurrentIndex(content.length);
    } else {
      setCurrentIndex(0);
      setDisplayedContent('');
    }
  }, [content, isStreaming]);

  // Streaming du contenu
  useEffect(() => {
    if (!isStreaming || currentIndex >= content.length) return;

    const timer = setTimeout(() => {
      setDisplayedContent((prev) => prev + content[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, 5);

    return () => clearTimeout(timer);
  }, [isStreaming, content, currentIndex]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!contentRef.current) return;
    
    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: 'response.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' },
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleExportWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: parseContentToDocx(displayedContent),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'response.docx';
    link.click();
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['eNkamba AI Response'],
      [],
      ...displayedContent.split('\n').map((line) => [line]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Response');
    XLSX.writeFile(wb, 'response.xlsx');
  };

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

  // Pas de contenu
  if (!displayedContent && !isStreaming) {
    return null;
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
        <div
          ref={contentRef}
          className="space-y-4"
        >
          {parseAndRenderContent(displayedContent)}
        </div>

        {isStreaming && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Génération en cours...
          </div>
        )}
      </Card>

      {/* Boutons d'action */}
      {!isStreaming && displayedContent && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copier
              </>
            )}
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            📄 PDF
          </Button>
          <Button
            onClick={handleExportWord}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            📝 Word
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            📊 Excel
          </Button>
        </div>
      )}

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
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(
          <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-xs">
            <code>{codeBlock}</code>
          </pre>
        );
        codeBlock = '';
        inCode = false;
        codeLanguage = '';
      } else {
        inCode = true;
        codeLanguage = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCode) {
      codeBlock += line + '\n';
      continue;
    }

    // Titres H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-primary pb-2">
          {line.replace('# ', '')}
        </h1>
      );
      continue;
    }

    // Titres H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold mt-6 mb-3 text-gray-800 border-l-4 border-primary pl-3">
          {line.replace('## ', '')}
        </h2>
      );
      continue;
    }

    // Titres H3
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
        <li key={`li-${i}`} className="ml-6 text-gray-700 my-1 list-disc">
          {line.replace('- ', '')}
        </li>
      );
      continue;
    }

    // Listes numérotées
    if (line.match(/^\d+\.\s/)) {
      elements.push(
        <li key={`oli-${i}`} className="ml-6 text-gray-700 my-1 list-decimal">
          {line.replace(/^\d+\.\s/, '')}
        </li>
      );
      continue;
    }

    // Texte en gras
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <p key={`p-${i}`} className="text-gray-700 my-3 leading-relaxed">
          {parts.map((part, idx) =>
            idx % 2 === 1 ? (
              <strong key={idx} className="font-bold text-gray-900">
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>
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

function parseContentToDocx(content: string) {
  const lines = content.split('\n');
  const children: Paragraph[] = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('- ')) {
      children.push(
        new Paragraph({
          text: line.replace('- ', ''),
          bullet: { level: 0 },
        })
      );
    } else if (line.trim()) {
      children.push(
        new Paragraph({
          text: line,
          spacing: { line: 360 },
        })
      );
    }
  }

  return children;
}
