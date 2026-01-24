'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, PhoneOff, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle } from '@/components/ui/alert';

const conversationsData: { [key: string]: any } = {
    "1": {
        name: "Service Client Mbongo",
        avatar: "https://picsum.photos/seed/makuta/100/100",
    },
    "2": {
        name: "Groupe Tontine 'Les Amis'",
        avatar: "https://picsum.photos/seed/tontine/100/100",
    }
};

export default function AudioCallClient() {
    const router = useRouter();
    const params = useParams();
    const chatId = params.id as string;
    const contact = conversationsData[chatId] || { name: "Inconnu", avatar: '' };

    const { toast } = useToast();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const [callDuration, setCallDuration] = useState(0);

    useEffect(() => {
        const getMediaPermissions = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                streamRef.current = stream;
                setHasPermission(true);
            } catch (error) {
                console.error('Error accessing media devices:', error);
                setHasPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Accès Média Refusé',
                    description: 'Veuillez autoriser l\'accès au microphone.',
                });
            }
        };

        getMediaPermissions();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    }, [toast]);

    useEffect(() => {
        if (hasPermission) {
            const timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [hasPermission]);

    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isMicMuted;
            });
        }
    }, [isMicMuted]);

    const handleEndCall = () => {
        router.back();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

            <div className="z-10 flex flex-col items-center justify-center text-center">
                <Avatar className="h-40 w-40 border-4 border-white/50 animate-pulse">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="mt-6 font-headline text-3xl font-bold">{contact.name}</p>
                {hasPermission ? (
                    <p className="text-white/70 text-lg font-mono mt-2">{formatDuration(callDuration)}</p>
                ) : (
                    <p className="text-amber-400/80 text-lg mt-2">Connexion...</p>
                )}

                {hasPermission === false && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-sm">
                        <Alert variant="destructive">
                            <Phone className="h-4 w-4" />
                            <AlertTitle>Microphone requis</AlertTitle>
                        </Alert>
                    </div>
                )}
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/50 p-4 backdrop-blur-md">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30"
                    onClick={() => setIsMicMuted(prev => !prev)}
                    disabled={!hasPermission}
                >
                    {isMicMuted ? <MicOff /> : <Mic />}
                </Button>
                <Button
                    size="icon"
                    className="h-20 w-20 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-110"
                    onClick={handleEndCall}
                >
                    <PhoneOff className="h-8 w-8" />
                </Button>
            </div>
        </div>
    );
}
