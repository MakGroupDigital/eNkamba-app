'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  FileAudio,
  Image as ImageIcon,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Save,
  Send,
  Square,
  Trash2,
  Upload,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import {
  EStreamPostIcon,
  MakutanoAudioIcon,
  MakutanoCreateIcon,
  MakutanoPauseIcon,
  MakutanoPlayIcon,
  MapPinIcon,
} from '@/components/icons/service-icons';

type MakutanoCategory = 'Accueil' | 'Savoir' | 'Entrepreneur' | 'Projets' | 'Local';
type MediaType = 'image' | 'video' | 'audio';
type CreateStep = 'media' | 'details' | 'publish';
type CameraMode = 'photo' | 'video' | null;

const categories: MakutanoCategory[] = ['Savoir', 'Entrepreneur', 'Projets', 'Local', 'Accueil'];
const DRAFT_KEY = 'makutano_create_draft_v1';
const stepItems: Array<{ id: CreateStep; label: string }> = [
  { id: 'media', label: 'Média' },
  { id: 'details', label: 'Texte' },
  { id: 'publish', label: 'Lieu' },
];

function detectMediaTypeFromName(name: string): MediaType {
  const n = name.toLowerCase();
  if (n.match(/\.(mp3|wav|ogg|m4a)$/)) return 'audio';
  if (n.match(/\.(mp4|webm|mov|m3u8)$/)) return 'video';
  return 'image';
}

