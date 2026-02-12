'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  type: 'transfer_received' | 'transfer_sent' | 'payment_request' | 'system' | 'BUSINESS_APPROVED' | 'BUSINESS_REJECTED';
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  senderName?: string;
  senderId?: string;
  transactionId?: string;
  businessName?: string;
  businessType?: string;
  businessId?: string;
  rejectionReason?: string;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  read: boolean;
  acknowledged?: boolean;
  timestamp?: Timestamp;
  createdAt?: string | Timestamp;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les notifications en temps réel
  useEffect(() => {
    if (!user) {
      console.log('useNotifications: Pas d\'utilisateur connecté');
      setIsLoading(false);
      return;
    }

    console.log('useNotifications: Chargement des notifications pour:', user.uid);
    setIsLoading(true);

    try {
      // Charger TOUTES les notifications non lues (pas seulement celles avec read: false)
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      console.log('useNotifications: Écoute des notifications sur:', `users/${user.uid}/notifications`);
      
      const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
        console.log('useNotifications: Snapshot reçu, nombre de docs:', snapshot.docs.length);
        console.log('useNotifications: Snapshot reçu, nombre de docs:', snapshot.docs.length);
        const allNotifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('useNotifications: Toutes les notifications:', allNotifs);
        
        const notifs = allNotifs.filter(notif => !notif.read) as Notification[]; // Filtrer côté client
        console.log('useNotifications: Notifications non lues:', notifs.length);

        // Trier par timestamp décroissant (avec vérification null)
        notifs.sort((a, b) => {
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });

        console.log('Notifications chargées:', notifs.length, notifs);
        setNotifications(notifs);
        setUnreadCount(notifs.length);
        setIsLoading(false);
      }, (error) => {
        console.error('Erreur snapshot notifications:', error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setIsLoading(false);
    }
  }, [user]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const notifRef = doc(db, 'users', user.uid, 'notifications', notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: Timestamp.now(),
      });
      console.log('Notification marquée comme lue:', notificationId);
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  }, [user]);

  // Marquer une notification comme acquittée (pour les transferts reçus)
  const acknowledgeNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const notifRef = doc(db, 'users', user.uid, 'notifications', notificationId);
      await updateDoc(notifRef, {
        acknowledged: true,
        acknowledgedAt: Timestamp.now(),
        read: true,
        readAt: Timestamp.now(),
      });
      console.log('Notification acquittée:', notificationId);
    } catch (error) {
      console.error('Erreur acquittement notification:', error);
    }
  }, [user]);

  // Obtenir les notifications non acquittées (pour afficher le modal)
  const unacknowledgedNotifications = notifications.filter(
    n => n.type === 'transfer_received' && !n.acknowledged
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    acknowledgeNotification,
    unacknowledgedNotifications,
  };
}
