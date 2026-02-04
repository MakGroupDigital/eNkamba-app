'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useFirestoreAiChat } from '@/hooks/useFirestoreAiChat';
import { Send, Loader2 } from 'lucide-react';

export default function AiChatClient() {
    const params = useParams();
    const aiChatId = params.id as string;

    const { loadAiMessages, sendAiMessage } = useFirestoreAiChat();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Charger les messages
    useEffect(() => {
        if (!aiChatId) return;

        setIsLoading(true);
        const unsubscribe = loadAiMessages(aiChatId, (msgs) => {
            setMessages(msgs);
            setIsLoading(false);
            // Scroll vers le bas
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe?.();
    }, [aiChatId, loadAiMessages]);

    // Envoyer un message et obtenir la réponse IA
    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setInputValue('');
        setIsSending(true);

        try {
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

            // Sauvegarder les messages
            await sendAiMessage(aiChatId, userMessage, aiResponseText);
        } catch (error) {
            console.error('Erreur envoi message IA:', error);
            setInputValue(userMessage); // Restaurer le message en cas d'erreur
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Commencez une conversation</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <Card
                                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${message.role === 'user'
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-foreground'
                                    }`}
                            >
                                <p className="text-sm">{message.text}</p>
                                <p
                                    className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                                        }`}
                                >
                                    {message.timestamp?.toDate?.()?.toLocaleTimeString?.() || ''}
                                </p>
                            </Card>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-background p-4">
                <div className="max-w-4xl mx-auto flex gap-2">
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
            </div>
        </div>
    );
}
