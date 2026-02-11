'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';
import { useAuth } from '@/hooks/useAuth';
import { ChatNavIcon } from '@/components/icons/service-icons';
import { LocationMessage } from '@/components/chat/LocationMessage';
import { FileMessage } from '@/components/chat/FileMessage';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { ChevronLeft, Send, Loader2, Mail, Phone, Mic, Video, MapPin, DollarSign, Paperclip, Plus, X, Check, Square, Settings, Users, Trash2, Edit2, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { GroupSettingsDialog } from '@/components/group-settings-dialog';

export default function ConversationClient() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    const { loadMessages, sendMessage, deleteMessage, updateMessage } = useFirestoreConversations();
    const { user: currentUser } = useAuth();
    const { getCurrentLocation } = useLocationSharing();
    
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [contact, setContact] = useState<any>(null);
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Charger les infos de la conversation et du contact
    useEffect(() => {
        const loadConversationData = async () => {
            if (!conversationId || !currentUser) return;

            try {
                const convRef = doc(db, 'conversations', conversationId);
                const convSnap = await getDoc(convRef);

                if (convSnap.exists()) {
                    const convData = convSnap.data();
                    
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
                            const contactData = {
                                id: participants[otherParticipantIdx],
                                name: participantNames[otherParticipantIdx],
                                phoneNumber: convData.phoneNumber || '',
                                email: convData.email || '',
                                isGroup: false,
                            };
                            setContact(contactData);
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur chargement conversation:', error);
            }
        };

        loadConversationData();
    }, [conversationId, currentUser]);

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

    // Envoyer un message
    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

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
                const metadata = replyingTo ? {
                    replyTo: replyingTo.id,
                    repliedMessage: {
                        id: replyingTo.id,
                        text: replyingTo.text,
                        senderName: replyingTo.senderName,
                        senderId: replyingTo.senderId,
                        messageType: replyingTo.messageType
                    }
                } : undefined;
                
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
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result?.toString().split(',')[1];
                const messageText = recordingType === 'audio' ? '🎤 Message vocal' : '🎥 Message vidéo';
                
                // Simuler une progression d'envoi
                const progressInterval = setInterval(() => {
                    setSendingProgress((prev) => {
                        if (prev >= 90) return prev;
                        return prev + Math.random() * 30;
                    });
                }, 200);

                try {
                    const messageType = recordingType === 'audio' ? 'voice' : 'video';
                    await sendMessage(conversationId, messageText, messageType, { 
                        [recordingType]: base64,
                        duration: recordingDuration
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
            };
            reader.readAsDataURL(recordingBlob);
        } catch (error) {
            console.error('Erreur envoi enregistrement:', error);
            setIsSending(false);
            setSendingProgress(0);
        }
    };
    const handleShareLocation = async () => {
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

    // Envoyer de l'argent
    const handleSendMoney = async () => {
        const amount = prompt('Montant à envoyer (en FC):');
        if (amount) {
            setIsSending(true);
            try {
                await sendMessage(conversationId, `💰 Transfert de ${amount} FC`, 'money', { amount });
            } finally {
                setIsSending(false);
            }
        }
    };

    // Envoyer un fichier
    const handleSendFile = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setIsSending(true);
                try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        const base64 = reader.result?.toString().split(',')[1];
                        await sendMessage(conversationId, `📎 ${file.name}`, 'file', { 
                            fileName: file.name, 
                            fileType: file.type, 
                            fileData: base64,
                            fileSize: file.size
                        });
                    };
                    reader.readAsDataURL(file);
                } finally {
                    setIsSending(false);
                }
            }
        };
        input.click();
    };

    return (
        <div className="flex h-screen flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-auto flex-col bg-gradient-to-r from-primary via-primary to-green-800 px-4 py-3 shadow-lg flex-shrink-0">
                <div className="flex items-center gap-4 mb-3">
                    <Link href="/dashboard/miyiki-chat">
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10 border-2 border-white/20">
                            <AvatarFallback className="bg-white/20 text-white">
                                {isGroup ? (
                                    <Users className="h-5 w-5" />
                                ) : (
                                    contact?.name?.charAt(0)?.toUpperCase() || 'U'
                                )}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="font-headline text-lg font-bold text-white">
                                {contact?.name || 'Conversation'}
                            </h1>
                            <p className="text-xs text-white/70">
                                {isGroup ? `${groupData?.participants?.length || 0} membres` : 'En ligne'}
                            </p>
                        </div>
                    </div>

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
                            <Link href={`/dashboard/miyiki-chat/call/${conversationId}`}>
                                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" title="Appel audio">
                                    <Phone className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href={`/dashboard/miyiki-chat/videocall/${conversationId}`}>
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

            {/* Messages Container */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4 flex-shrink min-h-0">
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
                        // Détecter les messages audio de deux façons: par messageType ou par le texte 🎤
                        const isAudioMessage = (message.messageType === 'voice' || message.text?.includes('🎤')) && message.metadata?.audio;
                        const isVideoMessage = (message.messageType === 'video' || message.text?.includes('🎥')) && message.metadata?.video;
                        const audioData = message.metadata?.audio ? `data:audio/wav;base64,${message.metadata.audio}` : null;
                        const videoData = message.metadata?.video ? `data:video/webm;base64,${message.metadata.video}` : null;
                        const isPlaying = playingMessageId === message.id;

                        return (
                            <div
                                key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}
                            >
                                <div className="flex flex-col gap-1 w-full max-w-md relative">
                                    {/* Nom de l'expéditeur pour les groupes (sauf pour ses propres messages) */}
                                    {isGroup && !isOwn && message.senderName && (
                                        <p className="text-xs font-semibold text-primary px-3">
                                            {message.senderName}
                                        </p>
                                    )}
                                    
                                    {/* Reply Preview - Show the original message being replied to */}
                                    {message.metadata?.replyTo && (() => {
                                        // Utiliser le message attaché dans metadata au lieu de chercher dans le tableau
                                        const repliedMessage = message.metadata.repliedMessage || messages.find(m => m.id === message.metadata.replyTo);
                                        return (
                                            <div className={`text-xs px-3 py-2 rounded-lg border-l-4 ${
                                                isOwn 
                                                    ? 'border-white/40 bg-white/10 text-white/80' 
                                                    : 'border-primary/40 bg-primary/10 text-primary/80'
                                            }`}>
                                                <p className="font-semibold mb-1">
                                                    {repliedMessage?.senderName || 'Utilisateur'}
                                                </p>
                                                <p className="truncate opacity-80">
                                                    {repliedMessage?.text?.substring(0, 60) || 'Message audio/vidéo'}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                    
                                    <div className="relative flex items-start gap-2">
                                        <Card
                                            className={`px-4 py-2 rounded-2xl cursor-pointer hover:shadow-md transition-shadow flex-1 ${
                                                isOwn
                                                    ? 'bg-primary text-white rounded-br-none'
                                                    : 'bg-muted text-foreground rounded-bl-none'
                                            } ${message.isDeleted ? 'opacity-60 italic' : ''}`}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                if (!message.isDeleted) {
                                                    setReplyingTo(message);
                                                }
                                            }}
                                        >
                                        {isAudioMessage && audioData ? (
                                            <div className="space-y-3 w-full">
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={`h-10 w-10 p-0 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                                                    <span className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-700'}`}>
                                                        {message.metadata?.duration ? `${Math.floor(message.metadata.duration / 60)}:${String(message.metadata.duration % 60).padStart(2, '0')}` : 'Vocal'}
                                                    </span>
                                                </div>
                                                
                                                {/* Audio Spectrum Visualizer */}
                                                {isPlaying && frequencyData && (
                                                    <div className="flex items-center justify-center gap-0.5 h-12 bg-black/10 rounded-lg p-2">
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
                                                
                                                {audioData && (
                                                    <audio
                                                        id={`audio-${message.id}`}
                                                        src={audioData}
                                                        onPlay={() => setPlayingMessageId(message.id)}
                                                        onPause={() => setPlayingMessageId(null)}
                                                        onEnded={() => setPlayingMessageId(null)}
                                                        className="w-full h-8"
                                                        controls
                                                    />
                                                )}
                                            </div>
                                        ) : isVideoMessage && videoData ? (
                                            <div className="space-y-2">
                                                <video
                                                    src={videoData}
                                                    className="w-full h-48 bg-black rounded-lg"
                                                    controls
                                                />
                                                <p className="text-xs text-center opacity-70">
                                                    {message.metadata?.duration ? `${Math.floor(message.metadata.duration / 60)}:${String(message.metadata.duration % 60).padStart(2, '0')}` : 'Vidéo'}
                                                </p>
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
                                            receiverLatitude={currentUser?.latitude}
                                            receiverLongitude={currentUser?.longitude}
                                            timestamp={message.timestamp?.toDate?.()}
                                        />
                                    ) : message.messageType === 'file' && message.metadata?.fileName ? (
                                        <FileMessage
                                            fileName={message.metadata.fileName}
                                            fileType={message.metadata.fileType}
                                            fileData={message.metadata.fileData}
                                            fileSize={message.metadata.fileSize}
                                            senderName={message.senderName}
                                            timestamp={message.timestamp?.toDate?.()}
                                        />
                                    ) : (
                                        <p className="text-sm">{message.text}</p>
                                    )}
                                    <p
                                        className={`text-xs mt-1 ${
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
                                        <div className="relative flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className={`opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 ${
                                                    isOwn ? 'text-white hover:bg-white/20' : 'text-muted-foreground hover:bg-muted'
                                                }`}
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
                                            className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 ${
                                                isOwn ? 'text-primary' : 'text-muted-foreground'
                                            }`}
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

            {/* Fixed Input Footer */}
            <footer className="flex-shrink-0 border-t bg-background space-y-3 z-20 shadow-lg flex flex-col max-h-[30vh] overflow-y-auto">
                <div className="p-4 space-y-3">
                
                {/* Edit Preview */}
                {editingMessage && (
                    <div className={`border-l-4 border-orange-500 rounded-lg p-3 bg-orange-50 dark:bg-orange-900/20 flex items-start justify-between`}>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Modification du message</p>
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
                            disabled={isSending}
                        >
                            <MapPin className="h-4 w-4" />
                            Localisation
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={handleSendMoney}
                            disabled={isSending}
                        >
                            <DollarSign className="h-4 w-4" />
                            Argent
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={handleSendFile}
                            disabled={isSending}
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

                {/* Main Input Area */}
                {!recordingBlob && (
                    <div className="flex gap-2 items-end">
                        {/* Plus Button */}
                        <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setShowMoreActions(!showMoreActions)}
                            disabled={isSending || isRecording}
                        >
                            {showMoreActions ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>

                        {/* Text Input */}
                        <Input
                            placeholder="Écrivez votre message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isSending || isRecording}
                            className="rounded-full"
                        />

                        {/* Voice Message Button */}
                        <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={handleVoiceMessage}
                            disabled={isSending || isRecording}
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
                            disabled={isSending || isRecording}
                            title={isRecording ? 'En cours d\'enregistrement...' : 'Enregistrer un message vidéo'}
                        >
                            <Video className={`h-4 w-4 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
                        </Button>

                        {/* Send Button */}
                        <Button
                            onClick={handleSendMessage}
                            disabled={isSending || !inputValue.trim() || isRecording}
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
