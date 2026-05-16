'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface ChatSettings {
  onlineStatus: boolean;
  readReceipts: boolean;
  locationSharing: boolean;
  lastSeen: boolean;
}

export function useChatSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ChatSettings>({
    onlineStatus: true,
    readReceipts: true,
    locationSharing: false,
    lastSeen: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'chat');
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          setSettings({ ...settings, ...settingsDoc.data() } as ChatSettings);
        } else {
          // Créer les paramètres par défaut
          await setDoc(settingsRef, settings);
        }
      } catch (error) {
        console.error('Error loading chat settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const syncPresence = async () => {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'presence', 'chat'),
          {
            isOnline: settings.onlineStatus,
            lastSeen: serverTimestamp(),
            showOnlineStatus: settings.onlineStatus,
            showLastSeen: settings.lastSeen,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error syncing chat presence:', error);
      }
    };

    void syncPresence();
  }, [settings.lastSeen, settings.onlineStatus, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const setOffline = () => {
      void setDoc(
        doc(db, 'users', user.uid, 'presence', 'chat'),
        {
          isOnline: false,
          lastSeen: serverTimestamp(),
          showOnlineStatus: settings.onlineStatus,
          showLastSeen: settings.lastSeen,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((error) => {
        console.error('Error setting chat offline:', error);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setOffline();
      } else {
        void setDoc(
          doc(db, 'users', user.uid, 'presence', 'chat'),
          {
            isOnline: settings.onlineStatus,
            showOnlineStatus: settings.onlineStatus,
            showLastSeen: settings.lastSeen,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    };

    window.addEventListener('pagehide', setOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', setOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOffline();
    };
  }, [settings.lastSeen, settings.onlineStatus, user?.uid]);

  const updateSetting = async (key: keyof ChatSettings, value: boolean) => {
    if (!user?.uid) return;

    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'chat');
      await setDoc(settingsRef, { ...settings, [key]: value }, { merge: true });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating chat setting:', error);
      throw error;
    }
  };

  return {
    settings,
    loading,
    updateSetting,
  };
}
