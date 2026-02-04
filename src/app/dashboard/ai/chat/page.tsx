'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useFirestoreAiChat } from '@/hooks/useFirestoreAiChat';
import { AINavIcon } from '@/components/icons/service-icons';
import { Send, Loader2, MessageSquare, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AiChatDefaultPage() {
  const { createAiChat, sendAiMessage, aiChats, isLoading, deleteAiChat } = useFirestoreAiChat();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsSending(true);

    try {
      // Créer un nouveau chat
      const chatId = await createAiChat(userMessage.substring(0, 50));

      // Obtenir la réponse de l'IA via Groq API
      let aiResponseText = '';
      const response = await fetch('/api/ai/enhanced-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          options: {
            searchWeb: false,
            analysis: false,
            reflection: false,
            code: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'appel à l\'API');
      }

      // Lire le stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Pas de réponse');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiResponseText += decoder.decode(value);
      }

      // Sauvegarder les messages dans le chat
      await sendAiMessage(chatId, userMessage, aiResponseText);

      // Rediriger vers le chat avec les messages
      window.location.href = `/dashboard/ai/chat/${chatId}`;
    } catch (error) {
      console.error('Erreur:', error);
      setInputValue(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo et titre */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <AINavIcon size={40} className="text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">eNkamba.ai</h1>
            <p className="text-muted-foreground mt-2">
              Votre assistant intelligent pour toutes vos questions
            </p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card
            className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setInputValue('Explique-moi comment fonctionne eNkamba')}
          >
            <p className="font-medium text-sm">À propos d'eNkamba</p>
            <p className="text-xs text-muted-foreground mt-1">
              Découvrez l'écosystème
            </p>
          </Card>
          <Card
            className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setInputValue('Quels sont les services disponibles?')}
          >
            <p className="font-medium text-sm">Services disponibles</p>
            <p className="text-xs text-muted-foreground mt-1">
              Explorez nos offres
            </p>
          </Card>
          <Card
            className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setInputValue('Comment puis-je créer un compte?')}
          >
            <p className="font-medium text-sm">Créer un compte</p>
            <p className="text-xs text-muted-foreground mt-1">
              Commencez maintenant
            </p>
          </Card>
          <Card
            className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setInputValue('Posez-moi une question...')}
          >
            <p className="font-medium text-sm">Poser une question</p>
            <p className="text-xs text-muted-foreground mt-1">
              Demandez n'importe quoi
            </p>
          </Card>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Posez votre question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending}
              className="rounded-lg"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !inputValue.trim()}
              className="rounded-lg"
              size="icon"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            eNkamba.ai peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  );
}
