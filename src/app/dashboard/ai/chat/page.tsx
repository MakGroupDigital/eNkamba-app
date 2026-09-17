'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, Brain, Clock, Code2, CreditCard, Menu, Mic, Plus, Search, Send, Settings, SlidersHorizontal, Trash2, X, Zap } from 'lucide-react';

import { useFirestoreAiChat } from '@/hooks/useFirestoreAiChat';
import { useAuth } from '@/hooks/useAuth';
import { EnkambaAIIcon } from '@/components/icons/service-icons';

const starterPrompts = [
  'Aide-moi à comprendre Kenz',
  'Prépare une stratégie commerciale',
  'Analyse une idée de business',
  'Explique un service de la plateforme',
];

type AiOptions = {
  advanced: boolean;
  code: boolean;
  literature: boolean;
  searchWeb: boolean;
};

const optionItems: Array<{ key: keyof AiOptions; label: string; icon: any }> = [
  { key: 'advanced', label: 'Avancé', icon: Brain },
  { key: 'code', label: 'Code', icon: Code2 },
  { key: 'literature', label: 'Littérature', icon: BookOpen },
  { key: 'searchWeb', label: 'Recherche', icon: Search },
];

function AiMark({ size = 68 }: { size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
      <span className="absolute h-1/2 w-1/2 rounded-full bg-[#F51B2B]/20 blur-xl" />
      <EnkambaAIIcon size={size} className="relative drop-shadow-[0_0_24px_rgba(7, 59, 154,0.45)]" />
    </div>
  );
}

function getLocalGreeting() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 5) return 'Bonsoir';
  return 'Bonjour';
}

function AnimatedAiBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_72%,rgba(7, 59, 154,0.36),transparent_35%),radial-gradient(circle_at_82%_16%,rgba(245, 27, 43,0.16),transparent_28%),linear-gradient(180deg,#073B9A_0%,#073B9A_58%,#073B9A_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 animate-pulse rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-24 h-80 w-80 animate-pulse rounded-full bg-[#F51B2B]/12 blur-3xl [animation-delay:900ms]" />
      <div className="pointer-events-none absolute inset-x-8 bottom-20 h-44 rounded-[999px] bg-primary/18 blur-3xl" />
      <div className="pointer-events-none absolute left-[18%] top-[22%] h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-duration:3.5s]" />
      <div className="pointer-events-none absolute right-[24%] top-[36%] h-1.5 w-1.5 animate-bounce rounded-full bg-[#F51B2B]/70 [animation-duration:4.2s]" />
      <div className="pointer-events-none absolute left-[55%] top-[18%] h-1 w-1 animate-pulse rounded-full bg-primary" />
    </>
  );
}

function UserAvatar({ photoURL, initial }: { photoURL?: string | null; initial: string }) {
  return (
    <div className="grid h-12 w-12 overflow-hidden rounded-full border border-white/15 bg-white text-primary shadow-2xl">
      {photoURL ? (
        <img src={photoURL} alt="Profil" className="h-full w-full object-cover" />
      ) : (
        <span className="m-auto text-sm font-black">{initial}</span>
      )}
    </div>
  );
}

