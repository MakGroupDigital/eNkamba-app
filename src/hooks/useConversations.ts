import { useState, useEffect, useCallback } from 'react';

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  unread?: number;
  isGroup?: boolean;
  href?: string;
}

const CONVERSATIONS_STORAGE_KEY = 'enkamba_conversations';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger depuis localStorage (en production, ce serait Firebase)
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
      } else {
        // Aucune conversation
        setConversations([]);
      }
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      setError('Erreur lors du chargement des conversations');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ajouter une nouvelle conversation
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => {
      const updated = [conversation, ...prev];
      try {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Erreur sauvegarde conversation:', err);
      }
      return updated;
    });
  }, []);

  // Mettre à jour une conversation
  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === id ? { ...conv, ...updates } : conv
      );
      try {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Erreur sauvegarde conversation:', err);
      }
      return updated;
    });
  }, []);

  // Supprimer une conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== id);
      try {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Erreur sauvegarde conversation:', err);
      }
      return updated;
    });
  }, []);

  // Réinitialiser les conversations
  const resetConversations = useCallback(() => {
    setConversations([]);
    try {
      localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
    } catch (err) {
      console.error('Erreur suppression conversations:', err);
    }
  }, []);

  return {
    conversations,
    isLoading,
    error,
    hasConversations: conversations.length > 0,
    addConversation,
    updateConversation,
    deleteConversation,
    resetConversations,
    reload: loadConversations,
  };
}
