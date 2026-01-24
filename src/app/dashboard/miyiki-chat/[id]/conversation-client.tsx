'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';
import { ChatNavIcon } from '@/components/icons/service-icons';
import { ChevronLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ConversationClient() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    const { loadMessages, sendMessage } = useFirestoreConversations();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Charger les messages
    useEffect(() => {
        if (!conversationId) return;

        setIsLoading(true);
        const unsubscribe = loadMessages(conversationId, (msgs) => {
            setMessages(msgs);
            setIsLoading(false);
            // Scroll vers le bas
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe?.();
    }, [conversationId, loadMessages]);

    // Envoyer un message
    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const messageText = inputValue;
        setInputValue('');
        setIsSending(true);

        try {
            await sendMessage(conversationId, messageText);
        } catch (error) {
            console.error('Erreur envoi message:', error);
            setInputValue(messageText); // Restaurer le message en cas d'erreur
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-gradient-to-r from-primary via-primary to-green-800 px-4 shadow-lg">
                <Link href="/dashboard/miyiki-chat">
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10 border-2 border-white/20">
                        <AvatarFallback className="bg-white/20 text-white">U</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="font-headline text-lg font-bold text-white">Conversation</h1>
                        <p className="text-xs text-white/70">En ligne</p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <ChatNavIcon size={48} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-muted-foreground">Aucun message pour le moment</p>
                            <p className="text-xs text-muted-foreground mt-1">Commencez la conversation</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            <Card
                                className={`max-w-xs px-4 py-2 rounded-2xl ${message.senderId === 'current-user'
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-foreground'
                                    }`}
                            >
                                <p className="text-sm">{message.text}</p>
                                <p
                                    className={`text-xs mt-1 ${message.senderId === 'current-user'
                                            ? 'text-white/70'
                                            : 'text-muted-foreground'
                                        }`}
                                >
                                    {message.timestamp?.toDate?.()?.toLocaleTimeString?.() || ''}
                                </p>
                            </Card>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input */}
            <footer className="border-t bg-background p-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Écrivez votre message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isSending}
                        className="rounded-full"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !inputValue.trim()}
                        className="rounded-full"
                        size="icon"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </footer>
        </div>
    );
}
