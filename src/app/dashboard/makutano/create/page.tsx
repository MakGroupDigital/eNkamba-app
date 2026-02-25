'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Upload, Mic, Square, Play, Pause, Video, Loader2, Save, RotateCcw, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type MakutanoCategory = 'Accueil' | 'Savoir' | 'Entrepreneur' | 'Projets' | 'Local';
type MediaType = 'image' | 'video' | 'audio';

const categories: MakutanoCategory[] = ['Savoir', 'Entrepreneur', 'Projets', 'Local', 'Accueil'];
const DRAFT_KEY = 'makutano_create_draft_v1';

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

  const [text, setText] = useState('');
  const [category, setCategory] = useState<MakutanoCategory | ''>('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [externalMediaUrl, setExternalMediaUrl] = useState('');
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
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

  const buildDraft = () => ({
    text,
    category,
    mediaType,
    externalMediaUrl,
    updatedAt: Date.now(),
  });

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
  }, [text, category, mediaType, externalMediaUrl, isPublishing]);

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

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFilePicked = (event: { target: { files: FileList | null } }) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPickedFile(file);
    setExternalMediaUrl('');
    setMediaType(detectMediaTypeFromName(file.name));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const startVideoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setCameraStream(stream);
      setMediaType('video');
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Caméra indisponible', description: 'Impossible de démarrer la caméra.' });
    }
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
      if (!user?.uid) {
        throw new Error('Utilisateur non authentifié');
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', pickedFile);
      formData.append('userId', user.uid);
      formData.append('mediaType', mediaType);

      const response = await fetch('/api/makutano/upload-media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.mediaUrl) {
        throw new Error(payload?.error || payload?.details?.join(' | ') || 'Upload média impossible');
      }

      return payload.mediaUrl as string;
    }
    return externalMediaUrl.trim();
  };

  const publishPost = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Texte requis', description: 'Ajoutez une description du post.' });
      return;
    }
    if (!category) {
      toast({ variant: 'destructive', title: 'Catégorie requise', description: 'Sélectionnez la catégorie du post.' });
      return;
    }
    if (!hasAnyMedia) {
      toast({ variant: 'destructive', title: 'Média requis', description: 'Importez, filmez ou enregistrez un média.' });
      return;
    }

    setIsPublishing(true);
    try {
      const mediaUrl = await uploadToStorage();
      await addDoc(collection(db, 'makutano_posts'), {
        text: text.trim(),
        mediaUrl,
        mediaType,
        category,
        likes: 0,
        comments: 0,
        author: {
          name: profile?.fullName || profile?.name || user?.displayName || 'Utilisateur eNkamba',
          location: profile?.country || 'RDC',
          avatar: profile?.profileImage || user?.photoURL || '',
        },
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
          ? `${(error as { code?: string }).code || 'Erreur inconnue'} - vérifiez bucket/règles Storage`
          : 'Publication impossible pour le moment.';
      toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-orange-50 p-4 pt-24">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/makutano')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-emerald-900">Nouveau Post Makutano</h1>
            <p className="text-xs text-emerald-700/80">Page complète de création: image, vidéo, audio</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={saveDraft}>
            <Save className="h-4 w-4" />
            Sauver brouillon
          </Button>
          <Button variant="outline" className="gap-2" onClick={loadDraft} disabled={!hasDraft}>
            <RotateCcw className="h-4 w-4" />
            Reprendre brouillon
          </Button>
          <Button variant="outline" className="gap-2" onClick={clearDraft} disabled={!hasDraft}>
            <Trash2 className="h-4 w-4" />
            Supprimer brouillon
          </Button>
        </div>
        <p className="text-xs text-emerald-700/80">
          Auto-sauvegarde active (toutes les 5s)
          {lastAutoSavedAt ? ` · Dernière sauvegarde: ${new Date(lastAutoSavedAt).toLocaleTimeString('fr-FR')}` : ''}
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contenu du post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Texte *</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Décrivez votre publication..."
                className="min-h-[110px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as MakutanoCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type média</Label>
              <Select value={mediaType} onValueChange={(value) => setMediaType(value as MediaType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter un média</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="outline" className="justify-start gap-2" onClick={openFilePicker}>
                <Upload className="h-4 w-4" />
                Importer un fichier
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={startVideoCapture}>
                <Camera className="h-4 w-4" />
                Filmer en direct
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={startAudioCapture}>
                <Mic className="h-4 w-4" />
                Enregistrer audio
              </Button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={onFilePicked} />

            <div className="space-y-2">
              <Label>Ou URL média Firebase</Label>
              <Input
                placeholder="https://... (Storage URL)"
                value={externalMediaUrl}
                onChange={(e) => {
                  setExternalMediaUrl(e.target.value);
                  setPickedFile(null);
                  setPreviewUrl(e.target.value);
                }}
              />
            </div>

            {cameraStream && (
              <div className="space-y-3 rounded-xl border bg-black p-3">
                <video ref={cameraVideoRef} autoPlay muted playsInline className="h-64 w-full rounded-lg object-cover" />
                {!isVideoRecording ? (
                  <Button onClick={startVideoRecording} className="gap-2">
                    <Video className="h-4 w-4" />
                    Démarrer l'enregistrement vidéo
                  </Button>
                ) : (
                  <Button onClick={stopVideoRecording} variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" />
                    Arrêter la vidéo
                  </Button>
                )}
              </div>
            )}

            {(audioStream || isAudioRecording) && (
              <div className="space-y-3 rounded-xl border bg-emerald-900/90 p-4">
                <div className="flex h-20 items-end gap-1 rounded-md bg-black/25 px-2">
                  {audioLevelData.map((level, idx) => (
                    <span
                      key={idx}
                      className="w-1 rounded-full bg-emerald-200 transition-all"
                      style={{ height: `${level}px` }}
                    />
                  ))}
                </div>
                {!isAudioRecording ? (
                  <Button onClick={startAudioRecording} className="gap-2">
                    <Mic className="h-4 w-4" />
                    Démarrer l'enregistrement audio
                  </Button>
                ) : (
                  <Button onClick={stopAudioRecording} variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" />
                    Stop audio
                  </Button>
                )}
              </div>
            )}

            {previewUrl && (
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-emerald-800">Aperçu</p>
                {mediaType === 'video' ? (
                  <div className="relative overflow-hidden rounded-xl bg-black">
                    <video
                      ref={(node) => {
                        previewMediaRef.current = node;
                      }}
                      src={previewUrl}
                      className="h-64 w-full object-cover"
                      playsInline
                    />
                    {!isPreviewPlaying && (
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-xl transition-transform hover:scale-105"
                      >
                        <Play className="h-6 w-6" />
                      </button>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={togglePreviewPlay} className="text-white">
                          {isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(previewDuration, 0)}
                          step={0.1}
                          value={Math.min(previewCurrentTime, previewDuration || 0)}
                          onChange={(e) => handlePreviewSeek(Number(e.target.value))}
                          className="h-1 w-full accent-emerald-400"
                        />
                        <button type="button" onClick={togglePreviewMute} className="text-white">
                          {isPreviewMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                        <span className="text-[10px] font-medium text-white">
                          {formatTime(previewCurrentTime)} / {formatTime(previewDuration)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : mediaType === 'audio' ? (
                  <div className="space-y-2 rounded-xl bg-emerald-900/95 p-3">
                    <audio
                      ref={(node) => {
                        previewMediaRef.current = node;
                      }}
                      src={previewUrl}
                      className="hidden"
                    />
                    <div className="flex h-12 items-end gap-1 rounded-md bg-black/25 px-2">
                      {Array.from({ length: 24 }).map((_, idx) => (
                        <span
                          key={idx}
                          className="w-1 rounded-full bg-emerald-200/90"
                          style={{ height: `${8 + ((idx * 7) % 22)}px` }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="rounded-full bg-white p-2 text-emerald-700"
                      >
                        {isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(previewDuration, 0)}
                        step={0.1}
                        value={Math.min(previewCurrentTime, previewDuration || 0)}
                        onChange={(e) => handlePreviewSeek(Number(e.target.value))}
                        className="h-1 w-full accent-emerald-300"
                      />
                      <span className="text-[10px] font-medium text-emerald-100">
                        {formatTime(previewCurrentTime)} / {formatTime(previewDuration)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Aperçu média" className="h-64 w-full rounded-lg object-cover" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pb-6">
          <Button variant="outline" onClick={() => router.push('/dashboard/makutano')}>
            Annuler
          </Button>
          <Button onClick={publishPost} disabled={isPublishing} className="gap-2 bg-gradient-to-r from-primary to-green-800">
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isPublishing ? 'Publication...' : 'Publier maintenant'}
          </Button>
        </div>
      </div>
    </div>
  );
}
