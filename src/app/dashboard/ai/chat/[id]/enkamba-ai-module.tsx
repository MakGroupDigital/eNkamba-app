'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Settings, User, Sparkles, Bell, LogOut, Clock, Trash2, ShieldCheck, Zap, Volume2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useFirestoreAiChat } from '@/hooks/useFirestoreAiChat';

// --- CONFIGURATION DU STYLE & POLICES ---
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Roboto:wght@300;400;500;700&display=swap');
    :root {
      --color-primary: #32BB78;
      --color-dark: #1A3D2A;
      --color-accent: #FFCC00;
    }
    body {
      font-family: 'Roboto', sans-serif;
      background-color: var(--color-dark);
      color: white;
      margin: 0;
    }
    h1, h2, h3, .font-brand {
      font-family: 'Montserrat', sans-serif;
    }
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(50, 187, 120, 0.3);
      border-radius: 10px;
    }
    .glass-panel {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .bubble-user {
      background-color: #32BB78;
      box-shadow: 0 4px 15px rgba(50, 187, 120, 0.3);
    }
    .bubble-ai {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .ai-glow {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(50,187,120,0.12) 0%, rgba(26,61,42,0) 70%);
      top: -150px;
      right: -150px;
      pointer-events: none;
      z-index: 0;
    }
    .setting-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.2s ease;
    }
    .setting-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: #32BB78;
    }
  `}</style>
);

// --- LOGO ---
const Logo = () => (
  <div className="flex flex-col items-center mb-10 mt-8">
    <div className="relative w-16 h-16 mb-4 group cursor-pointer">
      <div className="absolute inset-0 bg-[#32BB78] opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity"></div>
      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
        <path d="M25 80 L25 30 Q25 20 35 25 L65 55 Q75 60 75 50 L75 20" stroke="#32BB78" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M75 20 L55 20 M75 20 L75 40" stroke="#32BB78" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="88" cy="15" r="4" fill="#FFCC00" className="animate-pulse" />
      </svg>
    </div>
    <div className="font-brand font-bold text-xl tracking-wide">
      eNkamba<span className="font-light text-[#32BB78]">.ai</span>
    </div>
  </div>
);

// --- SIDEBAR ---
const Sidebar = ({ activeTab, setActiveTab }: any) => {
  const menuItems = [
    { id: 'assistant', icon: MessageSquare, label: 'Assistant IA' },
    { id: 'history', icon: Clock, label: 'Historique' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="hidden md:flex flex-col w-72 h-full glass-panel border-r-0 z-20 relative">
      <Logo />
      <div className="flex flex-col gap-2 px-4 flex-1">
        <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Navigation AI</div>
        {menuItems.map((item: any) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 p-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-[#32BB78] text-white shadow-lg shadow-[#32BB78]/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-brand text-sm">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="p-6 mt-auto">
        <button className="flex items-center gap-3 text-gray-500 hover:text-[#DC2626] transition-colors w-full p-2 text-sm font-medium">
          <LogOut size={18} />
          <span>Quitter</span>
        </button>
      </div>
    </div>
  );
};

// --- CHAT ---
const ChatInterface = ({ chatId }: { chatId: string }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<any>(null);
  const { sendAiMessage, loadAiMessages } = useFirestoreAiChat();
  const { user } = useUser();

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = loadAiMessages(chatId, setMessages);
    return () => unsubscribe?.();
  }, [chatId, loadAiMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/enhanced-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        }),
      });

      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      await sendAiMessage(chatId, text, data.response || 'Erreur');
    } catch (error) {
      console.error('Erreur:', error);
      await sendAiMessage(chatId, text, 'Désolé, une erreur s\'est produite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A3D2A] relative overflow-hidden">
      <div className="ai-glow"></div>
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#1A3D2A]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#32BB78]/10 flex items-center justify-center border border-[#32BB78]/20">
            <Sparkles size={18} className="text-[#32BB78]" />
          </div>
          <div>
            <h1 className="font-brand font-bold text-lg">Assistant eNkamba</h1>
            <span className="text-[10px] text-[#32BB78] uppercase font-bold tracking-widest">Actif</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-white">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#32BB78] flex items-center justify-center font-bold text-xs">
            {user?.firstName?.substring(0, 1) || 'U'}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-6 relative z-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles size={48} className="text-[#32BB78] mb-4 opacity-50" />
            <p className="text-gray-400">Commencez une conversation</p>
          </div>
        )}
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bubble-user text-white' : 'bubble-ai text-gray-100'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-xs text-[#32BB78] animate-pulse">eNkamba réfléchit...</div>}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-6 bg-[#1A3D2A] border-t border-white/5">
        <div className="max-w-4xl mx-auto relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-14 outline-none focus:border-[#32BB78] transition-all disabled:opacity-50"
            placeholder="Écrivez votre message..."
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-[#32BB78] rounded-lg flex items-center justify-center text-white disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};

// --- HISTORIQUE ---
const HistoryPage = ({ aiChats, onDeleteChat }: any) => (
  <div className="flex-1 p-10 overflow-y-auto">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-brand font-bold mb-8">Historique</h2>
      <div className="space-y-4">
        {aiChats.map((chat: any) => (
          <div key={chat.id} className="setting-card p-5 rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#32BB78]/10 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} className="text-[#32BB78]" />
              </div>
              <div>
                <h4 className="font-bold text-sm">{chat.title}</h4>
                <p className="text-xs text-gray-500">{new Date(chat.createdAt?.toDate?.() || chat.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={() => onDeleteChat(chat.id)}
              className="p-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-[#DC2626] transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- PARAMÈTRES ---
const SettingsPage = () => (
  <div className="flex-1 p-10 overflow-y-auto">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-brand font-bold mb-8">Paramètres AI</h2>
      <div className="grid gap-6">
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-[#32BB78] uppercase tracking-widest">Préférences</h3>
          <div className="setting-card p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Zap size={20} className="text-[#FFCC00]" />
              <div>
                <h4 className="text-sm font-bold">Vitesse de réponse</h4>
                <p className="text-xs text-gray-500">Prioriser la rapidité</p>
              </div>
            </div>
            <div className="w-12 h-6 bg-[#32BB78] rounded-full relative">
              <div className="absolute right-1 top-1 bottom-1 aspect-square bg-white rounded-full"></div>
            </div>
          </div>
        </section>
        <section className="space-y-4 mt-4">
          <h3 className="text-xs font-bold text-[#32BB78] uppercase tracking-widest">Sécurité</h3>
          <div className="setting-card p-5 rounded-2xl flex items-center gap-4">
            <ShieldCheck size={20} className="text-[#32BB78]" />
            <div>
              <h4 className="text-sm font-bold">Cryptage E2E</h4>
              <p className="text-xs text-gray-500">Données chiffrées localement</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

// --- APP ---
export default function EnkambaAIModule({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('assistant');
  const { aiChats, deleteAiChat } = useFirestoreAiChat();
  const router = useRouter();
  const chatId = params.id;

  const handleDeleteChat = async (id: string) => {
    await deleteAiChat(id);
    if (id === chatId) {
      router.push('/dashboard/ai/chat');
    }
  };

  return (
    <div className="flex h-screen bg-[#1A3D2A] text-white">
      <Styles />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'assistant' && <ChatInterface chatId={chatId} />}
      {activeTab === 'history' && <HistoryPage aiChats={aiChats} onDeleteChat={handleDeleteChat} />}
      {activeTab === 'settings' && <SettingsPage />}
    </div>
  );
}
