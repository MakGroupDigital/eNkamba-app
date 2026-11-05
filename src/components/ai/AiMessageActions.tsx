'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Share2, Square, ThumbsDown, ThumbsUp, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownToPlainText } from '@/components/ai/SafeMarkdown';

type Feedback = 'up' | 'down' | null;
const FEEDBACK_KEY = 'enkamba-ai-feedback';

function readFeedback(messageId: string): Feedback {
  try {
    return (JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}')[messageId] as Feedback) || null;
  } catch {
    return null;
  }
}

function writeFeedback(messageId: string, value: Feedback) {
  try {
    const all = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
    if (value) all[messageId] = value; else delete all[messageId];
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable (private mode): feedback stays for this session only.
  }
}

// ENK-001: Copy, helpful/not helpful, listen and share under every AI answer.
export function AiMessageActions({ messageId, content }: { messageId: string; content: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const plainText = markdownToPlainText(content);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => setFeedback(readFeedback(messageId)), [messageId]);
  useEffect(() => () => { if (isSpeaking) window.speechSynthesis.cancel(); }, [isSpeaking]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const toggleFeedback = (value: Exclude<Feedback, null>) => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    writeFeedback(messageId, next);
  };

  const toggleSpeech = () => {
    if (!canSpeak) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = document.documentElement.lang || 'fr-FR';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Réponse Kenz AI', text: plainText });
        return;
      } catch {
        // User cancelled the native share sheet.
        return;
      }
    }
    await copy();
  };

  const buttonClass = 'grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60';

  return (
    <div className="mt-1 flex items-center gap-0.5" role="toolbar" aria-label="Actions sur la réponse">
      <button type="button" onClick={copy} className={buttonClass} aria-label={copied ? 'Réponse copiée' : 'Copier la réponse'} title="Copier">
        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
      </button>
      <button type="button" onClick={() => toggleFeedback('up')} className={cn(buttonClass, feedback === 'up' && 'text-emerald-300')} aria-pressed={feedback === 'up'} aria-label="Réponse utile" title="Utile">
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => toggleFeedback('down')} className={cn(buttonClass, feedback === 'down' && 'text-[#F51B2B]')} aria-pressed={feedback === 'down'} aria-label="Réponse pas utile" title="Pas utile">
        <ThumbsDown className="h-4 w-4" />
      </button>
      {canSpeak && (
        <button type="button" onClick={toggleSpeech} className={buttonClass} aria-pressed={isSpeaking} aria-label={isSpeaking ? 'Arrêter la lecture' : 'Écouter la réponse'} title={isSpeaking ? 'Arrêter' : 'Écouter'}>
          {isSpeaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}
      <button type="button" onClick={share} className={buttonClass} aria-label="Partager la réponse" title="Partager">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}