export default function MakutanoCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { location, hasStoredLocation, isLocating, error: locationError, detectLocation } = useDashboardLocation();

  const [activeStep, setActiveStep] = useState<CreateStep>('media');
  const [text, setText] = useState('');
  const [category, setCategory] = useState<MakutanoCategory | ''>('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [externalMediaUrl, setExternalMediaUrl] = useState('');
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [fileInputAccept, setFileInputAccept] = useState('image/*,video/*,audio/*');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [audioLevelData, setAudioLevelData] = useState<number[]>(Array(28).fill(12));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const previewMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastAutoSavedSignatureRef = useRef('');

  const hasAnyMedia = useMemo(() => Boolean(pickedFile || externalMediaUrl.trim()), [pickedFile, externalMediaUrl]);
  const activeStepIndex = stepItems.findIndex((item) => item.id === activeStep);
  const canGoToDetails = hasAnyMedia;
  const canGoToPublish = hasAnyMedia && Boolean(text.trim()) && Boolean(category);
  const mediaLabel = mediaType === 'image' ? 'Photo' : mediaType === 'video' ? 'Vidéo' : 'Audio';
  const locationDetail = [location.quartier, location.ville, location.pays].filter(Boolean).join(' · ');

  const buildDraft = useCallback(() => ({
    text,
    category,
    mediaType,
    externalMediaUrl,
    updatedAt: Date.now(),
  }), [text, category, mediaType, externalMediaUrl]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    setHasDraft(Boolean(raw));
  }, []);

  const saveDraft = () => {
    const draft = buildDraft();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
    toast({ title: 'Brouillon sauvegardé', description: 'Tu peux reprendre plus tard.' });
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      toast({ variant: 'destructive', title: 'Aucun brouillon', description: 'Il n’y a pas de brouillon sauvegardé.' });
      return;
    }
    try {
      const draft = JSON.parse(raw) as {
        text?: string;
        category?: MakutanoCategory;
        mediaType?: MediaType;
        externalMediaUrl?: string;
      };
      setText(draft.text || '');
      setCategory((draft.category as MakutanoCategory) || '');
      setMediaType((draft.mediaType as MediaType) || 'image');
      setExternalMediaUrl(draft.externalMediaUrl || '');
      setPickedFile(null);
      setPreviewUrl(draft.externalMediaUrl || '');
      setActiveStep(draft.externalMediaUrl ? 'details' : 'media');
      toast({ title: 'Brouillon restauré', description: 'Contenu rechargé.' });
    } catch {
      toast({ variant: 'destructive', title: 'Brouillon invalide', description: 'Impossible de charger ce brouillon.' });
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setLastAutoSavedAt(null);
    lastAutoSavedSignatureRef.current = '';
    toast({ title: 'Brouillon supprimé', description: 'Le brouillon local a été effacé.' });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isPublishing) return;

      const hasContent =
        text.trim().length > 0 ||
        externalMediaUrl.trim().length > 0 ||
        Boolean(category);

      if (!hasContent) return;

      const draft = buildDraft();
      const signature = JSON.stringify({
        text: draft.text,
        category: draft.category,
        mediaType: draft.mediaType,
        externalMediaUrl: draft.externalMediaUrl,
      });

      if (signature === lastAutoSavedSignatureRef.current) return;

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      lastAutoSavedSignatureRef.current = signature;
      setHasDraft(true);
      setLastAutoSavedAt(Date.now());
    }, 5000);

    return () => clearInterval(intervalId);
  }, [text, category, mediaType, externalMediaUrl, isPublishing, buildDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const safeCloseAudioContext = async () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state !== 'closed') {
        try {
          await ctx.close();
        } catch (error) {
          console.error('Erreur fermeture AudioContext:', error);
        }
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
    };

    return () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
      if (audioStream) audioStream.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      void safeCloseAudioContext();
    };
  }, [cameraStream, audioStream]);

  useEffect(() => {
    const media = previewMediaRef.current;
    if (!media) return;

    const onTimeUpdate = () => setPreviewCurrentTime(media.currentTime || 0);
    const onLoadedMetadata = () => setPreviewDuration(media.duration || 0);
    const onEnded = () => setIsPreviewPlaying(false);

    media.addEventListener('timeupdate', onTimeUpdate);
    media.addEventListener('loadedmetadata', onLoadedMetadata);
    media.addEventListener('ended', onEnded);

    return () => {
      media.removeEventListener('timeupdate', onTimeUpdate);
      media.removeEventListener('loadedmetadata', onLoadedMetadata);
      media.removeEventListener('ended', onEnded);
    };
  }, [previewUrl, mediaType]);

  useEffect(() => {
    const cameraVideo = cameraVideoRef.current;
    if (!cameraVideo || !cameraStream) return;

    cameraVideo.srcObject = cameraStream;
    cameraVideo.play().catch(() => undefined);

    return () => {
      if (cameraVideo.srcObject === cameraStream) {
        cameraVideo.srcObject = null;
      }
    };
  }, [cameraStream]);

  const togglePreviewPlay = async () => {
    const media = previewMediaRef.current;
    if (!media) return;

    if (media.paused) {
      try {
        await media.play();
        setIsPreviewPlaying(true);
      } catch (error) {
        setIsPreviewPlaying(false);
      }
    } else {
      media.pause();
      setIsPreviewPlaying(false);
    }
  };

  const togglePreviewMute = () => {
    const media = previewMediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
    setIsPreviewMuted(media.muted);
  };

  const handlePreviewSeek = (value: number) => {
    const media = previewMediaRef.current;
    if (!media) return;
    media.currentTime = value;
    setPreviewCurrentTime(value);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openFilePicker = (accept = 'image/*,video/*,audio/*', nextMediaType?: MediaType) => {
    setFileInputAccept(accept);
    if (nextMediaType) setMediaType(nextMediaType);
    fileInputRef.current?.setAttribute('accept', accept);
    fileInputRef.current?.click();
  };

  const onFilePicked = (event: { target: { files: FileList | null } }) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPickedFile(file);
    setExternalMediaUrl('');
    setMediaType(detectMediaTypeFromName(file.name));
    setPreviewUrl(URL.createObjectURL(file));
    setActiveStep('details');
  };

  const startPhotoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      setCameraStream(stream);
      setCameraMode('photo');
      setMediaType('image');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Caméra indisponible', description: 'Impossible de démarrer la caméra.' });
    }
  };

  const startVideoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setCameraStream(stream);
      setCameraMode('video');
      setMediaType('video');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Caméra indisponible', description: 'Impossible de démarrer la caméra.' });
    }
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setCameraMode(null);
    setIsVideoRecording(false);
  };

  const capturePhoto = () => {
    const videoNode = cameraVideoRef.current;
    if (!videoNode) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoNode.videoWidth || 1080;
    canvas.height = videoNode.videoHeight || 1080;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(videoNode, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `makutano-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setPickedFile(file);
      setExternalMediaUrl('');
      setMediaType('image');
      setPreviewUrl(URL.createObjectURL(blob));
      closeCamera();
      setActiveStep('details');
    }, 'image/jpeg', 0.92);
  };

  const startVideoRecording = () => {
    if (!cameraStream) return;
    const recorder = new MediaRecorder(cameraStream);
    videoChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `makutano-video-${Date.now()}.webm`, { type: 'video/webm' });
      setPickedFile(file);
      setExternalMediaUrl('');
      setPreviewUrl(URL.createObjectURL(blob));
      setIsVideoRecording(false);
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      setCameraMode(null);
      setActiveStep('details');
    };
    recorder.start();
    videoRecorderRef.current = recorder;
    setIsVideoRecording(true);
  };

  const stopVideoRecording = () => {
    videoRecorderRef.current?.stop();
  };

  const ensureAudioCapture = async (): Promise<{ stream: MediaStream; analyser: AnalyserNode } | null> => {
    if (audioStream && analyserRef.current) {
      return { stream: audioStream, analyser: analyserRef.current };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setMediaType('audio');

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      return { stream, analyser };
    } catch (error) {
      toast({ variant: 'destructive', title: 'Micro indisponible', description: 'Impossible d’activer le micro.' });
      return null;
    }
  };

  const startAudioCapture = async () => {
    await ensureAudioCapture();
  };

  const startAudioRecording = async () => {
    if (typeof MediaRecorder === 'undefined') {
      toast({ variant: 'destructive', title: 'Non supporté', description: 'MediaRecorder n’est pas supporté sur cet appareil.' });
      return;
    }

    const ready = await ensureAudioCapture();
    if (!ready) return;

    const { stream, analyser } = ready;
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], `makutano-audio-${Date.now()}.webm`, { type: 'audio/webm' });
      setPickedFile(file);
      setExternalMediaUrl('');
      setPreviewUrl(URL.createObjectURL(blob));
      setIsAudioRecording(false);
      stream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
      setActiveStep('details');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => undefined);
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = Array.from({ length: 28 }).map((_, i) => {
        const idx = Math.floor((i / 28) * dataArray.length);
        return Math.max(6, Math.round(dataArray[idx] / 4));
      });
      setAudioLevelData(bars);
      rafRef.current = requestAnimationFrame(animate);
    };

    recorder.start();
    audioRecorderRef.current = recorder;
    setIsAudioRecording(true);
    animate();
  };

  const stopAudioRecording = () => {
    audioRecorderRef.current?.stop();
  };

  const uploadToStorage = async (): Promise<string> => {
    if (pickedFile) {
      // Utiliser la même fonction que les stories pour l'upload Cloudinary
      const resourceType = mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'raw';
      const uploadResult = await uploadToCloudinary(pickedFile, resourceType);
      return uploadResult.secureUrl;
    }
    return externalMediaUrl.trim();
  };

  const publishPost = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Texte requis', description: 'Ajoutez une description du post.' });
      setActiveStep('details');
      return;
    }
    if (!category) {
      toast({ variant: 'destructive', title: 'Catégorie requise', description: 'Sélectionnez la catégorie du post.' });
      setActiveStep('details');
      return;
    }
    if (!hasAnyMedia) {
      toast({ variant: 'destructive', title: 'Média requis', description: 'Importez, filmez ou enregistrez un média.' });
      setActiveStep('media');
      return;
    }
    if (!hasStoredLocation) {
      setActiveStep('publish');
      detectLocation();
      toast({
        title: 'Localisation requise',
        description: 'Autorisez la localisation pour publier avec le lieu de votre publication.',
      });
      return;
    }

    setIsPublishing(true);
    try {
      const mediaUrl = await uploadToStorage();
      const postLocation = {
        label: location.label,
        quartier: location.quartier || '',
        ville: location.ville || '',
        pays: location.pays || '',
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null,
        source: location.source || 'stored',
      };
      await addDoc(collection(db, 'makutano_posts'), {
        text: text.trim(),
        mediaUrl,
        mediaType,
        category,
        likes: 0,
        comments: 0,
	        author: {
	          name: profile?.fullName || profile?.name || user?.displayName || 'Utilisateur eNkamba',
	          location: postLocation.label,
	          avatar: profile?.profileImage || user?.photoURL || '',
	          verified: profile?.kycStatus === 'verified',
	        },
        authorLocation: postLocation.label,
        location: postLocation,
        authorId: user?.uid || null,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Publié', description: 'Votre post a été publié avec succès.' });
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setLastAutoSavedAt(null);
      lastAutoSavedSignatureRef.current = '';
      router.push('/dashboard/makutano');
    } catch (error) {
      console.error('Erreur publication Makutano:', error);
      const errorMessage =
        typeof error === 'object' && error && 'code' in error
          ? `${(error as { code?: string }).code || 'Erreur inconnue'} - vérifiez la configuration Cloudinary`
          : 'Publication impossible pour le moment.';
      toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
    } finally {
      setIsPublishing(false);
    }
  };

  const clearSelectedMedia = () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPickedFile(null);
    setExternalMediaUrl('');
    setPreviewUrl('');
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
    setIsPreviewPlaying(false);
    setActiveStep('media');
  };

  const goToDetails = () => {
    if (!canGoToDetails) {
      toast({ variant: 'destructive', title: 'Média requis', description: 'Ajoutez une photo, une vidéo ou un audio.' });
      return;
    }
    setActiveStep('details');
  };

  const goToPublish = () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Description requise', description: 'Décrivez votre publication avant de continuer.' });
      return;
    }
    if (!category) {
      toast({ variant: 'destructive', title: 'Catégorie requise', description: 'Choisissez où classer votre publication.' });
      return;
    }
    setActiveStep('publish');
  };

  const renderMediaPreview = (compact = false) => {
    if (!previewUrl) return null;

    const previewHeight = compact ? 'h-40' : 'h-[21rem]';

    if (mediaType === 'video') {
      return (
        <div className={cn('relative overflow-hidden rounded-[1.65rem] bg-slate-950 shadow-inner', previewHeight)}>
          <video
            ref={(node) => {
              previewMediaRef.current = node;
            }}
            src={previewUrl}
            className="h-full w-full object-cover"
            playsInline
            muted={isPreviewMuted}
          />
          {!isPreviewPlaying && (
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#009058] shadow-xl"
              aria-label="Lire la vidéo"
            >
              <MakutanoPlayIcon size={30} />
            </button>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-8">
            <div className="flex items-center gap-2 text-white">
              <button type="button" onClick={togglePreviewPlay} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur" aria-label={isPreviewPlaying ? 'Pause' : 'Lecture'}>
                {isPreviewPlaying ? <MakutanoPauseIcon size={21} /> : <MakutanoPlayIcon size={21} />}
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(previewDuration, 0)}
                step={0.1}
                value={Math.min(previewCurrentTime, previewDuration || 0)}
                onChange={(event) => handlePreviewSeek(Number(event.target.value))}
                className="h-1 min-w-0 flex-1 accent-[#009058]"
                aria-label="Progression vidéo"
              />
              <button type="button" onClick={togglePreviewMute} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur" aria-label="Son">
                {isPreviewMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              {!compact && (
                <span className="w-20 text-right text-[10px] font-bold">
                  {formatTime(previewCurrentTime)} / {formatTime(previewDuration)}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (mediaType === 'audio') {
      return (
        <div className={cn('overflow-hidden rounded-[1.65rem] bg-[#009058] p-4 text-white shadow-inner', compact ? 'min-h-36' : 'min-h-[18rem]')}>
          <audio
            ref={(node) => {
              previewMediaRef.current = node;
            }}
            src={previewUrl}
            className="hidden"
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-white/60">Vocal Makutano</p>
              <p className="mt-1 text-base font-black">Aperçu audio</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#009058]">
              <MakutanoAudioIcon size={28} />
            </div>
          </div>
          <div className={cn('mt-5 flex items-end justify-center gap-1 rounded-2xl bg-white/10 px-3', compact ? 'h-14' : 'h-28')}>
            {Array.from({ length: compact ? 26 : 42 }).map((_, index) => (
              <span
                key={index}
                className="w-1.5 rounded-full bg-[#009058]"
                style={{ height: `${10 + ((index * 9) % (compact ? 34 : 70))}px` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#009058]"
              aria-label={isPreviewPlaying ? 'Mettre en pause' : 'Lire'}
            >
              {isPreviewPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(previewDuration, 0)}
              step={0.1}
              value={Math.min(previewCurrentTime, previewDuration || 0)}
              onChange={(event) => handlePreviewSeek(Number(event.target.value))}
              className="h-1 min-w-0 flex-1 accent-[#009058]"
              aria-label="Progression audio"
            />
            <span className="text-[10px] font-bold text-white/70">{formatTime(previewCurrentTime)}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={cn('overflow-hidden rounded-[1.65rem] bg-[#e8f6ef] shadow-inner', previewHeight)}>
        <img src={previewUrl} alt="Aperçu média" className="h-full w-full object-cover" />
      </div>
    );
  };

  return (
    <div className="min-h-full bg-[#f5fbf8] px-3 py-3 text-[#009058]">
      <div className="mx-auto flex min-h-[calc(100dvh-10.5rem)] max-w-xl flex-col overflow-hidden rounded-[2rem] border border-[#dcefe5] bg-white shadow-[0_18px_50px_rgba(20,90,56,0.12)]">
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-[#e8f4ed] px-3 py-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/makutano')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef8f2] text-[#009058] transition hover:bg-[#009058] hover:text-white"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase text-[#009058]">Makutano</p>
            <h1 className="truncate text-base font-black">Créer une publication</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#009058]/10">
            <MakutanoCreateIcon size={28} />
          </div>
        </header>

        <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3">
          {stepItems.map((step, index) => {
            const isActive = activeStep === step.id;
            const isDone = index < activeStepIndex || (step.id === 'media' && hasAnyMedia) || (step.id === 'details' && canGoToPublish);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id === 'media') setActiveStep('media');
                  if (step.id === 'details' && canGoToDetails) setActiveStep('details');
                  if (step.id === 'publish' && canGoToPublish) setActiveStep('publish');
                }}
                className={cn(
                  'flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full text-[11px] font-black transition',
                  isActive
                    ? 'bg-[#009058] text-white shadow-[0_8px_18px_rgba(50,187,120,0.24)]'
                    : isDone
                      ? 'bg-[#e5f7ed] text-[#009058]'
                      : 'bg-[#f3f6f4] text-[#009058]'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                <span className="truncate">{step.label}</span>
              </button>
            );
          })}
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activeStep === 'media' && (
            <section className="space-y-4">
              <div className="rounded-[1.7rem] bg-[#009058] p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#009058]">
                    <EStreamPostIcon size={30} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black">Choisir le média</h2>
                    <p className="mt-0.5 text-xs font-semibold text-white/65">Capture directe ou import depuis l’appareil.</p>
                  </div>
                </div>
              </div>

              {!previewUrl && !cameraStream && !audioStream && (
                <div className="grid gap-3">
                  <div className="grid grid-cols-[1fr_auto] overflow-hidden rounded-[1.45rem] border border-[#dcefe5] bg-[#f8fcfa]">
                    <button type="button" onClick={startVideoCapture} className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-[#eef8f2]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#009058]/10 text-[#009058]">
                        <Video className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">Enregistrer une vidéo</span>
                        <span className="block text-xs font-semibold text-[#6d7c73]">Caméra native du téléphone</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => openFilePicker('video/*', 'video')} className="flex w-24 items-center justify-center border-l border-[#dcefe5] text-[#009058] transition hover:bg-[#eef8f2]" aria-label="Importer une vidéo">
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] overflow-hidden rounded-[1.45rem] border border-[#dcefe5] bg-[#f8fcfa]">
                    <button type="button" onClick={startAudioCapture} className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-[#eef8f2]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#009058]/10 text-[#009058]">
                        <MakutanoAudioIcon size={25} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">Enregistrer un vocal</span>
                        <span className="block text-xs font-semibold text-[#6d7c73]">Micro, note vocale ou message audio</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => openFilePicker('audio/*', 'audio')} className="flex w-24 items-center justify-center border-l border-[#dcefe5] text-[#009058] transition hover:bg-[#eef8f2]" aria-label="Importer un audio">
                      <FileAudio className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] overflow-hidden rounded-[1.45rem] border border-[#dcefe5] bg-[#f8fcfa]">
                    <button type="button" onClick={startPhotoCapture} className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-[#eef8f2]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#009058]/10 text-[#009058]">
                        <Camera className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">Capturer une photo</span>
                        <span className="block text-xs font-semibold text-[#6d7c73]">Prise instantanée ou image de galerie</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => openFilePicker('image/*', 'image')} className="flex w-24 items-center justify-center border-l border-[#dcefe5] text-[#009058] transition hover:bg-[#eef8f2]" aria-label="Importer une photo">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept={fileInputAccept} className="hidden" onChange={onFilePicked} />

              {cameraStream && (
                <div className="space-y-3 rounded-[1.7rem] bg-slate-950 p-3 text-white">
                  <div className="relative overflow-hidden rounded-[1.25rem]">
                    <video ref={cameraVideoRef} autoPlay muted playsInline className="h-[22rem] w-full bg-black object-cover" />
                    <button type="button" onClick={closeCamera} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 backdrop-blur" aria-label="Fermer la caméra">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {cameraMode === 'photo' ? (
                    <Button onClick={capturePhoto} className="h-12 w-full rounded-full bg-[#009058] font-black hover:bg-[#009058]">
                      <Camera className="mr-2 h-5 w-5" />
                      Capturer la photo
                    </Button>
                  ) : !isVideoRecording ? (
                    <Button onClick={startVideoRecording} className="h-12 w-full rounded-full bg-[#009058] font-black hover:bg-[#009058]">
                      <Video className="mr-2 h-5 w-5" />
                      Démarrer la vidéo
                    </Button>
                  ) : (
                    <Button onClick={stopVideoRecording} className="h-12 w-full rounded-full bg-red-600 font-black text-white hover:bg-red-600">
                      <Square className="mr-2 h-5 w-5" />
                      Arrêter l’enregistrement
                    </Button>
                  )}
                </div>
              )}

              {(audioStream || isAudioRecording) && (
                <div className="space-y-4 rounded-[1.7rem] bg-[#009058] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-white/55">Micro actif</p>
                      <h3 className="text-base font-black">Enregistrement vocal</h3>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#009058]">
                      <Mic className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex h-24 items-end gap-1 rounded-2xl bg-white/10 px-3">
                    {audioLevelData.map((level, index) => (
                      <span key={index} className="w-1.5 rounded-full bg-[#009058] transition-all" style={{ height: `${level}px` }} />
                    ))}
                  </div>
                  {!isAudioRecording ? (
                    <Button onClick={startAudioRecording} className="h-12 w-full rounded-full bg-[#009058] font-black hover:bg-[#009058]">
                      <Mic className="mr-2 h-5 w-5" />
                      Démarrer le vocal
                    </Button>
                  ) : (
                    <Button onClick={stopAudioRecording} className="h-12 w-full rounded-full bg-red-600 font-black text-white hover:bg-red-600">
                      <Square className="mr-2 h-5 w-5" />
                      Terminer le vocal
                    </Button>
                  )}
                </div>
              )}

              {previewUrl && (
                <div className="space-y-3">
                  {renderMediaPreview()}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={clearSelectedMedia} className="h-11 flex-1 rounded-full border-[#dcefe5] font-black text-[#009058]">
                      Changer
                    </Button>
                    <Button type="button" onClick={goToDetails} className="h-11 flex-1 rounded-full bg-[#009058] font-black hover:bg-[#009058]">
                      Continuer
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeStep === 'details' && (
            <section className="space-y-4">
              <div className="grid grid-cols-[6.5rem_1fr] gap-3 rounded-[1.5rem] border border-[#dcefe5] bg-[#f8fcfa] p-2">
                {renderMediaPreview(true)}
                <div className="min-w-0 py-2 pr-2">
                  <p className="text-[11px] font-black uppercase text-[#009058]">{mediaLabel}</p>
                  <h2 className="mt-1 text-base font-black">Décrire la publication</h2>
                  <p className="mt-1 text-xs font-semibold text-[#6d7c73]">Ajoutez une légende claire avant publication.</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#dcefe5] bg-white p-3">
                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Exprimez votre idée, votre annonce ou votre moment..."
                  className="min-h-[9rem] resize-none border-0 bg-transparent p-1 text-base font-semibold leading-7 text-[#009058] shadow-none placeholder:text-[#009058] focus-visible:ring-0"
                />
                <div className="mt-2 flex items-center justify-between border-t border-[#edf5f0] pt-2 text-[11px] font-bold text-[#7a8a80]">
                  <span>{text.trim().length} caractères</span>
                  <span>Auto-sauvegarde</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-[#009058]">Catégorie</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={cn(
                        'h-10 rounded-full px-4 text-xs font-black transition',
                        category === item
                          ? 'bg-[#009058] text-white shadow-[0_8px_18px_rgba(50,187,120,0.22)]'
                          : 'bg-[#eef8f2] text-[#009058] hover:bg-[#009058]'
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 rounded-[1.35rem] bg-[#f6faf7] p-2">
                <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 text-xs font-black text-[#009058]" onClick={saveDraft}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Brouillon
                </Button>
                <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 text-xs font-black text-[#009058]" onClick={loadDraft} disabled={!hasDraft}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reprendre
                </Button>
                <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 text-xs font-black text-red-600" onClick={clearDraft} disabled={!hasDraft}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Effacer
                </Button>
                {lastAutoSavedAt && (
                  <span className="flex h-9 items-center px-2 text-[11px] font-bold text-[#7a8a80]">
                    {new Date(lastAutoSavedAt).toLocaleTimeString('fr-FR')}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setActiveStep('media')} className="h-11 flex-1 rounded-full border-[#dcefe5] font-black text-[#009058]">
                  Retour
                </Button>
                <Button type="button" onClick={goToPublish} className="h-11 flex-1 rounded-full bg-[#009058] font-black hover:bg-[#009058]">
                  Suivant
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </section>
          )}

          {activeStep === 'publish' && (
            <section className="space-y-4">
              <div className="rounded-[1.5rem] border border-[#dcefe5] bg-[#f8fcfa] p-2">
                {renderMediaPreview(true)}
                <div className="mt-3 px-2 pb-2">
                  <p className="line-clamp-3 text-sm font-bold leading-6 text-[#009058]">{text}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-[#009058]/10 px-3 py-1 text-[11px] font-black text-[#009058]">{category}</span>
                    <span className="rounded-full bg-[#009058]/5 px-3 py-1 text-[11px] font-black text-[#009058]">{mediaLabel}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#dcefe5] bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#009058]/10">
                    <MapPinIcon size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase text-[#009058]">Localisation</p>
                    <h2 className="mt-1 truncate text-base font-black">{hasStoredLocation ? location.label : 'Autorisation nécessaire'}</h2>
                    <p className="mt-1 text-xs font-semibold text-[#6d7c73]">
                      {hasStoredLocation ? locationDetail || 'Position enregistrée dans l’app' : 'La publication utilisera la localisation globale de l’application.'}
                    </p>
                    {locationError && <p className="mt-2 text-xs font-bold text-red-600">{locationError}</p>}
                  </div>
                </div>

                {!hasStoredLocation && (
                  <Button type="button" onClick={detectLocation} disabled={isLocating} className="mt-4 h-11 w-full rounded-full bg-[#009058] font-black hover:bg-[#009058]">
                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPinIcon size={20} />}
                    {isLocating ? 'Localisation...' : 'Autoriser la localisation'}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setActiveStep('details')} className="h-12 flex-1 rounded-full border-[#dcefe5] font-black text-[#009058]">
                  Modifier
                </Button>
                <Button type="button" onClick={publishPost} disabled={isPublishing || isLocating} className="h-12 flex-[1.35] rounded-full bg-[#009058] font-black hover:bg-[#009058]">
                  {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isPublishing ? 'Publication...' : 'Publier'}
                </Button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
