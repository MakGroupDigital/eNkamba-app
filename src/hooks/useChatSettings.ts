'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
    if (!user?.uid) return;

    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'chat');
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as ChatSettings);
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

  const updateSetting = async (key: keyof ChatSettings, value: boolean) => {
    if (!user?.uid) return;

    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'chat');
      await updateDoc(settingsRef, { [key]: value });
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
