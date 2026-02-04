'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useFirestoreConversations } from '@/hooks/useFirestoreConversations';
import { useFirestoreContacts } from '@/hooks/useFirestoreContacts';
import { useAuth } from '@/hooks/useAuth';
import { ChatNavIcon } from '@/components/icons/service-icons';
import { ChevronLeft, Send, Loader2, Mail, Phone, Mic, Video, MapPin, DollarSign, Paperclip, Plus, X, Check, Square } from 'lucide-react';
import Link from 'next/link';

export default function ConversationClient() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    const { loadMessages, sendMessage } = useFirestoreConversations();
    const { contacts } = useFirestoreContacts();
    const { user: currentUser } = useAuth();
    
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    // Trouver le contact basé sur conversationId
    useEffect(() => {
        if (conversationId && contacts.length > 0) {
            const foundContact = contacts.find(c => c.id === conversationId);
            setContact(foundContact);
        }
    }, [conversationId, contacts]);

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
            await sendMessage(conversationId, messageText, 'text');
        } catch (error) {
            console.error('Erreur envoi message:', error);
            setInputValue(messageText); // Restaurer le message en cas d'erreur
        } finally {
            setIsSending(false);
        }
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
                    await sendMessage(conversationId, messageText, recordingType, { 
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
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            setIsSending(true);
            try {
                await sendMessage(conversationId, `📍 Localisation partagée`, 'location', { latitude, longitude });
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
                        await sendMessage(conversationId, `📎 ${file.name}`, 'file', { fileName: file.name, fileType: file.type, fileData: base64 });
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
                                {contact?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="font-headline text-lg font-bold text-white">
                                {contact?.name || 'Conversation'}
                            </h1>
                            <p className="text-xs text-white/70">En ligne</p>
                        </div>
                    </div>

                    {/* Call Buttons */}
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
                </div>
                
                {/* Contact Details */}
                {contact && (
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
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <Card
                                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                                        isOwn
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-muted text-foreground rounded-bl-none'
                                    }`}
                                >
                                    {isAudioMessage && audioData ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`h-8 w-8 p-0 rounded-full flex items-center justify-center ${
                                                        isOwn ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200'
                                                    }`}
                                                    onClick={() => setPlayingMessageId(isPlaying ? null : message.id)}
                                                >
                                                    {isPlaying ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    )}
                                                </Button>
                                                <span className={`text-xs font-medium ${isOwn ? 'text-white' : ''}`}>
                                                    {message.metadata?.duration ? `${Math.floor(message.metadata.duration / 60)}:${String(message.metadata.duration % 60).padStart(2, '0')}` : 'Vocal'}
                                                </span>
                                            </div>
                                            {audioData && (
                                                <audio
                                                    src={audioData}
                                                    autoPlay={isPlaying}
                                                    onEnded={() => setPlayingMessageId(null)}
                                                    className="w-full h-6"
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
                                    </p>
                                </Card>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Fixed Input Footer */}
            <footer className="flex-shrink-0 border-t bg-background space-y-3 z-20 shadow-lg flex flex-col max-h-[30vh] overflow-y-auto">
                <div className="p-4 space-y-3">
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-red-700 flex-1">
                                Enregistrement vidéo en cours...
                            </span>
                            <span className="text-sm font-mono text-red-700">
                                {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Video Preview - Live Stream */}
                        <video
                            ref={videoPreviewRef}
                            className="w-full h-48 bg-black rounded-lg transform -scale-x-100"
                            autoPlay={true}
                            playsInline={true}
                            muted={true}
                            style={{ display: 'block' }}
                        />

                        {/* Stop Button */}
                        <Button
                            size="sm"
                            className="w-full gap-2 bg-red-500 hover:bg-red-600"
                            onClick={stopRecordingNow}
                        >
                            <Square className="h-4 w-4" fill="currentColor" />
                            Arrêter l'enregistrement
                        </Button>
                    </div>
                )}

                {/* Recording Indicator - Audio */}
                {isRecording && recordingType === 'audio' && !recordingBlob && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-red-700 flex-1">
                                Enregistrement audio en cours...
                            </span>
                            <span className="text-sm font-mono text-red-700">
                                {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Audio Visualizer */}
                        <div className="flex items-center justify-center gap-1 h-8">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full animate-pulse"
                                    style={{
                                        height: `${Math.random() * 100 + 20}%`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                />
                            ))}
                        </div>

                        {/* Stop Button */}
                        <Button
                            size="sm"
                            className="w-full gap-2 bg-red-500 hover:bg-red-600"
                            onClick={stopRecordingNow}
                        >
                            <Square className="h-4 w-4" fill="currentColor" />
                            Arrêter l'enregistrement
                        </Button>
                    </div>
                )}
                </div>
            </footer>
        </div>
    );
}
