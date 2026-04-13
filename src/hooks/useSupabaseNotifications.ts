import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
// import { getSupabaseClient } from '@/lib/supabase'; // Disabled - Supabase realtime not needed

type RelayEvent = {
  notification_id: string;
  title: string;
  message: string;
  action_url?: string;
};

export function useSupabaseNotifications() {
  // Supabase realtime disabled - using Firebase push notifications instead
  return;
}