function AiSideMenu({
  open,
  onClose,
  aiChats,
  onOpenChat,
  onDeleteChat,
  onNewChat,
}: {
  open: boolean;
  onClose: () => void;
  aiChats: any[];
  onOpenChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label="Fermer le menu" />
      <aside className="relative h-full w-[86vw] max-w-sm border-r border-white/10 bg-[#073B9A]/95 p-4 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Miyiki AI</p>
            <h2 className="mt-1 text-xl font-black">Centre IA</h2>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          <button onClick={onNewChat} className="flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white">
            <Plus className="h-5 w-5" />
            Nouvelle conversation
          </button>
          {[
            ['Assistant intelligent', EnkambaAIIcon],
            ['Mon abonnement', CreditCard],
            ['Historique récent', Clock],
            ['Préférences IA', Settings],
          ].map(([label, Icon]: any) => (
            <button
              key={label}
              onClick={() => {
                if (label === 'Mon abonnement') onOpenChat('__subscription__');
              }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-left text-sm font-bold text-white/82"
            >
              {label === 'Assistant intelligent' ? (
                <EnkambaAIIcon size={22} />
              ) : (
                <Icon className="h-5 w-5 text-[#F51B2B]" />
              )}
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-white/40">Historiques</p>
          <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
            {aiChats.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/7 p-4 text-xs font-semibold text-white/55">
                Aucune conversation pour le moment.
              </div>
            ) : (
              aiChats.map((chat) => (
                <div key={chat.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/7 p-2">
                  <button onClick={() => onOpenChat(chat.id)} className="min-w-0 flex-1 px-2 py-2 text-left">
                    <p className="truncate text-sm font-black text-white">{chat.title}</p>
                    <p className="mt-1 text-[11px] font-semibold text-white/40">Conversation IA</p>
                  </button>
                  <button onClick={() => onDeleteChat(chat.id)} className="grid h-9 w-9 place-items-center rounded-full text-white/45 hover:bg-red-500/15 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function AiChatDefaultPage() {
  const { aiChats, createAiChat, deleteAiChat, sendAiMessage } = useFirestoreAiChat();
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [aiOptions, setAiOptions] = useState<AiOptions>({
    advanced: false,
    code: false,
    literature: false,
    searchWeb: false,
  });
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Charmant';
  const userInitial = userName.charAt(0).toUpperCase();
  const greeting = getLocalGreeting();

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim() || isSending) return;

    const userMessage = text.trim();
    setInputValue('');
    setIsSending(true);

    try {
      const chatId = await createAiChat(userMessage.substring(0, 50));
      router.push(`/dashboard/ai/chat/${chatId}`);

      void (async () => {
        let aiResponseText = '';
        const response = await fetch('/api/ai/enhanced-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: aiOptions.literature
              ? `${userMessage}\n\nRéponds avec un style littéraire, clair et élégant, sans perdre la précision.`
              : userMessage,
            options: {
              searchWeb: aiOptions.searchWeb,
              analysis: aiOptions.advanced,
              reflection: aiOptions.advanced,
              code: aiOptions.code,
            },
          }),
        });

        if (!response.ok) throw new Error("Erreur lors de l'appel à l'API");

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Pas de réponse');

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiResponseText += decoder.decode(value);
        }

        await sendAiMessage(chatId, userMessage, aiResponseText);
      })().catch((error) => {
        console.error('Erreur traitement IA en arrière-plan:', error);
      });
    } catch (error) {
      console.error('Erreur:', error);
      setInputValue(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="relative h-full min-h-0 overflow-hidden bg-black text-white">
      <AnimatedAiBackground />
      <AiSideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        aiChats={aiChats}
        onOpenChat={(id) => {
          setMenuOpen(false);
          if (id === '__subscription__') {
            router.push('/dashboard/ai/subscription');
            return;
          }
          router.push(`/dashboard/ai/chat/${id}`);
        }}
        onDeleteChat={(id) => void deleteAiChat(id)}
        onNewChat={() => {
          setMenuOpen(false);
          setInputValue('');
        }}
      />

      <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button onClick={() => setMenuOpen(true)} className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/8 text-white shadow-2xl backdrop-blur-xl transition hover:bg-white/12">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="hidden h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/8 text-white backdrop-blur-xl transition hover:bg-white/12 sm:grid">
              <Bell className="h-4 w-4" />
            </button>
            <UserAvatar photoURL={user?.photoURL} initial={userInitial} />
          </div>
        </div>
      </header>

      <section className="relative z-10 flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-start px-5 pb-52 pt-24 text-center sm:pt-28">
          <AiMark size={58} />
          <h1 className="mt-5 text-3xl font-light tracking-normal text-white sm:text-5xl">
            {greeting}, {userName}
          </h1>
          <p className="mt-3 max-w-md text-sm font-medium leading-6 text-white/55">
            En quoi puis-je vous aider aujourd'hui ?
          </p>
          <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInputValue(prompt)}
                className="rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-left text-xs font-bold text-white/78 shadow-xl backdrop-blur-xl transition hover:border-primary/40 hover:bg-primary/12 hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-2xl px-3 sm:px-6 md:bottom-[calc(108px+env(safe-area-inset-bottom))]">
          {optionsOpen && (
            <div className="mb-2 grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-black/70 p-2 text-white shadow-2xl backdrop-blur-2xl sm:grid-cols-4">
              {optionItems.map((item) => {
                const Icon = item.icon;
                const active = aiOptions[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setAiOptions((current) => ({ ...current, [item.key]: !current[item.key] }));
                      setOptionsOpen(false);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-black transition ${
                      active ? 'bg-primary text-white' : 'bg-white/7 text-white/70 hover:bg-white/12'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-[#F51B2B]'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-end gap-1.5 rounded-[1.35rem] border border-white/10 bg-[#171B1A]/95 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/8">
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setOptionsOpen((value) => !value)}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                Object.values(aiOptions).some(Boolean) || optionsOpen ? 'bg-primary text-white' : 'text-white/85 hover:bg-white/8'
              }`}
              aria-label="Paramètres IA"
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </button>
            <textarea
              placeholder="Demander à Kenz AI..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending}
              rows={1}
              className="max-h-24 min-h-9 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/45 disabled:opacity-50"
            />
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/85 transition hover:bg-white/8">
              <Mic className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputValue.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 transition hover:scale-105 disabled:scale-100 disabled:opacity-50"
              aria-label="Envoyer"
            >
              {isSending ? <Zap className="h-[18px] w-[18px] animate-pulse" /> : <Send className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
