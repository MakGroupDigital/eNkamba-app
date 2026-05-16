'use client';

import { useCallback, useEffect, useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TranslationResult = {
  translatedText: string;
  detectedSourceLanguage: string;
  sourceLanguageName: string;
  targetLanguage: string;
  targetLanguageName: string;
  service: string;
};

const TRANSLATION_LANGUAGES = [
  { code: 'fr', label: 'Francais' },
  { code: 'en', label: 'Anglais' },
  { code: 'ln', label: 'Lingala' },
  { code: 'sw', label: 'Swahili' },
  { code: 'pt', label: 'Portugais' },
  { code: 'es', label: 'Espagnol' },
  { code: 'de', label: 'Allemand' },
  { code: 'it', label: 'Italien' },
  { code: 'nl', label: 'Neerlandais' },
  { code: 'ar', label: 'Arabe' },
  { code: 'zh', label: 'Chinois' },
];

interface TranslationDialogProps {
  open: boolean;
  sourceText: string;
  title?: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  onUseTranslation?: (translatedText: string) => void;
}

export function TranslationDialog({
  open,
  sourceText,
  title = 'Traduction',
  description = 'Langue source detectee automatiquement, puis traduction dans la langue choisie.',
  onOpenChange,
  onUseTranslation,
}: TranslationDialogProps) {
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [translationError, setTranslationError] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = useCallback(async (language: string) => {
    const cleanText = sourceText.trim();
    if (!cleanText) {
      setTranslation(null);
      setTranslationError('Aucun texte a traduire');
      return;
    }

    setIsTranslating(true);
    setTranslationError('');
    setTranslation(null);

    try {
      const response = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          targetLanguage: language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Impossible de traduire le texte');
      }

      setTranslation(data as TranslationResult);
    } catch (error) {
      setTranslationError(error instanceof Error ? error.message : 'Impossible de traduire le texte');
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText]);

  useEffect(() => {
    if (!open) {
      setTranslation(null);
      setTranslationError('');
      setIsTranslating(false);
      return;
    }

    void translateText(targetLanguage);
  }, [open, targetLanguage, translateText]);

  const handleTargetLanguageChange = (language: string) => {
    setTargetLanguage(language);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Texte original</p>
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {sourceText || 'Aucun texte saisi'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Traduire en</p>
            <Select value={targetLanguage} onValueChange={handleTargetLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une langue" />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATION_LANGUAGES.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {translation
                  ? `${translation.sourceLanguageName} vers ${translation.targetLanguageName}`
                  : 'Traduction'}
              </p>
              {isTranslating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            {translationError ? (
              <p className="text-sm text-red-600">{translationError}</p>
            ) : translation ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {translation.translatedText}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Traduction en cours...</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void translateText(targetLanguage)}
              disabled={isTranslating || !sourceText.trim()}
            >
              {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
              Retraduire
            </Button>
            {onUseTranslation && (
              <Button
                type="button"
                onClick={() => {
                  if (!translation?.translatedText) return;
                  onUseTranslation(translation.translatedText);
                  onOpenChange(false);
                }}
                disabled={!translation?.translatedText || isTranslating}
              >
                Utiliser
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
