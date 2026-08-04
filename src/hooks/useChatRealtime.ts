'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { enkambaRealtime } from '@/lib/realtime-client';

type TypingUser = {
  uid: string;
  name: string;
  at: number;
};

export function useChatRealtime(conversationId: string, currentUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    enkambaRealtime.send('conversation:join', { conversationId });

    const cleanupStart = enkambaRealtime.subscribe('typing:start', (payload) => {
      if (payload.conversationId !== conversationId) return;
      const uid = String(payload.uid || '');
      if (!uid || uid === currentUserId) return;
      const name = String(payload.name || 'Utilisateur');

      setTypingUsers((current) => {
        const next = current.filter((item) => item.uid !== uid);
        next.push({ uid, name, at: Date.now() });
        return next;
      });
    });

    const cleanupStop = enkambaRealtime.subscribe('typing:stop', (payload) => {
      if (payload.conversationId !== conversationId) return;
      const uid = String(payload.uid || '');
      setTypingUsers((current) => current.filter((item) => item.uid !== uid));
    });

    const cleanupInterval = window.setInterval(() => {
      const cutoff = Date.now() - 4000;
      setTypingUsers((current) => current.filter((item) => item.at > cutoff));
    }, 1500);

    return () => {
      enkambaRealtime.send('conversation:leave', { conversationId });
      cleanupStart();
      cleanupStop();
      window.clearInterval(cleanupInterval);
    };
  }, [conversationId, currentUserId]);

  const sendTyping = useCallback(() => {
    if (!conversationId) return;
    enkambaRealtime.send('typing:start', { conversationId });

    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => {
      enkambaRealtime.send('typing:stop', { conversationId });
    }, 1800);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = null;
    enkambaRealtime.send('typing:stop', { conversationId });
  }, [conversationId]);

  return {
    typingUsers,
    sendTyping,
    stopTyping,
  };
}
