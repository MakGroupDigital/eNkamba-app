import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { getSupabaseClient } from '@/lib/supabase';

type RelayEvent = {
  notification_id: string;
  title: string;
  message: string;
  action_url?: string;
};

export function useSupabaseNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`notification_events_${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_events',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          const event = payload.new as RelayEvent;
          if (Notification.permission !== 'granted') return;

          const notification = new Notification(event.title || 'eNkamba', {
            body: event.message || 'Nouvelle notification',
            icon: '/enkamba-logo.png',
            badge: '/favicon.png',
            data: { actionUrl: event.action_url || '/dashboard' },
          });

          notification.onclick = () => {
            const actionUrl = (notification.data as { actionUrl?: string } | undefined)?.actionUrl || '/dashboard';
            window.location.href = actionUrl;
          };
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase realtime: erreur de souscription');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);
}
