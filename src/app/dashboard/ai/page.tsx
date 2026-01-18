'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { enkambaChat } from '@/ai/flows/enkamba-chat-flow';
import { EnkambaAIIcon, UserProfileIcon } from "@/components/icons/service-icons";

interface Message {
  text: string;
  isUser: boolean;
  id: string;
}

const suggestedPrompts = [
  "Explique-moi les principes de l'intelligence artificielle",
  "Rédige un email professionnel de remerciement",
  "Quels sont les avantages du développement durable ?",
  "Comment fonctionne la blockchain ?",
];

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage: Message = { 
        text: inputValue, 
        isUser: true,
        id: Date.now().toString()
      };
      setMessages(prev => [...prev, userMessage]);
      const currentInput = inputValue;
      setInputValue('');
      setIsLoading(true);
      
      try {
        const aiResponse = await enkambaChat({ message: currentInput });
        const aiMessage: Message = { 
          text: aiResponse.response, 
          isUser: false,
          id: (Date.now() + 1).toString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error calling AI chat flow:", error);
        const errorMessage: Message = { 
          text: "Désolé, une erreur est survenue. Veuillez réessayer plus tard.", 
          isUser: false,
          id: (Date.now() + 1).toString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Simple and Clean */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-green-800 flex items-center justify-center shadow-sm">
              <EnkambaAIIcon size={24} className="text-white" />
            </div>
              <div>
                <h1 className="font-headline text-lg font-semibold">eNkamba.ai</h1>
                <p className="text-xs text-muted-foreground">Modèle LLM</p>
              </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 w-full">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {messages.length === 0 ? (
            /* Welcome Screen with Suggestions */
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-500">
              <div className="text-center space-y-4">
                <h2 className="font-headline text-3xl font-bold bg-gradient-to-r from-primary to-green-800 bg-clip-text text-transparent">
                  Bonjour ! Je suis eNkamba.ai
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Votre modèle LLM intelligent. Posez-moi n'importe quelle question, je suis là pour vous aider.
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="p-4 text-left rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-sm text-foreground hover:text-primary group animate-in fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <p className="group-hover:translate-x-1 transition-transform">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="space-y-6 pb-8">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-4 animate-in fade-in-up",
                    message.isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <Avatar className={cn(
                    "h-8 w-8 rounded-lg flex-shrink-0 shadow-sm",
                    message.isUser 
                      ? "bg-gradient-to-br from-primary to-green-800" 
                      : "bg-gradient-to-br from-primary to-green-800"
                  )}>
                    <AvatarFallback className="bg-transparent">
                      {message.isUser ? (
                        <UserProfileIcon size={20} className="text-white" />
                      ) : (
                        <EnkambaAIIcon size={20} className="text-white" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Content */}
                  <div className={cn(
                    "flex-1 space-y-2 max-w-[85%]",
                    message.isUser ? "items-end" : "items-start"
                  )}>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                        message.isUser
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md border border-border/50"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.text}
                      </div>
                    </div>

                    {/* Message Actions (Only for AI messages) */}
                    {!message.isUser && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button className="hover:text-primary transition-colors p-1 rounded">
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button className="hover:text-primary transition-colors p-1 rounded">
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                        <button className="hover:text-primary transition-colors p-1 rounded ml-2">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-4 animate-in fade-in-up">
                  <Avatar className="h-8 w-8 rounded-lg flex-shrink-0 shadow-sm bg-gradient-to-br from-primary to-green-800">
                    <AvatarFallback className="bg-transparent">
                      <EnkambaAIIcon size={20} className="text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm bg-muted border border-border/50 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-muted-foreground">eNkamba.ai réfléchit...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Modern and Fixed */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background shadow-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Textarea
              ref={textareaRef}
              placeholder="Tapez votre message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
              className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent pr-12 py-3 pl-4 text-base"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <Button
              size="icon"
              className={cn(
                "absolute bottom-2 right-2 h-9 w-9 rounded-xl mb-1 mr-1 transition-all",
                inputValue.trim() && !isLoading
                  ? "bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90 shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            eNkamba.ai peut faire des erreurs. Consultez toujours des sources fiables pour les informations critiques.
          </p>
        </div>
      </div>
    </div>
  );
}
