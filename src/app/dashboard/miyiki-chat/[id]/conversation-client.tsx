'use client';

import { useState, useEffect, useMemo, useRef, useCallback, type PointerEvent, type TouchEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, documentId, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';
import { useAuth } from '@/hooks/useAuth';
import { useChatSettings } from '@/hooks/useChatSettings';
import { ChatNavIcon } from '@/components/icons/service-icons';
import { LocationMessage } from '@/components/chat/LocationMessage';
import { FileMessage } from '@/components/chat/FileMessage';
import { MoneyTransferMessage } from '@/components/chat/MoneyTransferMessage';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { useChatMoneyTransfer } from '@/hooks/useChatMoneyTransfer';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { Ban, Bell, BellOff, ChevronLeft, Flag, Image as ImageIcon, Send, Loader2, Mail, Phone, Mic, Video, MapPin, DollarSign, Paperclip, Plus, X, Check, Square, Settings, ShieldAlert, UserMinus, Users, Trash2, Edit2, MoreVertical, Languages } from 'lucide-react';
import Link from 'next/link';
import { GroupSettingsDialog } from '@/components/group-settings-dialog';
import { CHAT_WALLPAPERS, createCustomChatWallpaperId, getChatWallpaper, isCustomChatWallpaper } from '@/lib/chat-wallpapers';

type IncomingCallDoc = {
    id: string;
    callType: 'audio' | 'video';
    fromUid: string;
    createdAtMs: number;
};

type TranslationResult = {
    translatedText: string;
    detectedSourceLanguage: string;
    sourceLanguageName: string;
    targetLanguage: string;
    targetLanguageName: string;
    service: string;
};

type InlineTranslation = {
    translatedText: string;
    sourceLanguageName?: string;
    targetLanguage?: string;
    targetLanguageName?: string;
    error?: string;
};

const TRANSLATION_LANGUAGES = [
    { code: 'fr', label: 'Francais' },
    { code: 'en', label: 'Anglais' },
    { code: 'ln', label: 'Lingala' },
    { code: 'sw', label: 'Swahili' },
    { code: 'pt', label: 'Portugais' },
    { code: 'es', label: 'Espagnol' },
    { code: 'de', label: 'Allemand' },
    { code: 'it', label: 'Italien' },
    { code: 'nl', label: 'Neerlandais' },
    { code: 'ar', label: 'Arabe' },
    { code: 'zh', label: 'Chinois' },
];

const LANGUAGE_STORAGE_KEY = 'enkamba-dashboard-language';
const TRANSLATION_CACHE_PREFIX = 'enkamba-chat-inline-translations';
const CONVERSATION_WALLPAPER_PREFIX = 'enkamba-chat-conversation-wallpaper';

export default function ConversationClient() {
    const params = useParams();
    const router = useRouter();
    const conversationId = (params?.id as string) || '';

    const { loadMessages, sendMessage, deleteMessage, updateMessage } = useFirestoreConversations();
    const { user: currentUser } = useAuth();
    const { settings: chatSettings } = useChatSettings();
    const { getCurrentLocation } = useLocationSharing();
    const { sendMoney, acceptTransfer, rejectTransfer } = useChatMoneyTransfer();
    
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [contact, setContact] = useState<any>(null);
    const [showContactDetails, setShowContactDetails] = useState(false);
    const [isConversationMuted, setIsConversationMuted] = useState(false);
    const [conversationWallpaper, setConversationWallpaper] = useState<string | null>(null);
    const [isUploadingConversationWallpaper, setIsUploadingConversationWallpaper] = useState(false);
    const [relationshipControl, setRelationshipControl] = useState({
        restricted: false,
        blocked: false,
        isLoading: false,
    });
    const [contactPrivacy, setContactPrivacy] = useState<{
        onlineStatus: boolean;
        lastSeen: boolean;
        isOnline: boolean;
        lastSeenAt?: any;
    }>({ onlineStatus: true, lastSeen: true, isOnline: false });
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
    const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [groupData, setGroupData] = useState<any>(null);
    const [isGroup, setIsGroup] = useState(false);
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
    const [senderAvatars, setSenderAvatars] = useState<Record<string, string>>({});
    const [myAvatar, setMyAvatar] = useState<string>('');
    const [incomingCall, setIncomingCall] = useState<{ id: string; callType: 'audio' | 'video'; fromUid: string } | null>(null);
    const [targetLanguage, setTargetLanguage] = useState('fr');
    const [messageTargetLanguages, setMessageTargetLanguages] = useState<Record<string, string>>({});
    const [inlineTranslations, setInlineTranslations] = useState<Record<string, InlineTranslation>>({});
    const [translatingMessageIds, setTranslatingMessageIds] = useState<Record<string, boolean>>({});
    const [translationAction, setTranslationAction] = useState<{ message: any; x: number; y: number } | null>(null);
    const seenIncomingCallIdsRef = useRef<Set<string>>(new Set());
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressPointRef = useRef<{ x: number; y: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const conversationWallpaperInputRef = useRef<HTMLInputElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const activeWallpaper = getChatWallpaper(conversationWallpaper || chatSettings.wallpaper);
    const customConversationWallpaper = isCustomChatWallpaper(conversationWallpaper)
        ? getChatWallpaper(conversationWallpaper)
        : null;
    const conversationWallpaperKey = currentUser?.uid && conversationId
        ? `${CONVERSATION_WALLPAPER_PREFIX}:${currentUser.uid}:${conversationId}`
        : '';

    useEffect(() => {
        if (!conversationWallpaperKey) {
            setConversationWallpaper(null);
            return;
        }

        let cancelled = false;
        const cachedWallpaper = window.localStorage.getItem(conversationWallpaperKey);
        setConversationWallpaper(cachedWallpaper);

        const loadConversationWallpaper = async () => {
            if (!currentUser?.uid || !conversationId) return;

            try {
                const settingsRef = doc(db, 'users', currentUser.uid, 'chatConversationSettings', conversationId);
                const settingsSnap = await getDoc(settingsRef);
                const wallpaper = settingsSnap.exists() ? String(settingsSnap.data()?.wallpaper || '') : '';

                if (!cancelled) {
                    setConversationWallpaper(wallpaper || null);
                    if (wallpaper) {
                        window.localStorage.setItem(conversationWallpaperKey, wallpaper);
                    } else {
                        window.localStorage.removeItem(conversationWallpaperKey);
                    }
                }
            } catch (error) {
                console.error('Erreur chargement fond discussion:', error);
            }
        };

        void loadConversationWallpaper();

        return () => {
            cancelled = true;
        };
    }, [conversationId, conversationWallpaperKey, currentUser?.uid]);

    const updateConversationWallpaper = useCallback(async (wallpaperId: string | null) => {
        if (!conversationWallpaperKey) return;

        if (wallpaperId) {
            window.localStorage.setItem(conversationWallpaperKey, wallpaperId);
        } else {
            window.localStorage.removeItem(conversationWallpaperKey);
        }

        setConversationWallpaper(wallpaperId);

        if (!currentUser?.uid || !conversationId) return;

        try {
            await setDoc(
                doc(db, 'users', currentUser.uid, 'chatConversationSettings', conversationId),
                {
                    wallpaper: wallpaperId || '',
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (error) {
            console.error('Erreur sauvegarde fond discussion:', error);
        }
    }, [conversationId, conversationWallpaperKey, currentUser?.uid]);

    const handleImportConversationWallpaper = useCallback(async (file: File | null) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Veuillez choisir une image depuis votre galerie ou vos fichiers.');
            return;
        }

        setIsUploadingConversationWallpaper(true);
        try {
            const uploadResult = await uploadToCloudinary(file, 'image');
            const imageUrl = uploadResult.secureUrl || uploadResult.url;
            await updateConversationWallpaper(createCustomChatWallpaperId(imageUrl));
        } catch (error) {
            console.error('Erreur import fond discussion:', error);
            alert(error instanceof Error ? error.message : 'Impossible d’importer cette image.');
        } finally {
            setIsUploadingConversationWallpaper(false);
            if (conversationWallpaperInputRef.current) {
                conversationWallpaperInputRef.current.value = '';
            }
        }
    }, [updateConversationWallpaper]);

    // Listener appels entrants (quand l'utilisateur est déjà dans la conversation)
    useEffect(() => {
        if (!currentUser?.uid) return;
        if (!conversationId) return;
        if (isGroup) return;

        const q = query(collection(db, 'calls'), where('toUid', '==', currentUser.uid));
        const unsub = onSnapshot(q, (snap) => {
            const candidates: IncomingCallDoc[] = [];

            snap.forEach((d) => {
                const data: any = d.data() || {};
                if (data?.conversationId !== conversationId) return;
                if (data?.status !== 'ringing') return;
                const createdAtMs = data?.createdAt?.toMillis?.() || 0;
                const callType: 'audio' | 'video' = data?.callType === 'audio' ? 'audio' : 'video';
                const fromUid = String(data?.fromUid || '');
                if (!fromUid) return;

                candidates.push({ id: d.id, callType, fromUid, createdAtMs });
            });

            const bestCall = candidates.sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
            if (!bestCall) {
                setIncomingCall(null);
                return;
            }

            // Marquer "reçu" dès que l'appel est visible côté destinataire
            if (!seenIncomingCallIdsRef.current.has(bestCall.id)) {
                seenIncomingCallIdsRef.current.add(bestCall.id);
                void updateDoc(doc(db, 'calls', bestCall.id), { receivedAt: serverTimestamp() } as any).catch(() => undefined);
            }

            setIncomingCall((prev) => {
                if (prev?.id === bestCall.id) return prev;
                return { id: bestCall.id, callType: bestCall.callType, fromUid: bestCall.fromUid };
            });
        });

        return () => unsub();
    }, [conversationId, currentUser?.uid, isGroup]);

    const acceptIncomingCall = useCallback(() => {
        if (!incomingCall) return;
        setIncomingCall(null);
        const routeBase = incomingCall.callType === 'audio' ? 'audiocall' : 'call';
        router.push(`/dashboard/miyiki-chat/${routeBase}/${conversationId}?callId=${incomingCall.id}`);
    }, [conversationId, incomingCall, router]);

    const declineIncomingCall = useCallback(async () => {
        if (!incomingCall) return;
        const callId = incomingCall.id;
        setIncomingCall(null);
        try {
            await updateDoc(doc(db, 'calls', callId), { status: 'missed', endedAt: serverTimestamp() } as any);
        } catch {}
    }, [incomingCall]);

    // Charger les infos de la conversation et du contact
    useEffect(() => {
        const loadConversationData = async () => {
            if (!conversationId || !currentUser) return;

            try {
                const convRef = doc(db, 'conversations', conversationId);
                const convSnap = await getDoc(convRef);

                if (convSnap.exists()) {
                    const convData = convSnap.data();
                    const mutedByUid = (convData.mutedByUid || {}) as Record<string, boolean>;
                    setIsConversationMuted(Boolean(mutedByUid[currentUser.uid]));
                    
                    const participants = convData.participants || [];
                    const participantNames = convData.participantNames || [];

                    // Vérifier si c'est un groupe (plus de 2 participants ou a un nom de groupe)
                    const isGroupConv = participants.length > 2 || convData.isGroup || convData.name;
                    setIsGroup(isGroupConv);

                    if (isGroupConv) {
                        // C'est un groupe
                        setGroupData({
                            name: convData.name || 'Groupe',
                            participants: participants,
                            participantNames: participantNames,
                            admins: convData.admins || [convData.createdBy],
                            createdBy: convData.createdBy || participants[0],
                            createdAt: convData.createdAt,
                        });
                        setContact({
                            name: convData.name || 'Groupe',
                            isGroup: true,
                        });
                    } else {
                        // Conversation individuelle
                        // Trouver l'autre participant (celui qui n'est pas l'utilisateur courant)
                        const otherParticipantIdx = participants.findIndex((id: string) => id !== currentUser.uid);
                        
                        if (otherParticipantIdx !== -1 && participantNames[otherParticipantIdx]) {
                            const otherUid = participants[otherParticipantIdx];
                            let avatarUrl = '';
                            try {
                                const uSnap = await getDoc(doc(db, 'users', otherUid));
                                const uData: any = uSnap.exists() ? uSnap.data() : {};
                                avatarUrl =
                                    uData?.profileImage ||
                                    uData?.photoURL ||
                                    uData?.avatarUrl ||
                                    uData?.profilePhotoUrl ||
                                    uData?.kyc?.profileImage ||
                                    '';
                            } catch (e) {
                                console.warn('Chargement avatar contact (non critique):', e);
                            }

                            const contactData = {
                                id: otherUid,
                                name: participantNames[otherParticipantIdx],
                                phoneNumber: convData.phoneNumber || '',
                                email: convData.email || '',
                                avatar: avatarUrl || undefined,
                                isGroup: false,
                            };
                            setContact(contactData);

                            try {
                                const relationshipSnap = await getDoc(doc(db, 'makutano_relationship_controls', `${currentUser.uid}_${otherUid}`));
                                const relationshipData: any = relationshipSnap.exists() ? relationshipSnap.data() : {};
                                setRelationshipControl((current) => ({
                                    ...current,
                                    restricted: relationshipData.restricted === true,
                                    blocked: relationshipData.blocked === true,
                                }));
                            } catch (e) {
                                console.warn('Chargement controle relation chat (non critique):', e);
                            }

                            try {
                                const [settingsSnap, presenceSnap] = await Promise.all([
                                    getDoc(doc(db, 'users', otherUid, 'settings', 'chat')),
                                    getDoc(doc(db, 'users', otherUid, 'presence', 'chat')),
                                ]);
                                const settingsData: any = settingsSnap.exists() ? settingsSnap.data() : {};
                                const presenceData: any = presenceSnap.exists() ? presenceSnap.data() : {};
                                setContactPrivacy({
                                    onlineStatus: settingsData.onlineStatus !== false,
                                    lastSeen: settingsData.lastSeen !== false,
                                    isOnline: presenceData.isOnline === true,
                                    lastSeenAt: presenceData.lastSeen,
                                });
                            } catch (e) {
                                console.warn('Chargement confidentialité contact (non critique):', e);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur chargement conversation:', error);
            }
        };

        loadConversationData();
    }, [conversationId, currentUser]);

    useEffect(() => {
        const loadMyAvatar = async () => {
            if (!currentUser?.uid) return;
            try {
                const uSnap = await getDoc(doc(db, 'users', currentUser.uid));
                const uData: any = uSnap.exists() ? uSnap.data() : {};
                const avatarUrl =
                    uData?.profileImage ||
                    uData?.photoURL ||
                    uData?.avatarUrl ||
                    uData?.profilePhotoUrl ||
                    uData?.kyc?.profileImage ||
                    currentUser.photoURL ||
                    '';
                setMyAvatar(avatarUrl ? String(avatarUrl) : '');
            } catch (e) {
                setMyAvatar(currentUser.photoURL || '');
            }
        };
        loadMyAvatar();
    }, [currentUser?.uid, currentUser?.photoURL]);

    // Charger les messages
    useEffect(() => {
        if (!conversationId) return;

        setIsLoading(true);
        const unsubscribe = loadMessages(conversationId, (msgs) => {
            setMessages(msgs);
            setIsLoading(false);
            // Scroll vers le bas
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => {
            unsubscribe?.();
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, [conversationId, loadMessages]);

    // Marquer comme lu uniquement quand l'utilisateur ouvre la conversation
    useEffect(() => {
        if (!conversationId || !currentUser?.uid) return;
        const run = async () => {
            try {
                const convRef = doc(db, 'conversations', conversationId);
                await updateDoc(convRef, {
                    [`unreadCountByUid.${currentUser.uid}`]: 0,
                    unreadCount: 0,
                    ...(chatSettings.readReceipts ? { [`lastReadAtByUid.${currentUser.uid}`]: serverTimestamp() } : {}),
                } as any);
            } catch (e) {
                console.warn('Marquage lu (non critique):', e);
            }
        };
        run();
    }, [chatSettings.readReceipts, conversationId, currentUser?.uid]);

    // Update video preview stream when recording
    useEffect(() => {
        if (recordingType === 'video' && streamRef.current && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = streamRef.current;
        }
    }, [recordingType, isRecording]);

    // Close message menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showMessageMenu) {
                setShowMessageMenu(null);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMessageMenu]);

    // Auto scroll to bottom when messages change
    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, [messages]);

    // Auto-resize textarea (wrap + grows up to a max height)
    useEffect(() => {
        const el = textAreaRef.current;
        if (!el) return;
        el.style.height = '0px';
        const next = Math.min(el.scrollHeight, 140);
        el.style.height = `${Math.max(next, 44)}px`;
    }, [inputValue]);

    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage && TRANSLATION_LANGUAGES.some((language) => language.code === storedLanguage)) {
            setTargetLanguage(storedLanguage);
        }

        const handleLanguageChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ language?: string }>;
            const nextLanguage = customEvent.detail?.language;
            if (nextLanguage && TRANSLATION_LANGUAGES.some((language) => language.code === nextLanguage)) {
                setTargetLanguage(nextLanguage);
            }
        };

        window.addEventListener('enkamba-dashboard-language-change', handleLanguageChange);
        return () => window.removeEventListener('enkamba-dashboard-language-change', handleLanguageChange);
    }, []);

    useEffect(() => {
        if (!conversationId) return;

        const storedTranslations = window.localStorage.getItem(`${TRANSLATION_CACHE_PREFIX}:${conversationId}`);
        if (!storedTranslations) return;

        try {
            setInlineTranslations(JSON.parse(storedTranslations) as Record<string, InlineTranslation>);
        } catch {
            window.localStorage.removeItem(`${TRANSLATION_CACHE_PREFIX}:${conversationId}`);
        }
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;

        const cacheKey = `${TRANSLATION_CACHE_PREFIX}:${conversationId}`;
        if (Object.keys(inlineTranslations).length === 0) {
            window.localStorage.removeItem(cacheKey);
            return;
        }

        window.localStorage.setItem(cacheKey, JSON.stringify(inlineTranslations));
    }, [conversationId, inlineTranslations]);

    const isGroupConversation = useMemo(() => Boolean(isGroup), [isGroup]);

    const canTranslateMessage = useCallback((message: any) => {
        return (
            !message?.isDeleted &&
            (!message?.messageType || message.messageType === 'text') &&
            typeof message?.text === 'string' &&
            message.text.trim().length > 0
        );
    }, []);

    const translateMessageInline = useCallback(async (message: any, language = targetLanguage) => {
        if (!canTranslateMessage(message)) return;
        const messageId = message.id;
        const cleanText = message.text.trim();

        setTranslationAction(null);
        setTranslatingMessageIds((current) => ({ ...current, [messageId]: true }));

        try {
            const response = await fetch('/api/chat/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: cleanText,
                    targetLanguage: language,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Impossible de traduire le message');
            }

            const result = data as TranslationResult;
            setInlineTranslations((current) => ({
                ...current,
                [messageId]: {
                    translatedText: result.translatedText,
                    sourceLanguageName: result.sourceLanguageName,
                    targetLanguage: result.targetLanguage || language,
                    targetLanguageName: result.targetLanguageName,
                },
            }));
        } catch (error) {
            setInlineTranslations((current) => ({
                ...current,
                [messageId]: {
                    translatedText: '',
                    error: error instanceof Error ? error.message : 'Impossible de traduire le message',
                },
            }));
        } finally {
            setTranslatingMessageIds((current) => {
                const next = { ...current };
                delete next[messageId];
                return next;
            });
        }
    }, [canTranslateMessage, targetLanguage]);

    const translateMessageToLanguage = useCallback((message: any, language: string) => {
        if (!TRANSLATION_LANGUAGES.some((item) => item.code === language)) return;

        setMessageTargetLanguages((current) => ({
            ...current,
            [message.id]: language,
        }));
        setTargetLanguage(language);
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        void translateMessageInline(message, language);
    }, [translateMessageInline]);

    const hideInlineTranslation = useCallback((messageId: string) => {
        setInlineTranslations((current) => {
            const next = { ...current };
            delete next[messageId];
            return next;
        });
    }, []);

    const showTranslationAction = useCallback((message: any, point: { x: number; y: number }) => {
        if (!canTranslateMessage(message)) return;

        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 640;
        const floatingWidth = 210;
        const floatingHeight = 86;
        const margin = 12;

        setTranslationAction({
            message,
            x: Math.min(Math.max(point.x, margin + floatingWidth / 2), viewportWidth - margin - floatingWidth / 2),
            y: Math.min(Math.max(point.y - floatingHeight - 10, margin), viewportHeight - margin - floatingHeight),
        });
    }, [canTranslateMessage]);

    const clearMessageLongPress = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        longPressPointRef.current = null;
    }, []);

    const startMessageLongPress = useCallback((message: any, point: { x: number; y: number }) => {
        clearMessageLongPress();
        if (!canTranslateMessage(message)) return;

        longPressPointRef.current = point;
        longPressTimerRef.current = setTimeout(() => {
            longPressTimerRef.current = null;
            longPressPointRef.current = null;
            showTranslationAction(message, point);
        }, 650);
    }, [canTranslateMessage, clearMessageLongPress, showTranslationAction]);

    const handleMessagePointerMove = useCallback((e: PointerEvent) => {
        const point = longPressPointRef.current;
        if (!point) return;

        const distance = Math.hypot(e.clientX - point.x, e.clientY - point.y);
        if (distance > 12) {
            clearMessageLongPress();
        }
    }, [clearMessageLongPress]);

    const handleMessageTouchStart = useCallback((message: any, e: TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) return;
        startMessageLongPress(message, { x: touch.clientX, y: touch.clientY });
    }, [startMessageLongPress]);

    const handleMessageTouchMove = useCallback((e: TouchEvent) => {
        const point = longPressPointRef.current;
        const touch = e.touches[0];
        if (!point || !touch) return;

        const distance = Math.hypot(touch.clientX - point.x, touch.clientY - point.y);
        if (distance > 12) {
            clearMessageLongPress();
        }
    }, [clearMessageLongPress]);

    // Charger les avatars des expéditeurs (groupe + fallback 1-1)
    useEffect(() => {
        if (!currentUser?.uid) return;
        if (!messages.length) return;
        if (!isGroupConversation) return;

        const needed = new Set<string>();
        for (const m of messages) {
            const sid = m?.senderId;
            if (!sid || sid === currentUser.uid) continue;
            if (m?.senderPhoto) continue;
            if (senderAvatars[sid]) continue;
            needed.add(sid);
        }
        const ids = Array.from(needed);
        if (!ids.length) return;

        (async () => {
            try {
                const chunks: string[][] = [];
                for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
                const next: Record<string, string> = {};
                for (const chunk of chunks) {
                    const usersQ = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                    const usersSnap = await getDocs(usersQ);
                    usersSnap.forEach((u) => {
                        const ud: any = u.data() || {};
                        const avatarUrl =
                            ud.profileImage ||
                            ud.photoURL ||
                            ud.avatarUrl ||
                            ud.profilePhotoUrl ||
                            ud.kyc?.profileImage ||
                            '';
                        if (avatarUrl) next[u.id] = String(avatarUrl);
                    });
                }
                if (Object.keys(next).length) {
                    setSenderAvatars((prev) => ({ ...prev, ...next }));
                }
            } catch (e) {
                console.warn('Chargement avatars groupe (non critique):', e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, isGroupConversation, currentUser?.uid]);

    const formatCallDuration = (seconds: number) => {
        const s = Math.max(0, Math.floor(seconds || 0));
        const mins = Math.floor(s / 60).toString().padStart(2, '0');
        const secs = (s % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const formatCallTime = (ms: number | null | undefined) => {
        if (!ms || typeof ms !== 'number') return null;
        try {
            return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return null;
        }
    };

    // Envoyer un message
    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;
        if (!isGroup && relationshipControl.blocked) {
            alert('Ce contact est bloqué. Débloquez-le pour envoyer un message.');
            return;
        }

        const messageText = inputValue;
        setInputValue('');
        setIsSending(true);

        try {
            // Si on est en mode édition
            if (editingMessage) {
                await updateMessage(conversationId, editingMessage.id, messageText);
                setEditingMessage(null);
            } else {
                // Attacher le message original complet si on répond à un message
                const metadata = replyingTo
                    ? {
                        replyTo: replyingTo.id,
                        repliedMessage: {
                            id: replyingTo.id,
                            text: replyingTo.text,
                            senderName: replyingTo.senderName,
                            senderId: replyingTo.senderId,
                            messageType: replyingTo.messageType,
                        },
                    }
                    : undefined;

                await sendMessage(conversationId, messageText, 'text', metadata);
                setReplyingTo(null);
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
            setInputValue(messageText); // Restaurer le message en cas d'erreur
        } finally {
            setIsSending(false);
        }
    };

    // Supprimer un message
    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;

        try {
            await deleteMessage(conversationId, messageId);
            setShowMessageMenu(null);
        } catch (error) {
            console.error('Erreur suppression message:', error);
            alert('Impossible de supprimer le message');
        }
    };

    // Commencer l'édition d'un message
    const handleEditMessage = (message: any) => {
        setEditingMessage(message);
        setInputValue(message.text);
        setShowMessageMenu(null);
    };

    // Annuler l'édition
    const cancelEdit = () => {
        setEditingMessage(null);
        setInputValue('');
    };

    // Initialiser l'analyseur audio pour le spectre
    const initAudioAnalyser = (audioElement: HTMLAudioElement) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const audioContext = audioContextRef.current;
        const source = audioContext.createMediaElementSource(audioElement);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyserRef.current = analyser;
        return analyser;
    };

    // Mettre à jour le spectre audio
    const updateAudioSpectrum = (analyser: AnalyserNode, messageId: string) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const animate = () => {
            analyser.getByteFrequencyData(dataArray);
            setFrequencyData(new Uint8Array(dataArray));
            
            if (playingMessageId === messageId) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };
        
        animate();
    };

    // Envoyer un message vocal
    const handleVoiceMessage = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setRecordingType('audio');
            setRecordingDuration(0);

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                setRecordingBlob(blob);
            };

            mediaRecorder.start();

            // Timer pour la durée
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((d) => d + 1);
            }, 1000);
        } catch (err) {
            console.error('Erreur accès microphone:', err);
            alert('Impossible d\'accéder au microphone');
            setIsRecording(false);
            setRecordingType(null);
        }
    };

    // Arrêter l'enregistrement en cours
    const stopRecordingNow = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
    };

    // Envoyer un message vidéo
    const handleVideoMessage = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            
            // Afficher le flux vidéo dans la preview
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
            }
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setRecordingType('video');
            setRecordingDuration(0);

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                setRecordingBlob(blob);
            };

            mediaRecorder.start();

            // Timer pour la durée
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((d) => d + 1);
            }, 1000);
        } catch (err) {
            console.error('Erreur accès caméra:', err);
            alert('Impossible d\'accéder à la caméra');
            setIsRecording(false);
            setRecordingType(null);
        }
    };

    // Annuler l'enregistrement
    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
        setRecordingBlob(null);
        setRecordingType(null);
        setRecordingDuration(0);
    };

    // Envoyer l'enregistrement
    const sendRecording = async () => {
        if (!recordingBlob || !recordingType) return;

        setIsSending(true);
        setSendingProgress(0);
        try {
            // Convertir le blob en fichier
            const fileName = `${recordingType}-${Date.now()}.${recordingType === 'audio' ? 'wav' : 'webm'}`;
            const file = new File([recordingBlob], fileName, { 
                type: recordingType === 'audio' ? 'audio/wav' : 'video/webm' 
            });

            const messageText = recordingType === 'audio' ? '🎤 Message vocal' : '🎥 Message vidéo';
            
            // Simuler une progression d'envoi
            const progressInterval = setInterval(() => {
                setSendingProgress((prev) => {
                    if (prev >= 70) return prev;
                    return prev + Math.random() * 20;
                });
            }, 200);

            try {
                // Upload vers Cloudinary
                const resourceType = recordingType === 'audio' ? 'video' : 'video'; // Cloudinary traite audio comme video
                const uploadResult = await uploadToCloudinary(file, resourceType);
                
                setSendingProgress(90);

                // Envoyer le message avec l'URL Cloudinary
                const messageType = recordingType === 'audio' ? 'voice' : 'video';
                await sendMessage(conversationId, messageText, messageType, { 
                    mediaUrl: uploadResult.secureUrl,
                    duration: recordingDuration,
                    thumbnailUrl: uploadResult.thumbnailUrl
                });
                
                setSendingProgress(100);
                setTimeout(() => {
                    cancelRecording();
                    setSendingProgress(0);
                }, 500);
            } finally {
                clearInterval(progressInterval);
                setIsSending(false);
            }
        } catch (error) {
            console.error('Erreur envoi enregistrement:', error);
            setIsSending(false);
            setSendingProgress(0);
        }
    };
    const handleShareLocation = async () => {
        if (!chatSettings.locationSharing) {
            alert('Activez le partage de localisation dans les paramètres du chat.');
            return;
        }

        try {
            const locationData = await getCurrentLocation();
            if (!locationData) return;

            setIsSending(true);
            try {
                await sendMessage(conversationId, `📍 Localisation partagée`, 'location', { 
                    latitude: locationData.latitude, 
                    longitude: locationData.longitude,
                    address: locationData.address,
                    accuracy: locationData.accuracy
                });
            } finally {
                setIsSending(false);
            }
        } catch (err) {
            console.error('Erreur accès localisation:', err);
            alert('Impossible d\'accéder à votre localisation');
        }
    };

    const contactStatusText = useMemo(() => {
        if (isGroup) return `${groupData?.participants?.length || 0} membres`;
        if (contactPrivacy.onlineStatus && contactPrivacy.isOnline) return 'En ligne';
        if (contactPrivacy.lastSeen && contactPrivacy.lastSeenAt?.toDate) {
            return `Vu ${contactPrivacy.lastSeenAt.toDate().toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            })}`;
        }
        return 'Statut masqué';
    }, [contactPrivacy.isOnline, contactPrivacy.lastSeen, contactPrivacy.lastSeenAt, contactPrivacy.onlineStatus, groupData?.participants?.length, isGroup]);

    const mediaMessages = useMemo(() => {
        return messages.filter((message) =>
            message?.metadata?.mediaUrl ||
            message?.metadata?.thumbnailUrl ||
            message?.metadata?.fileType?.startsWith?.('image/') ||
            message?.messageType === 'video' ||
            message?.messageType === 'voice'
        );
    }, [messages]);

    const toggleConversationNotifications = async () => {
        if (!currentUser?.uid) return;
        const nextMuted = !isConversationMuted;
        setIsConversationMuted(nextMuted);
        try {
            await updateDoc(doc(db, 'conversations', conversationId), {
                [`mutedByUid.${currentUser.uid}`]: nextMuted,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            setIsConversationMuted(!nextMuted);
            console.error('Erreur notification conversation:', error);
            alert('Impossible de mettre à jour les notifications.');
        }
    };

    const updateContactRelationship = async (updates: { restricted?: boolean; blocked?: boolean }) => {
        if (!currentUser?.uid || !contact?.id || relationshipControl.isLoading) return;

        setRelationshipControl((current) => ({ ...current, isLoading: true }));
        try {
            const nextRestricted = updates.restricted ?? relationshipControl.restricted;
            const nextBlocked = updates.blocked ?? relationshipControl.blocked;

            await setDoc(
                doc(db, 'makutano_relationship_controls', `${currentUser.uid}_${contact.id}`),
                {
                    ownerId: currentUser.uid,
                    targetId: contact.id,
                    targetName: contact.name || 'Contact',
                    restricted: nextBlocked ? false : nextRestricted,
                    blocked: nextBlocked,
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );

            if (nextBlocked) {
                await deleteDoc(doc(db, 'makutano_follows', `${currentUser.uid}_${contact.id}`)).catch(() => undefined);
            }

            setRelationshipControl({
                restricted: nextBlocked ? false : nextRestricted,
                blocked: nextBlocked,
                isLoading: false,
            });
        } catch (error) {
            console.error('Erreur controle relation chat:', error);
            setRelationshipControl((current) => ({ ...current, isLoading: false }));
            alert('Impossible d’appliquer cette action.');
        }
    };

    const hideConversationForMe = async () => {
        if (!currentUser?.uid) return;
        const confirmed = window.confirm('Retirer cette discussion de votre liste ?');
        if (!confirmed) return;

        try {
            await updateDoc(doc(db, 'conversations', conversationId), {
                [`hiddenByUid.${currentUser.uid}`]: true,
                updatedAt: serverTimestamp(),
            });
            router.push('/dashboard/miyiki-chat');
        } catch (error) {
            console.error('Erreur retrait conversation:', error);
            alert('Impossible de retirer cette discussion.');
        }
    };

    const reportConversation = async () => {
        if (!currentUser?.uid || !conversationId) return;
        const confirmed = window.confirm('Signaler cette discussion à l’équipe eNkamba ?');
        if (!confirmed) return;

        try {
            await addDoc(collection(db, 'chat_reports'), {
                conversationId,
                reporterId: currentUser.uid,
                contactId: contact?.id || '',
                contactName: contact?.name || 'Contact',
                isGroup,
                reason: 'Signalement conversation',
                status: 'open',
                createdAt: serverTimestamp(),
            });
            alert('Signalement envoyé.');
        } catch (error) {
            console.error('Erreur signalement conversation:', error);
            alert('Impossible d’envoyer le signalement.');
        }
    };

    // Envoyer de l'argent
    const handleSendMoney = async () => {
        const amountStr = prompt('Montant à envoyer (en FC):');
        if (!amountStr) return;

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            alert('Montant invalide');
            return;
        }

        setIsSending(true);
        try {
            // Vérifier que c'est une conversation individuelle
            if (isGroup) {
                alert('Les transferts d\'argent ne sont possibles qu\'en conversation individuelle');
                return;
            }

            if (!contact?.id) {
                alert('Destinataire non trouvé');
                return;
            }

            // Envoyer l'argent via l'API
            const result = await sendMoney(
                amount,
                contact.id,
                contact.name,
                conversationId
            );

            // Envoyer le message de transfert
            await sendMessage(conversationId, `💰 Transfert de ${amount} FC`, 'money', {
                amount,
                recipientId: contact.id,
                recipientName: contact.name,
                transactionId: result.transactionId,
                status: 'pending',
            });

            alert(`Transfert de ${amount} FC envoyé à ${contact.name}`);
        } catch (error) {
            console.error('Erreur transfert:', error);
            alert(error instanceof Error ? error.message : 'Erreur lors du transfert');
        } finally {
            setIsSending(false);
        }
    };

    // Envoyer un fichier
    const handleSendFile = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setIsSending(true);
                setSendingProgress(0);
                
                const progressInterval = setInterval(() => {
                    setSendingProgress((prev) => {
                        if (prev >= 70) return prev;
                        return prev + Math.random() * 20;
                    });
                }, 200);

                try {
                    // Déterminer le type de ressource pour Cloudinary
                    let resourceType: 'image' | 'video' | 'raw' = 'raw';
                    let messageType: 'file' | 'voice' | 'video' = 'file';
                    let messageText = `📎 ${file.name}`;

                    if (file.type.startsWith('image/')) {
                        resourceType = 'image';
                        messageText = `🖼️ ${file.name}`;
                    } else if (file.type.startsWith('video/')) {
                        resourceType = 'video';
                        messageType = 'video';
                        messageText = `🎥 ${file.name}`;
                    } else if (file.type.startsWith('audio/')) {
                        resourceType = 'video'; // Cloudinary traite audio comme video
                        messageType = 'voice';
                        messageText = `🎤 ${file.name}`;
                    }

                    // Upload vers Cloudinary
                    const uploadResult = await uploadToCloudinary(file, resourceType);
                    
                    setSendingProgress(90);

                    // Envoyer le message avec l'URL Cloudinary
                    await sendMessage(conversationId, messageText, messageType, { 
                        fileName: file.name, 
                        fileType: file.type, 
                        fileSize: file.size,
                        mediaUrl: uploadResult.secureUrl,
                        thumbnailUrl: uploadResult.thumbnailUrl
                    });

                    setSendingProgress(100);
                    setTimeout(() => {
                        setSendingProgress(0);
                    }, 500);
                } catch (error) {
                    console.error('Erreur envoi fichier:', error);
                } finally {
                    clearInterval(progressInterval);
                    setIsSending(false);
                }
            }
        };
        input.click();
    };

    return (
        <div className="flex h-full flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-auto flex-col bg-gradient-to-r from-primary via-primary to-primary px-4 py-3 shadow-lg flex-shrink-0">
                <div className="flex items-center gap-4 mb-3">
                    <Link href="/dashboard/miyiki-chat">
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            if (isGroup) {
                                setShowGroupSettings(true);
                            } else {
                                setShowContactDetails(true);
                            }
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                        <Avatar className="h-10 w-10 border-2 border-white/20">
                            {!isGroup && contact?.avatar && (
                                <AvatarImage src={contact.avatar} alt={contact?.name || 'Contact'} className="object-cover" />
                            )}
                            <AvatarFallback className="bg-white/20 text-white">
                                {isGroup ? (
                                    <Users className="h-5 w-5" />
                                ) : (
                                    contact?.name?.charAt(0)?.toUpperCase() || 'U'
                                )}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h1 className="truncate font-headline text-lg font-bold text-white">
                                {contact?.name || 'Conversation'}
                            </h1>
                            <p className="text-xs text-white/70">
                                {contactStatusText}
                            </p>
                        </div>
                    </button>

                    {/* Group Settings Button */}
                    {isGroup && (
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-white hover:bg-white/20" 
                            title="Paramètres du groupe"
                            onClick={() => setShowGroupSettings(true)}
                        >
                            <Settings className="h-5 w-5" />
                        </Button>
                    )}

                    {/* Call Buttons - Only for individual conversations */}
                    {!isGroup && (
                        <>
                            <Link href={`/dashboard/miyiki-chat/audiocall/${conversationId}`}>
                                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" title="Appel audio">
                                    <Phone className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href={`/dashboard/miyiki-chat/call/${conversationId}`}>
                                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" title="Appel vidéo">
                                    <Video className="h-5 w-5" />
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
                
                {/* Contact Details - Only for individual conversations */}
                {contact && !isGroup && (
                    <div className="ml-14 space-y-1 pb-2 border-t border-white/20 pt-2">
                        {contact.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-white/90">
                                <Phone className="h-4 w-4" />
                                <span>{contact.phoneNumber}</span>
                            </div>
                        )}
                        {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-white/90">
                                <Mail className="h-4 w-4" />
                                <span>{contact.email}</span>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Incoming call banner */}
            {incomingCall && !isGroup && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-primary via-primary to-[#FFA500] text-white shadow-md flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-white/30">
                            {contact?.avatar ? (
                                <AvatarImage src={contact.avatar} alt={contact?.name || 'Contact'} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-white/15 text-white">
                                {(contact?.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                                {contact?.name || 'Appel entrant'}
                            </div>
                            <div className="text-xs text-white/80">
                                Appel {incomingCall.callType === 'audio' ? 'audio' : 'vidéo'} en cours…
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
                            onClick={acceptIncomingCall}
                        >
                            {incomingCall.callType === 'audio' ? <Phone className="h-4 w-4 mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                            Accepter
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-white hover:bg-white/15"
                            onClick={() => void declineIncomingCall()}
                            title="Refuser"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Messages Container */}
            <main
                className="relative flex-1 overflow-y-auto bg-cover bg-center bg-no-repeat px-3 py-2 space-y-0.5 flex-shrink min-h-0 sm:px-4"
                style={{ backgroundImage: activeWallpaper.backgroundImage }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <ChatNavIcon size={48} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-muted-foreground">Aucun message pour le moment</p>
                            <p className="text-xs text-muted-foreground mt-1">Commencez la conversation</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.senderId === currentUser?.uid;
                        // Messages audio/vidéo avec Cloudinary
                        const isAudioMessage = message.messageType === 'voice' && message.metadata?.mediaUrl;
                        const isVideoMessage = message.messageType === 'video' && message.metadata?.mediaUrl;
                        
                        // Support legacy: messages avec base64 (anciens messages)
                        const isLegacyAudioMessage = (message.messageType === 'voice' || message.text?.includes('🎤')) && message.metadata?.audio;
                        const isLegacyVideoMessage = (message.messageType === 'video' || message.text?.includes('🎥')) && message.metadata?.video;
                        
                        const audioUrl = message.metadata?.mediaUrl || (message.metadata?.audio ? `data:audio/wav;base64,${message.metadata.audio}` : null);
                        const videoUrl = message.metadata?.mediaUrl || (message.metadata?.video ? `data:video/webm;base64,${message.metadata.video}` : null);
                        const isPlaying = playingMessageId === message.id;
                        const inlineTranslation = inlineTranslations[message.id];
                        const isMessageTranslating = Boolean(translatingMessageIds[message.id]);
                        const selectedTranslationLanguage = messageTargetLanguages[message.id] || inlineTranslation?.targetLanguage || targetLanguage;

                        return (
                            <div
                                key={message.id}
                                className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`group relative flex flex-col gap-0 ${
                                        isOwn ? 'items-end' : 'items-start'
                                    } w-full max-w-[82%] sm:max-w-[74%]`}
                                >
                                    {/* Nom de l'expéditeur pour les groupes (sauf pour ses propres messages) */}
                                    {isGroup && !isOwn && message.senderName && (
                                        <p className="text-[11px] font-semibold text-primary px-2.5 leading-3">
                                            {message.senderName}
                                        </p>
                                    )}
                                    
                                    {/* Reply Preview - Show the original message being replied to */}
                                    {message.metadata?.replyTo && (() => {
                                        // Utiliser le message attaché dans metadata au lieu de chercher dans le tableau
                                        const repliedMessage = message.metadata.repliedMessage || messages.find(m => m.id === message.metadata.replyTo);
                                        return (
                                            <div className={`text-xs px-2.5 py-1.5 rounded-lg border-l-4 ${
                                                isOwn 
                                                    ? 'border-white/40 bg-white/10 text-white/80' 
                                                    : 'border-primary/40 bg-primary/10 text-primary/80'
                                            }`}>
                                                <p className="font-semibold mb-0.5">
                                                    {repliedMessage?.senderName || 'Utilisateur'}
                                                </p>
                                                <p className="truncate opacity-80">
                                                    {repliedMessage?.text?.substring(0, 60) || 'Message audio/vidéo'}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                    
                                    <div className={`relative flex items-end gap-1 ${isOwn ? 'justify-end' : 'justify-start'} w-full`}>
                                        {/* Avatar for non-own messages */}
                                        {!isOwn && (
                                            <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                                                <AvatarImage 
                                                    src={message.senderPhoto || senderAvatars[message.senderId] || (!isGroup ? contact?.avatar : undefined) || undefined}
                                                    alt={message.senderName}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                                                    {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <Card
                                            className={`relative px-3 py-1 rounded-2xl cursor-pointer hover:shadow-md transition-shadow w-fit max-w-full ${
                                                isOwn
                                                    ? 'bg-primary text-white rounded-br-none'
                                                    : 'bg-muted text-foreground rounded-bl-none'
                                            } ${!isOwn && canTranslateMessage(message) ? 'pr-12' : ''} ${message.isDeleted ? 'opacity-60 italic' : ''}`}
                                            onPointerDown={(e) => {
                                                if (e.pointerType === 'mouse') return;
                                                startMessageLongPress(message, { x: e.clientX, y: e.clientY });
                                            }}
                                            onPointerUp={clearMessageLongPress}
                                            onPointerCancel={clearMessageLongPress}
                                            onPointerLeave={clearMessageLongPress}
                                            onPointerMove={handleMessagePointerMove}
                                            onTouchStart={(e) => handleMessageTouchStart(message, e)}
                                            onTouchEnd={clearMessageLongPress}
                                            onTouchCancel={clearMessageLongPress}
                                            onTouchMove={handleMessageTouchMove}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                if (!message.isDeleted) {
                                                    if (canTranslateMessage(message)) {
                                                        showTranslationAction(message, { x: e.clientX, y: e.clientY });
                                                    } else {
                                                        setReplyingTo(message);
                                                    }
                                                }
                                            }}
                                        >
                                        {!isOwn && canTranslateMessage(message) && (
                                            <div className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-0.5">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void translateMessageInline(message, selectedTranslationLanguage);
                                                    }}
                                                    disabled={isMessageTranslating}
                                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-sm transition hover:bg-primary hover:text-white disabled:cursor-wait disabled:opacity-70"
                                                    aria-label="Traduire ce message"
                                                    title="Traduire"
                                                >
                                                    {isMessageTranslating ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Languages className="h-3 w-3" />
                                                    )}
                                                </button>
                                                <label
                                                    className="relative h-4 w-7 overflow-hidden rounded-full border border-primary/15 bg-white text-primary shadow-sm"
                                                    title="Choisir la langue de traduction"
                                                >
                                                    <span className="pointer-events-none flex h-full w-full items-center justify-center text-[8px] font-black uppercase leading-none">
                                                        {selectedTranslationLanguage}
                                                    </span>
                                                    <select
                                                        value={selectedTranslationLanguage}
                                                        disabled={isMessageTranslating}
                                                        aria-label="Langue de traduction"
                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
                                                        onPointerDown={(event) => event.stopPropagation()}
                                                        onTouchStart={(event) => event.stopPropagation()}
                                                        onClick={(event) => event.stopPropagation()}
                                                        onChange={(event) => {
                                                            event.stopPropagation();
                                                            translateMessageToLanguage(message, event.target.value);
                                                        }}
                                                    >
                                                        {TRANSLATION_LANGUAGES.map((language) => (
                                                            <option key={language.code} value={language.code}>
                                                                {language.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                        )}
                                        {(isAudioMessage || isLegacyAudioMessage) && audioUrl ? (
                                            <div className="space-y-2 w-full">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={`h-9 w-9 p-0 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            isOwn ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-700'
                                                        }`}
                                                        onClick={() => {
                                                            const audioElement = document.getElementById(`audio-${message.id}`) as HTMLAudioElement;
                                                            if (audioElement) {
                                                                if (isPlaying) {
                                                                    audioElement.pause();
                                                                    setPlayingMessageId(null);
                                                                    if (animationFrameRef.current) {
                                                                        cancelAnimationFrame(animationFrameRef.current);
                                                                    }
                                                                } else {
                                                                    audioElement.play();
                                                                    setPlayingMessageId(message.id);
                                                                    const analyser = initAudioAnalyser(audioElement);
                                                                    updateAudioSpectrum(analyser, message.id);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {isPlaying ? (
                                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        )}
                                                    </Button>
                                                    <span className={`text-sm font-medium leading-5 ${isOwn ? 'text-white' : 'text-gray-700'}`}>
                                                        {message.metadata?.duration ? `${Math.floor(message.metadata.duration / 60)}:${String(message.metadata.duration % 60).padStart(2, '0')}` : 'Vocal'}
                                                    </span>
                                                </div>
                                                
                                                {/* Audio Spectrum Visualizer */}
                                                {isPlaying && frequencyData && (
                                                    <div className="flex items-center justify-center gap-0.5 h-10 bg-black/10 rounded-lg p-1.5">
                                                        {Array.from({ length: 32 }).map((_, i) => {
                                                            const index = Math.floor((i / 32) * frequencyData.length);
                                                            const value = frequencyData[index] || 0;
                                                            const height = (value / 255) * 100;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`flex-1 rounded-full transition-all duration-75 ${
                                                                        isOwn ? 'bg-white/60' : 'bg-primary/60'
                                                                    }`}
                                                                    style={{ height: `${Math.max(height, 10)}%` }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                
                                                {audioUrl && (
                                                    <audio
                                                        id={`audio-${message.id}`}
                                                        src={audioUrl}
                                                        onPlay={() => setPlayingMessageId(message.id)}
                                                        onPause={() => setPlayingMessageId(null)}
                                                        onEnded={() => setPlayingMessageId(null)}
                                                        className="w-full h-8"
                                                        controls
                                                    />
                                                )}
                                            </div>
                                        ) : (isVideoMessage || isLegacyVideoMessage) && videoUrl ? (
                                            <div className="space-y-1.5">
                                                <video
                                                    src={videoUrl}
                                                    className="w-full h-48 bg-black rounded-lg"
                                                    controls
                                                />
                                                <p className="text-xs text-center opacity-70">
                                                    {message.metadata?.duration ? `${Math.floor(message.metadata.duration / 60)}:${String(message.metadata.duration % 60).padStart(2, '0')}` : 'Vidéo'}
                                                </p>
                                        </div>
                                    ) : message.messageType === 'story_reply' && message.metadata?.storyId ? (
                                        <div className="space-y-1.5">
                                            {/* Référence à la story */}
                                            <div className="bg-black/10 dark:bg-white/10 rounded-lg p-2 border-l-4 border-purple-500">
                                                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-0.5">
                                                    Réponse à une story
                                                </p>
                                                {message.metadata.storyMediaUrl && (
                                                    <div className="relative w-full h-32 rounded overflow-hidden mb-1.5">
                                                        {message.metadata.storyType === 'photo' ? (
                                                            <img
                                                                src={message.metadata.storyMediaUrl}
                                                                alt="Story"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : message.metadata.storyType === 'video' ? (
                                                            <video
                                                                src={message.metadata.storyMediaUrl}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                            />
                                                        ) : message.metadata.storyType === 'audio' ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                                                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                                                </svg>
                                                            </div>
                                                        ) : null}
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                            <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded">
                                                                Story de {message.metadata.storyOwnerName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Message de réponse */}
                                            <p className="text-sm leading-5">{message.text}</p>
                                        </div>
                                    ) : message.messageType === 'location' && message.metadata?.latitude && message.metadata?.longitude ? (
                                        <LocationMessage
                                            latitude={message.metadata.latitude}
                                            longitude={message.metadata.longitude}
                                            address={message.metadata.address}
                                            senderName={message.senderName}
                                            senderPhoto={message.senderPhoto}
                                            receiverName={contact?.name}
                                            receiverPhoto={contact?.photoURL}
                                            timestamp={message.timestamp?.toDate?.()}
                                        />
                                    ) : message.messageType === 'file' && (message.metadata?.fileName || message.metadata?.mediaUrl) ? (
                                        <FileMessage
                                            fileName={message.metadata.fileName}
                                            fileType={message.metadata.fileType}
                                            fileData={message.metadata.fileData}
                                            mediaUrl={message.metadata.mediaUrl}
                                            thumbnailUrl={message.metadata.thumbnailUrl}
                                            fileSize={message.metadata.fileSize}
                                            senderName={message.senderName}
                                            timestamp={message.timestamp?.toDate?.()}
                                        />
                                    ) : message.messageType === 'money' && message.metadata?.amount ? (
                                        <MoneyTransferMessage
                                            amount={message.metadata.amount}
                                            currency={message.metadata.currency || 'FC'}
                                            senderName={message.senderName}
                                            senderPhoto={message.senderPhoto}
                                            receiverName={contact?.name}
                                            receiverPhoto={contact?.photoURL}
                                            status={message.metadata.status || 'pending'}
                                            transactionId={message.metadata.transactionId}
                                            timestamp={message.timestamp?.toDate?.()}
                                            isReceiver={!isOwn}
                                            onAccept={async () => {
                                                await acceptTransfer(
                                                    message.id,
                                                    conversationId,
                                                    message.metadata.amount,
                                                    message.senderId
                                                );
                                            }}
                                            onReject={async () => {
                                                await rejectTransfer(message.id, conversationId);
                                            }}
                                        />
                                    ) : message.messageType === 'call' && message.metadata?.callType ? (
                                        (() => {
                                            const callTitle = message.metadata.callType === 'video' ? 'Appel vidéo' : 'Appel audio';
                                            const callStatus = message.metadata.status === 'no_answer'
                                                ? 'Sans réponse'
                                                : message.metadata.status === 'missed'
                                                    ? 'Manqué'
                                                    : message.metadata.durationSec
                                                        ? formatCallDuration(message.metadata.durationSec)
                                                        : 'Terminé';
                                            const callTime = formatCallTime(
                                                message.metadata.endedAtMs ||
                                                message.metadata.acceptedAtMs ||
                                                message.metadata.receivedAtMs ||
                                                message.metadata.createdAtMs
                                            );

                                            return (
                                                <div className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 ${
                                                    isOwn ? 'border-white/20 bg-white/10 text-white' : 'border-border bg-background text-foreground'
                                                }`}>
                                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                                        isOwn ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
                                                    }`}>
                                                        {message.metadata.callType === 'video' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                                                    </span>
                                                    <span className="min-w-0 truncate text-[11px] leading-none">
                                                        <span className="font-bold">{callTitle}</span>
                                                        <span className={isOwn ? 'text-white/75' : 'text-muted-foreground'}> · {callStatus}</span>
                                                        {callTime ? (
                                                            <span className={isOwn ? 'text-white/60' : 'text-muted-foreground'}> · {callTime}</span>
                                                        ) : null}
                                                    </span>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <p className="text-sm leading-5 whitespace-pre-wrap break-words">{message.text}</p>
                                    )}
                                    {(isMessageTranslating || inlineTranslation) && (
                                        <div
                                            className={`mt-1.5 rounded-xl border px-2.5 py-2 text-xs leading-5 ${
                                                isOwn
                                                    ? 'border-white/15 bg-white/12 text-white'
                                                    : 'border-primary/10 bg-background/80 text-foreground'
                                            }`}
                                        >
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <span className={`text-[10px] font-semibold ${
                                                    isOwn ? 'text-white/70' : 'text-muted-foreground'
                                                }`}>
                                                    {inlineTranslation?.sourceLanguageName && inlineTranslation?.targetLanguageName
                                                        ? `${inlineTranslation.sourceLanguageName} vers ${inlineTranslation.targetLanguageName}`
                                                        : 'Traduction'}
                                                </span>
                                                {inlineTranslation && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            hideInlineTranslation(message.id);
                                                        }}
                                                        className={`rounded-full p-0.5 transition ${
                                                            isOwn ? 'text-white/55 hover:bg-white/15 hover:text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        }`}
                                                        aria-label="Masquer la traduction"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {isMessageTranslating ? (
                                                <span className={`inline-flex items-center gap-1.5 ${
                                                    isOwn ? 'text-white/75' : 'text-muted-foreground'
                                                }`}>
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Traduction...
                                                </span>
                                            ) : inlineTranslation?.error ? (
                                                <p className={isOwn ? 'text-red-100' : 'text-red-600'}>{inlineTranslation.error}</p>
                                            ) : (
                                                <p className="whitespace-pre-wrap break-words">{inlineTranslation?.translatedText}</p>
                                            )}
                                        </div>
                                    )}
                                    <p
                                        className={`text-[10px] mt-0 leading-3 ${
                                            isOwn
                                                ? 'text-white/70'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {message.timestamp?.toDate?.()?.toLocaleTimeString?.('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) || ''}
                                        {message.isEdited && <span className="ml-2">(modifié)</span>}
                                    </p>
                                    </Card>

                                    {/* Message Actions Menu */}
                                    {isOwn && !message.isDeleted && (
                                        <div className="absolute -left-8 top-1 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                                                onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                            
                                            {/* Dropdown Menu */}
                                            {showMessageMenu === message.id && (
                                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[150px]">
                                                    {message.messageType === 'text' && (
                                                        <button
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                            onClick={() => handleEditMessage(message)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                            Modifier
                                                        </button>
                                                    )}
                                                    <button
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                                                        onClick={() => handleDeleteMessage(message.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    </div>
                                    
                                    {/* Reply Button */}
                                    {!message.isDeleted && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs h-5 px-2 ${
                                                isOwn ? 'text-primary' : 'text-muted-foreground'
                                            } ${isOwn ? 'self-end' : 'self-start'}`}
                                            onClick={() => setReplyingTo(message)}
                                        >
                                            Répondre
                                        </Button>
                                    )}

                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </main>

            {translationAction && (
                <div
                    className="fixed z-[90] w-[210px] rounded-2xl border border-primary/15 bg-background/95 p-2 shadow-2xl shadow-black/15 backdrop-blur-xl"
                    style={{
                        left: translationAction.x,
                        top: translationAction.y,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                                <Languages className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-foreground">Message sélectionné</p>
                                <p className="truncate text-[11px] text-muted-foreground">Choisir une action</p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            onClick={() => setTranslationAction(null)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-xl text-xs"
                            onClick={() => void translateMessageInline(translationAction.message)}
                        >
                            <Languages className="mr-1.5 h-3.5 w-3.5" />
                            Traduire
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl text-xs"
                            onClick={() => {
                                setReplyingTo(translationAction.message);
                                setTranslationAction(null);
                            }}
                        >
                            Répondre
                        </Button>
                    </div>
                </div>
            )}

            {/* Fixed Input Footer */}
            <footer className="flex-shrink-0 border-t bg-background z-20 shadow-lg flex flex-col max-h-[30vh] overflow-y-auto mb-[calc(80px+env(safe-area-inset-bottom))]">
                <div className="px-4 pt-3 pb-2 space-y-3">
                
                {/* Edit Preview */}
                {editingMessage && (
                    <div className={`border-l-4 border-[#FFA500] rounded-lg p-3 bg-[#FFA500]/10 dark:bg-[#FFA500]/20 flex items-start justify-between`}>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#FFA500] dark:text-[#FFA500] mb-1">Modification du message</p>
                            <p className="text-sm truncate text-muted-foreground">
                                {editingMessage.text?.substring(0, 50)}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={cancelEdit}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                
                {/* Reply Preview */}
                {replyingTo && (
                    <div className={`border-l-4 border-primary rounded-lg p-3 bg-muted/50 flex items-start justify-between`}>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-primary mb-1">Réponse à {replyingTo.senderName}</p>
                            <p className="text-sm truncate text-muted-foreground">
                                {replyingTo.text?.substring(0, 50) || 'Message audio'}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={() => setReplyingTo(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                
                {/* Recording Preview */}
                {recordingBlob && recordingType && (
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {recordingType === 'audio' ? (
                                    <Mic className="h-5 w-5 text-primary" />
                                ) : (
                                    <Video className="h-5 w-5 text-primary" />
                                )}
                                <span className="font-medium">
                                    {recordingType === 'audio' ? 'Enregistrement audio' : 'Enregistrement vidéo'}
                                </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                            </span>
                        </div>
                        
                        {recordingType === 'audio' && (
                            <audio
                                controls
                                src={URL.createObjectURL(recordingBlob)}
                                className="w-full h-8"
                            />
                        )}

                        {recordingType === 'video' && (
                            <video
                                src={URL.createObjectURL(recordingBlob)}
                                className="w-full h-48 bg-black rounded-lg"
                                controls
                            />
                        )}

                        {isSending && sendingProgress > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span>Envoi en cours...</span>
                                    <span className="font-medium">{Math.round(sendingProgress)}%</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${Math.min(sendingProgress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={cancelRecording}
                                disabled={isSending}
                            >
                                <X className="h-4 w-4" />
                                Annuler
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 gap-2 bg-primary"
                                onClick={sendRecording}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                {isSending ? 'Envoi...' : 'Confirmer'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Action Menu */}
                {showMoreActions && !recordingBlob && (
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={handleShareLocation}
                            disabled={isSending || !chatSettings.locationSharing || (!isGroup && relationshipControl.blocked)}
                            title={chatSettings.locationSharing ? 'Partager ma localisation' : 'Activez le partage de localisation dans les paramètres du chat'}
                        >
                            <MapPin className="h-4 w-4" />
                            Localisation
                        </Button>
                        {/* Money Transfer Button - Only for individual conversations */}
                        {!isGroup && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={handleSendMoney}
                                disabled={isSending || relationshipControl.blocked}
                            >
                                <DollarSign className="h-4 w-4" />
                                Argent
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={handleSendFile}
                            disabled={isSending || (!isGroup && relationshipControl.blocked)}
                        >
                            <Paperclip className="h-4 w-4" />
                            Fichier
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setShowMoreActions(false)}
                        >
                            <X className="h-4 w-4" />
                            Fermer
                        </Button>
                    </div>
                )}

                {!isGroup && relationshipControl.blocked && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                        Contact bloqué. Débloquez-le dans les détails de la conversation pour reprendre l’échange.
                    </div>
                )}

                {/* Main Input Area */}
                {!recordingBlob && (
                    <div className="flex gap-2 items-end">
                        {/* Plus Button */}
                        <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setShowMoreActions(!showMoreActions)}
                            disabled={isSending || isRecording || (!isGroup && relationshipControl.blocked)}
                        >
                            {showMoreActions ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>

                        {/* Text Input (auto-wrap + auto-grow) */}
                        <textarea
                            ref={textAreaRef}
                            placeholder="Écrivez votre message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isSending || isRecording || (!isGroup && relationshipControl.blocked)}
                            spellCheck={true}
                            autoCorrect="on"
                            autoCapitalize="sentences"
                            rows={1}
                            className="flex-1 min-h-[44px] max-h-[140px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-5 shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        {/* Voice Message Button */}
                        <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={handleVoiceMessage}
                            disabled={isSending || isRecording || (!isGroup && relationshipControl.blocked)}
                            title={isRecording ? 'En cours d\'enregistrement...' : 'Enregistrer un message vocal'}
                        >
                            <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
                        </Button>

                        {/* Video Message Button */}
                        <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={handleVideoMessage}
                            disabled={isSending || isRecording || (!isGroup && relationshipControl.blocked)}
                            title={isRecording ? 'En cours d\'enregistrement...' : 'Enregistrer un message vidéo'}
                        >
                            <Video className={`h-4 w-4 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
                        </Button>

                        {/* Send Button */}
                        <Button
                            onClick={handleSendMessage}
                            disabled={isSending || !inputValue.trim() || isRecording || (!isGroup && relationshipControl.blocked)}
                            className="rounded-full"
                            size="icon"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                )}

                {/* Recording Indicator - Video */}
                {isRecording && recordingType === 'video' && !recordingBlob && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-base font-semibold text-red-700 flex-1">
                                Enregistrement vidéo en cours...
                            </span>
                            <span className="text-lg font-mono font-bold text-red-700 bg-red-100 px-3 py-1 rounded-md">
                                {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Video Preview - Live Stream */}
                        <video
                            ref={videoPreviewRef}
                            className="w-full h-56 bg-black rounded-lg transform -scale-x-100"
                            autoPlay={true}
                            playsInline={true}
                            muted={true}
                            style={{ display: 'block' }}
                        />

                        {/* Stop Button */}
                        <Button
                            size="sm"
                            className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold"
                            onClick={stopRecordingNow}
                        >
                            <Square className="h-4 w-4" fill="currentColor" />
                            Arrêter l'enregistrement
                        </Button>
                    </div>
                )}

                {/* Recording Indicator - Audio */}
                {isRecording && recordingType === 'audio' && !recordingBlob && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-base font-semibold text-red-700 flex-1">
                                Enregistrement audio en cours...
                            </span>
                            <span className="text-lg font-mono font-bold text-red-700 bg-red-100 px-3 py-1 rounded-md">
                                {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Audio Visualizer */}
                        <div className="flex items-center justify-center gap-1 h-12">
                            {[...Array(16)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1.5 bg-red-500 rounded-full"
                                    style={{
                                        height: `${Math.random() * 100 + 30}%`,
                                        animation: `pulse 0.6s ease-in-out infinite`,
                                        animationDelay: `${i * 0.08}s`
                                    }}
                                />
                            ))}
                        </div>

                        {/* Stop Button */}
                        <Button
                            size="sm"
                            className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold"
                            onClick={stopRecordingNow}
                        >
                            <Square className="h-4 w-4" fill="currentColor" />
                            Arrêter l'enregistrement
                        </Button>
                    </div>
                )}
                </div>
            </footer>

            <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
                <DialogContent className="max-w-[330px] rounded-2xl p-0">
                    <div className="rounded-t-2xl bg-primary px-3 py-2.5 text-white">
                        <DialogHeader>
                            <DialogTitle className="sr-only">Détails de la conversation</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white/30">
                                {contact?.avatar ? (
                                    <AvatarImage src={contact.avatar} alt={contact?.name || 'Contact'} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-white/20 text-sm font-bold text-white">
                                    {(contact?.name || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-black leading-tight">{contact?.name || 'Contact'}</p>
                                <p className="text-[11px] text-white/75">{contactStatusText}</p>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[58vh] space-y-2 overflow-y-auto p-2.5">
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={toggleConversationNotifications}
                                className="rounded-xl border bg-muted/30 p-1.5 text-center transition-colors hover:bg-muted"
                            >
                                {isConversationMuted ? <BellOff className="mx-auto h-3.5 w-3.5 text-primary" /> : <Bell className="mx-auto h-3.5 w-3.5 text-primary" />}
                                <span className="text-[10px] font-semibold">{isConversationMuted ? 'Réactiver' : 'Notifs'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => contact?.id && router.push(`/dashboard/makutano/profile/${contact.id}`)}
                                className="rounded-xl border bg-muted/30 p-1.5 text-center transition-colors hover:bg-muted"
                            >
                                <Users className="mx-auto h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-semibold">Profil</span>
                            </button>
                            <button
                                type="button"
                                onClick={hideConversationForMe}
                                className="rounded-xl border bg-muted/30 p-1.5 text-center transition-colors hover:bg-muted"
                            >
                                <UserMinus className="mx-auto h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-semibold">Retirer</span>
                            </button>
                        </div>

                        <div className="rounded-xl border p-2.5">
                            <p className="mb-1.5 text-[11px] font-bold uppercase text-muted-foreground">Informations</p>
                            <div className="space-y-1 text-[11px]">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{contact?.phoneNumber || 'Numéro non renseigné'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="break-all">{contact?.email || 'Email non renseigné'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border p-2.5">
                            <div className="mb-1.5 flex items-center justify-between">
                                <p className="text-[11px] font-bold uppercase text-muted-foreground">Médias</p>
                                <span className="text-[11px] font-semibold text-muted-foreground">{mediaMessages.length}</span>
                            </div>
                            {mediaMessages.length ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {mediaMessages.slice(0, 4).map((message) => {
                                        const mediaUrl = message.metadata?.thumbnailUrl || message.metadata?.mediaUrl;
                                        return (
                                            <div key={message.id} className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted">
                                                {mediaUrl && (message.metadata?.fileType?.startsWith?.('image/') || message.messageType === 'file') ? (
                                                    <img src={mediaUrl} alt="Media" className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">Aucun média partagé.</p>
                            )}
                        </div>

                        <details className="rounded-xl border p-2.5">
                            <summary className="cursor-pointer list-none">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase text-muted-foreground">Fond</p>
                                        <p className="text-[11px] text-muted-foreground">
                                        {conversationWallpaper ? 'Personnalisé pour cette discussion' : 'Utilise le fond global du chat'}
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-bold text-primary">Modifier</span>
                                </div>
                            </summary>
                            <input
                                ref={conversationWallpaperInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => void handleImportConversationWallpaper(event.target.files?.[0] || null)}
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-full text-[11px]"
                                    disabled={isUploadingConversationWallpaper}
                                    onClick={() => conversationWallpaperInputRef.current?.click()}
                                >
                                    {isUploadingConversationWallpaper ? 'Importation...' : 'Importer une photo'}
                                </Button>
                                {conversationWallpaper && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 rounded-full text-[11px]"
                                        onClick={() => updateConversationWallpaper(null)}
                                    >
                                        Réinitialiser
                                    </Button>
                                )}
                                {customConversationWallpaper && (
                                    <span className="text-[11px] font-semibold text-primary">Photo choisie</span>
                                )}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {customConversationWallpaper && (
                                    <button
                                        type="button"
                                        onClick={() => updateConversationWallpaper(customConversationWallpaper.id)}
                                        className="overflow-hidden rounded-2xl border border-primary text-left ring-2 ring-primary/25 transition-all"
                                    >
                                        <span
                                            className={`block h-12 ${customConversationWallpaper.previewClass}`}
                                            style={customConversationWallpaper.previewStyle}
                                        />
                                        <span className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold">
                                            {customConversationWallpaper.label}
                                            <span className="text-primary">Choisi</span>
                                        </span>
                                    </button>
                                )}
                                {CHAT_WALLPAPERS.map((wallpaper) => {
                                    const isSelected = activeWallpaper.id === wallpaper.id;
                                    const isConversationChoice = conversationWallpaper === wallpaper.id;

                                    return (
                                        <button
                                            key={wallpaper.id}
                                            type="button"
                                            onClick={() => updateConversationWallpaper(wallpaper.id)}
                                            className={`overflow-hidden rounded-2xl border text-left transition-all ${
                                                isSelected ? 'border-primary ring-2 ring-primary/25' : 'border-border hover:border-primary/50'
                                            }`}
                                        >
                                            <span className={`block h-12 ${wallpaper.previewClass}`} style={wallpaper.previewStyle} />
                                            <span className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold">
                                                {wallpaper.label}
                                                {isConversationChoice ? <span className="text-primary">Choisi</span> : null}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </details>

                        <div className="rounded-xl border p-2.5">
                            <p className="mb-1.5 text-[11px] font-bold uppercase text-muted-foreground">Contrôle</p>
                            <div className="space-y-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8 w-full justify-start rounded-xl text-xs"
                                    disabled={!contact?.id || relationshipControl.blocked || relationshipControl.isLoading}
                                    onClick={() => updateContactRelationship({ restricted: !relationshipControl.restricted })}
                                >
                                    <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                                    {relationshipControl.restricted ? 'Retirer la restriction' : 'Restreindre'}
                                </Button>
                                <Button
                                    type="button"
                                    variant={relationshipControl.blocked ? 'outline' : 'destructive'}
                                    className="h-8 w-full justify-start rounded-xl text-xs"
                                    disabled={!contact?.id || relationshipControl.isLoading}
                                    onClick={() => updateContactRelationship({ blocked: !relationshipControl.blocked })}
                                >
                                    <Ban className="mr-2 h-3.5 w-3.5" />
                                    {relationshipControl.blocked ? 'Débloquer' : 'Bloquer'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8 w-full justify-start rounded-xl text-xs"
                                    onClick={reportConversation}
                                >
                                    <Flag className="mr-2 h-3.5 w-3.5" />
                                    Signaler
                                </Button>
                            </div>
                            {relationshipControl.blocked && (
                                <p className="mt-2 text-xs text-red-600">Ce contact est bloqué. Vous pouvez le débloquer depuis ce panneau.</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Group Settings Dialog */}
            {isGroup && groupData && (
                <GroupSettingsDialog
                    isOpen={showGroupSettings}
                    onClose={() => setShowGroupSettings(false)}
                    conversationId={conversationId}
                    groupData={groupData}
                    onUpdate={() => {
                        // Recharger les données du groupe
                        const loadConversationData = async () => {
                            try {
                                const convRef = doc(db, 'conversations', conversationId);
                                const convSnap = await getDoc(convRef);
                                if (convSnap.exists()) {
                                    const convData = convSnap.data();
                                    setGroupData({
                                        name: convData.name || 'Groupe',
                                        participants: convData.participants || [],
                                        participantNames: convData.participantNames || [],
                                        admins: convData.admins || [convData.createdBy],
                                        createdBy: convData.createdBy,
                                        createdAt: convData.createdAt,
                                    });
                                    setContact({
                                        name: convData.name || 'Groupe',
                                        isGroup: true,
                                    });
                                }
                            } catch (error) {
                                console.error('Erreur rechargement groupe:', error);
                            }
                        };
                        loadConversationData();
                    }}
                />
            )}
        </div>
    );
}
