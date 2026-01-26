'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useFirestoreAiChat } from '@/hooks/useFirestoreAiChat';
import { useAiEnhanced, type AiOptions } from '@/hooks/useAiEnhanced';
import { FormattedResponse } from '@/components/ai/FormattedResponse';
import { SearchOptions, type SearchOptionsState } from '@/components/ai/SearchOptions';
import { Send, Loader2, Brain, MessageCircle } from 'lucide-react';

export default function AiChatEnhanced() {
  const params = useParams();
  const aiChatId = params.id as string;

  const { loadAiMessages, sendAiMessage } = useFirestoreAiChat();
  const { generateResponse, isThinking, isStreaming, currentResponse } = useAiEnhanced();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchOptions, setSearchOptions] = useState<SearchOptionsState>({
    searchWeb: false,
    analysis: false,
    reflection: false,
    code: false,
  });
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages
  useEffect(() => {
    if (!aiChatId) return;

    setIsLoading(true);
    const unsubscribe = loadAiMessages(aiChatId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe?.();
  }, [aiChatId, loadAiMessages]);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isThinking]);

  // Envoyer un message et obtenir la réponse IA
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsSending(true);
    setStreamingContent('');

    try {
      // Ajouter le message utilisateur
      const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        text: userMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Générer la réponse avec streaming
      const aiResponse = await generateResponse(
        userMessage,
        searchOptions,
        (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        }
      );

      // Ajouter la réponse IA
      const aiMsg = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        text: aiResponse.response,
        timestamp: new Date(),
        options: searchOptions,
        sources: aiResponse.sources,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Sauvegarder dans Firestore
      await sendAiMessage(aiChatId, userMessage, aiResponse.response);
    } catch (error) {
      console.error('Erreur envoi message IA:', error);
      setInputValue(userMessage);
    } finally {
      setIsSending(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Brain className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue sur eNkamba AI</h2>
            <p className="text-gray-600 max-w-md">
              Posez vos questions et obtenez des réponses bien formatées avec recherche web, analyse et réflexion.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'user' ? (
                // Message utilisateur
                <Card className="max-w-2xl px-6 py-4 rounded-2xl bg-primary text-white shadow-lg">
                  <p className="text-base leading-relaxed">{message.text}</p>
                  <p className="text-xs mt-2 text-white/70">
                    {message.timestamp?.toDate?.()?.toLocaleTimeString?.() || ''}
                  </p>
                </Card>
              ) : (
                // Message IA
                <div className="max-w-3xl w-full">
                  <FormattedResponse
                    isThinking={false}
                    isStreaming={false}
                    content={message.text}
                    sources={message.sources}
                    options={message.options}
                  />
                </div>
              )}
            </div>
          ))
        )}

        {/* Réponse en cours */}
        {(isThinking || isStreaming) && (
          <div className="max-w-3xl w-full">
            <FormattedResponse
              isThinking={isThinking}
              isStreaming={isStreaming}
              content={streamingContent}
              options={searchOptions}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4 space-y-4">
        {/* Options de recherche */}
        <SearchOptions
          onOptionsChange={setSearchOptions}
          isLoading={isSending || isThinking || isStreaming}
        />

        {/* Input et bouton */}
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            placeholder="Posez votre question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isSending || isThinking || isStreaming}
            className="rounded-lg text-base"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || isThinking || isStreaming || !inputValue.trim()}
            className="rounded-lg"
            size="icon"
          >
            {isSending || isThinking || isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Statut */}
        {(isSending || isThinking || isStreaming) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 max-w-4xl mx-auto">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isThinking && 'Réflexion en cours...'}
            {isStreaming && 'Génération de la réponse...'}
            {isSending && 'Envoi du message...'}
          </div>
        )}
      </div>
    </div>
  );
}
