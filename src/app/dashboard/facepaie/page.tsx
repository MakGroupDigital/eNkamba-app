'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import DashboardHeader from '@/components/dashboard/dashboard-header';
import { PinVerification } from '@/components/payment/PinVerification';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';

type FacePaieSetupStep = 'intro' | 'consent' | 'capture' | 'saving' | 'done' | 'dashboard';
type FaceGuideStep = 'center' | 'left' | 'right' | 'up';
type FaceGuideStatus = 'loading' | 'searching' | 'adjust' | 'valid' | 'blocked';
type FacePaieProfile = {
  enabled?: boolean;
  provider?: string;
  comprefaceSubject?: string;
  frameCount?: number;
  emergencyPhone?: string;
  transactionAlerts?: boolean;
  requirePinFallback?: boolean;
  allowMerchantFacePaie?: boolean;
  livenessVerified?: boolean;
  updatedAt?: any;
  createdAt?: any;
};

const FACEPAIE_GUIDE_STEPS: Array<{ id: FaceGuideStep; label: string; short: string }> = [
  { id: 'center', label: 'Regardez droit devant la caméra.', short: 'Face' },
  { id: 'left', label: 'Tournez doucement votre visage à gauche.', short: 'Gauche' },
  { id: 'right', label: 'Tournez doucement votre visage à droite.', short: 'Droite' },
  { id: 'up', label: 'Relevez légèrement votre tête.', short: 'Haut' },
];

function FacePaieBackMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M13.8 5.2L8 11l5.8 5.8" stroke="#0A8B46" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 11h8" stroke="#0A8B46" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function FaceScanVisual() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="52" height="52" rx="16" fill="#0A8B46" />
      <path d="M17 22v-6h7M47 22v-6h-7M17 42v6h7M47 42v6h-7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 19c-9 0-15 7-15 16 0 8 6 14 15 14s15-6 15-14c0-9-6-16-15-16Z" stroke="white" strokeWidth="3.8" />
      <path d="M22 31c5-.8 8-3 10-7 4 5 8 7 13 7" stroke="white" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M26 39c3 2.2 8.5 2.2 11.5 0" stroke="white" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

function ProtectedPaymentVisual() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="52" height="52" rx="16" fill="#0A8B46" />
      <path d="M32 16l16 6v11c0 11-7 18-16 22-9-4-16-11-16-22V22l16-6Z" fill="white" fillOpacity=".16" stroke="white" strokeWidth="3.8" strokeLinejoin="round" />
      <path d="M24 34l6 6 12-14" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 52c7 5 17 5 24 0" stroke="#0A8B46" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function InstantFlowVisual() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="52" height="52" rx="16" fill="#0A8B46" />
      <path d="M19 25h19" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M34 18l8 7-8 7" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M45 39H26" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M30 32l-8 7 8 7" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="7" fill="white" fillOpacity=".18" stroke="white" strokeWidth="3.5" />
    </svg>
  );
}

function FacePaieDashboardIcon({ type }: { type: 'face' | 'phone' | 'shield' | 'bell' | 'merchant' | 'delete' }) {
  const danger = type === 'delete';
  const bg = danger ? '#fee2e2' : '#e8f7ef';
  const fg = danger ? '#dc2626' : '#0A8B46';
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: bg }}>
      <svg width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden="true">
        {type === 'face' && (
          <>
            <path d="M5.2 9.2V6.4c0-.8.6-1.4 1.4-1.4h2.8M19.8 9.2V6.4c0-.8-.6-1.4-1.4-1.4h-2.8M5.2 15.8v2.8c0 .8.6 1.4 1.4 1.4h2.8M19.8 15.8v2.8c0 .8-.6 1.4-1.4 1.4h-2.8" stroke={fg} strokeWidth="2.1" strokeLinecap="round" />
            <path d="M12.5 7.3c-3.4 0-5.8 2.5-5.8 5.7 0 3.1 2.4 5.3 5.8 5.3s5.8-2.2 5.8-5.3c0-3.2-2.4-5.7-5.8-5.7Z" stroke={fg} strokeWidth="2.1" />
            <path d="M9.8 14.4c1.4 1 4 1 5.4 0" stroke={fg} strokeWidth="2.1" strokeLinecap="round" />
          </>
        )}
        {type === 'phone' && (
          <>
            <path d="M9 4.5h7c.9 0 1.6.7 1.6 1.6v12.8c0 .9-.7 1.6-1.6 1.6H9c-.9 0-1.6-.7-1.6-1.6V6.1c0-.9.7-1.6 1.6-1.6Z" stroke={fg} strokeWidth="2.1" />
            <path d="M11 7h3M12.5 17.9h.1" stroke={fg} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        {type === 'shield' && (
          <>
            <path d="M12.5 4.3l7 2.7v4.9c0 4.8-3 7.8-7 9.5-4-1.7-7-4.7-7-9.5V7l7-2.7Z" stroke={fg} strokeWidth="2.1" strokeLinejoin="round" />
            <path d="M9.5 12.7l2.1 2.1 4.2-5" stroke={fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {type === 'bell' && (
          <>
            <path d="M18.3 15.3H6.7l1.2-2V10c0-2.7 1.8-4.8 4.6-4.8s4.6 2.1 4.6 4.8v3.3l1.2 2Z" stroke={fg} strokeWidth="2.1" strokeLinejoin="round" />
            <path d="M10.7 18.1c.8 1.3 2.8 1.3 3.6 0" stroke={fg} strokeWidth="2.1" strokeLinecap="round" />
          </>
        )}
        {type === 'merchant' && (
          <>
            <path d="M5 10.2l1-4.4h13l1 4.4c-.7 1.3-2.4 1.4-3.3.2-.9 1.2-2.6 1.2-3.5 0-.9 1.2-2.6 1.2-3.5 0-.9 1.2-2.6 1.1-3.3-.2Z" stroke={fg} strokeWidth="2.1" strokeLinejoin="round" />
            <path d="M7.2 11.6v7.2h10.6v-7.2M11 18.7v-4h3v4" stroke={fg} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {type === 'delete' && (
          <>
            <path d="M6.5 7.5h12M10 7.5V5.8h5v1.7M8 10l.7 9h7.6l.7-9" stroke={fg} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 12.2v4.4M14 12.2v4.4" stroke={fg} strokeWidth="2.1" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}

export default function FacePaiePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stableFramesRef = useRef(0);
  const guideStepIndexRef = useRef(0);
  const challengeStepsRef = useRef(FACEPAIE_GUIDE_STEPS);
  const livenessFramesRef = useRef<string[]>([]);
  const isAssessingFrameRef = useRef(false);
  const isEnrollmentRunningRef = useRef(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<FacePaieSetupStep>('intro');
  const [cameraError, setCameraError] = useState('');
  const [instruction, setInstruction] = useState('Confirmez votre PIN pour commencer.');
  const [faceApiStatus, setFaceApiStatus] = useState<'idle' | 'ready' | 'loading'>('idle');
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [faceGuideStatus, setFaceGuideStatus] = useState<FaceGuideStatus>('loading');
  const [faceGuideMessage, setFaceGuideMessage] = useState('Initialisation de la détection FacePaie...');
  const [faceGuideQuality, setFaceGuideQuality] = useState(0);
  const [isFaceReady, setIsFaceReady] = useState(false);
  const [challengeSteps, setChallengeSteps] = useState(FACEPAIE_GUIDE_STEPS);
  const [capturedFrameCount, setCapturedFrameCount] = useState(0);
  const [faceProfile, setFaceProfile] = useState<FacePaieProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settings, setSettings] = useState({
    transactionAlerts: true,
    requirePinFallback: true,
    allowMerchantFacePaie: true,
  });

  const benefits = [
    {
      visual: FaceScanVisual,
      title: 'Reconnaissance',
      text: 'Valider par le visage.',
    },
    {
      visual: ProtectedPaymentVisual,
      title: 'Protection',
      text: 'Sécuriser les opérations.',
    },
    {
      visual: InstantFlowVisual,
      title: 'Rapidité',
      text: 'Réduire les étapes.',
    },
  ];

  useEffect(() => {
    let mounted = true;

    const loadFacePaieProfile = async () => {
      if (!user?.uid) {
        if (mounted) setIsProfileLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', user.uid, 'security', 'facepaie');
        const profileSnap = await getDoc(profileRef);
        if (!mounted) return;

        if (profileSnap.exists() && profileSnap.data()?.enabled) {
          const profile = profileSnap.data() as FacePaieProfile;
          setFaceProfile(profile);
          setEmergencyPhone(profile.emergencyPhone || '');
          setSettings({
            transactionAlerts: profile.transactionAlerts ?? true,
            requirePinFallback: profile.requirePinFallback ?? true,
            allowMerchantFacePaie: profile.allowMerchantFacePaie ?? true,
          });
          setSetupStep('dashboard');
          setInstruction('FacePaie est actif sur votre compte.');
        } else {
          setFaceProfile(null);
        }
      } catch (error) {
        console.error('Erreur chargement FacePaie:', error);
      } finally {
        if (mounted) setIsProfileLoading(false);
      }
    };

    void loadFacePaieProfile();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const resetFaceGuide = useCallback(() => {
    const movementSteps = FACEPAIE_GUIDE_STEPS.filter((step) => step.id !== 'center');
    const shuffledMovements = [...movementSteps].sort(() => Math.random() - 0.5);
    const nextChallenge = [
      FACEPAIE_GUIDE_STEPS.find((step) => step.id === 'center')!,
      ...shuffledMovements,
    ];

    challengeStepsRef.current = nextChallenge;
    livenessFramesRef.current = [];
    isAssessingFrameRef.current = false;
    isEnrollmentRunningRef.current = false;
    stableFramesRef.current = 0;
    guideStepIndexRef.current = 0;
    setChallengeSteps(nextChallenge);
    setGuideStepIndex(0);
    setFaceGuideStatus('loading');
    setFaceGuideMessage('Initialisation de la détection FacePaie...');
    setFaceGuideQuality(0);
    setIsFaceReady(false);
    setCapturedFrameCount(0);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsVideoReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleStartSetup = () => {
    setPinOpen(true);
  };

  const handlePinSuccess = () => {
    setPinOpen(false);
    setSetupStep('consent');
    setInstruction('Préparez-vous dans un endroit bien éclairé.');
  };

  const startCamera = async () => {
    setCameraError('');
    setIsCameraStarting(true);
    setIsVideoReady(false);
    resetFaceGuide();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("La caméra n'est pas disponible sur cet appareil.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      setFaceApiStatus('ready');
      setSetupStep('capture');
      setInstruction(
        'Suivez les consignes FacePaie. Le visage sera contrôlé automatiquement.'
      );
    } catch (error: any) {
      setCameraError(error?.message || "Impossible d'ouvrir la caméra.");
      setInstruction("Autorisez la caméra pour enregistrer FacePaie.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  useEffect(() => {
    if (setupStep !== 'capture' && setupStep !== 'saving') return;

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    let cancelled = false;

    const attachStream = async () => {
      try {
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }

        video.muted = true;
        video.playsInline = true;
        await video.play();

        if (!cancelled) {
          setIsVideoReady(true);
          setCameraError('');
        }
      } catch (error: any) {
        if (!cancelled) {
          setIsVideoReady(false);
          setCameraError(error?.message || "Touchez l'écran pour afficher la caméra.");
        }
      }
    };

    void attachStream();

    return () => {
      cancelled = true;
    };
  }, [setupStep]);

  useEffect(() => {
    if (setupStep !== 'capture' || !isVideoReady) return;

    let cancelled = false;
    let frameId = 0;
    let lastAnalysisAt = 0;

    const captureFrame = (video: HTMLVideoElement, size = 480, quality = 0.88) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return '';

      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/jpeg', quality);
    };

    const saveChallengeFrame = (video: HTMLVideoElement) => {
      const frame = captureFrame(video);
      if (!frame) return;
      livenessFramesRef.current = [
        ...livenessFramesRef.current,
        frame,
      ].slice(-FACEPAIE_GUIDE_STEPS.length);
      setCapturedFrameCount(livenessFramesRef.current.length);
    };

    const moveToNextStep = (video: HTMLVideoElement) => {
      saveChallengeFrame(video);
      const nextIndex = guideStepIndexRef.current + 1;
      const activeChallenge = challengeStepsRef.current;
      stableFramesRef.current = 0;

      if (nextIndex >= activeChallenge.length) {
        setGuideStepIndex(activeChallenge.length - 1);
        setFaceGuideStatus('valid');
        setFaceGuideQuality(100);
        setFaceGuideMessage('Challenge vidéo validé. Vous pouvez enregistrer FacePaie.');
        setIsFaceReady(true);
        setInstruction('Challenge vidéo validé. Lancez l’enregistrement FacePaie.');
        return;
      }

      guideStepIndexRef.current = nextIndex;
      setGuideStepIndex(nextIndex);
      setFaceGuideStatus('searching');
      setFaceGuideQuality(Math.round((nextIndex / activeChallenge.length) * 100));
      setFaceGuideMessage(activeChallenge[nextIndex].label);
      setInstruction(activeChallenge[nextIndex].label);
    };

    const analyze = async (now: number) => {
      if (cancelled) return;
      const video = videoRef.current;
      const activeChallenge = challengeStepsRef.current;
      const currentStep = activeChallenge[guideStepIndexRef.current];

      if (!video || video.readyState < 2) {
        frameId = requestAnimationFrame(analyze);
        return;
      }

      if (now - lastAnalysisAt < 260) {
        frameId = requestAnimationFrame(analyze);
        return;
      }

      lastAnalysisAt = now;

      if (isAssessingFrameRef.current) {
        frameId = requestAnimationFrame(analyze);
        return;
      }

      const frame = captureFrame(video, 360, 0.82);
      if (!frame) {
        frameId = requestAnimationFrame(analyze);
        return;
      }

      isAssessingFrameRef.current = true;
      try {
        const response = await fetch('/api/facepaie/compreface', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'assess',
            frame,
            step: currentStep.id,
          }),
        });
        const assessment = await response.json();

        if (!response.ok || !assessment?.success) {
          throw new Error(assessment?.error || 'Analyse FacePaie indisponible.');
        }

        if (assessment.accepted) {
          stableFramesRef.current = Math.min(stableFramesRef.current + 1, 2);
          const stepBase = (guideStepIndexRef.current / activeChallenge.length) * 100;
          const stepProgress = (stableFramesRef.current / 2) * (100 / activeChallenge.length);
          setFaceGuideStatus('valid');
          setFaceGuideQuality(Math.min(99, Math.round(stepBase + stepProgress)));
          setFaceGuideMessage(assessment.instruction || 'Visage validé. Restez stable.');
          setInstruction(assessment.instruction || 'Visage validé. Restez stable.');
          if (stableFramesRef.current >= 1) moveToNextStep(video);
        } else {
          stableFramesRef.current = 0;
          setIsFaceReady(false);
          setFaceGuideStatus('adjust');
          setFaceGuideQuality(Math.max(10, Math.round(assessment.confidence || 0)));
          setFaceGuideMessage(assessment.instruction || currentStep.label);
          setInstruction(assessment.instruction || currentStep.label);
        }
      } catch (error: any) {
        stableFramesRef.current = 0;
        setIsFaceReady(false);
        setFaceGuideStatus('blocked');
        setFaceGuideMessage(error?.message || 'Analyse FacePaie indisponible.');
        setInstruction('Analyse FacePaie indisponible.');
      } finally {
        isAssessingFrameRef.current = false;
      }

      frameId = requestAnimationFrame(analyze);
    };

    frameId = requestAnimationFrame(analyze);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [isVideoReady, setupStep]);

  const captureFace = async () => {
    if (isEnrollmentRunningRef.current || setupStep === 'saving') return;

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Session requise',
        description: 'Connectez-vous pour configurer FacePaie.',
      });
      return;
    }

    if (!isFaceReady) {
      setCameraError('Terminez d’abord les consignes de détection FacePaie.');
      return;
    }

    const frames = livenessFramesRef.current;
    if (frames.length < 3) {
      setCameraError('Challenge vidéo incomplet. Recommencez la validation.');
      return;
    }

    setCameraError('');
    setInstruction('Envoi sécurisé vers FacePaie...');
    isEnrollmentRunningRef.current = true;

    try {
      setSetupStep('saving');
      setInstruction('FacePaie enregistre votre profil...');

      const response = await fetch('/api/facepaie/compreface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enroll',
          userId: user.uid,
          frames,
          challenge: challengeStepsRef.current.map((step) => step.id),
        }),
      });
      const compreface = await response.json();
      if (!response.ok || !compreface?.success) {
        throw new Error(compreface?.error || 'FacePaie n’a pas validé le visage.');
      }

      await setDoc(doc(db, 'users', user.uid, 'security', 'facepaie'), {
        enabled: true,
        provider: 'compreface',
        comprefaceSubject: compreface.subject,
        comprefaceImages: compreface.images || [],
        templateVersion: 'facepaie-v3-compreface-video-challenge',
        livenessMode: 'active-video-challenge',
        livenessVerified: true,
        livenessGuide: challengeStepsRef.current.map((step) => step.id),
        frameCount: frames.length,
        deviceLabel: navigator.userAgent,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      const nextProfile: FacePaieProfile = {
        ...(faceProfile || {}),
        enabled: true,
        provider: 'compreface',
        comprefaceSubject: compreface.subject,
        comprefaceImages: compreface.images || [],
        templateVersion: 'facepaie-v3-compreface-video-challenge',
        livenessMode: 'active-video-challenge',
        livenessVerified: true,
        livenessGuide: challengeStepsRef.current.map((step) => step.id),
        frameCount: frames.length,
        transactionAlerts: settings.transactionAlerts,
        requirePinFallback: settings.requirePinFallback,
        allowMerchantFacePaie: settings.allowMerchantFacePaie,
        emergencyPhone,
      } as FacePaieProfile;

      setFaceProfile(nextProfile);
      stopCamera();
      setSetupStep('dashboard');
      setInstruction('FacePaie est configuré sur votre compte.');
      toast({
        title: 'FacePaie activé',
        description: 'Votre profil FacePaie a été enregistré.',
        className: 'bg-primary text-white border-none',
      });
    } catch (error: any) {
      isEnrollmentRunningRef.current = false;
      setSetupStep('capture');
      setInstruction('Réessayez avec le visage bien éclairé et centré.');
      setCameraError(error?.message || "Impossible d'enregistrer FacePaie.");
    }
  };

  useEffect(() => {
    if (setupStep !== 'capture' || !isFaceReady || capturedFrameCount < 3) return;
    if (isEnrollmentRunningRef.current) return;

    const timeout = window.setTimeout(() => {
      void captureFace();
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [capturedFrameCount, isFaceReady, setupStep]);

  const saveFacePaieSettings = async (nextSettings = settings, nextPhone = emergencyPhone) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Session requise',
        description: 'Connectez-vous pour modifier FacePaie.',
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      const cleanPhone = nextPhone.trim();
      await setDoc(doc(db, 'users', user.uid, 'security', 'facepaie'), {
        emergencyPhone: cleanPhone,
        transactionAlerts: nextSettings.transactionAlerts,
        requirePinFallback: nextSettings.requirePinFallback,
        allowMerchantFacePaie: nextSettings.allowMerchantFacePaie,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setEmergencyPhone(cleanPhone);
      setSettings(nextSettings);
      setFaceProfile((profile) => ({
        ...(profile || {}),
        emergencyPhone: cleanPhone,
        transactionAlerts: nextSettings.transactionAlerts,
        requirePinFallback: nextSettings.requirePinFallback,
        allowMerchantFacePaie: nextSettings.allowMerchantFacePaie,
      }));
      toast({
        title: 'Paramètres enregistrés',
        description: 'Vos préférences FacePaie sont à jour.',
        className: 'bg-primary text-white border-none',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur FacePaie',
        description: error?.message || "Impossible d'enregistrer les paramètres.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const toggleFacePaieSetting = (key: keyof typeof settings) => {
    const nextSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(nextSettings);
    void saveFacePaieSettings(nextSettings, emergencyPhone);
  };

  const updateFacePaieFace = () => {
    setPinOpen(true);
  };

  const deleteFacePaieProfile = async () => {
    if (!user?.uid) return;
    const confirmed = window.confirm('Supprimer FacePaie de ce compte ? Vous devrez réenregistrer votre visage pour l’utiliser à nouveau.');
    if (!confirmed) return;

    setIsSavingSettings(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'security', 'facepaie'));
      setFaceProfile(null);
      setEmergencyPhone('');
      setSettings({
        transactionAlerts: true,
        requirePinFallback: true,
        allowMerchantFacePaie: true,
      });
      resetFaceGuide();
      setSetupStep('intro');
      setInstruction('Confirmez votre PIN pour commencer.');
      toast({
        title: 'FacePaie supprimé',
        description: 'Votre profil FacePaie a été retiré de ce compte.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Suppression impossible',
        description: error?.message || 'Réessayez dans quelques instants.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetSetup = () => {
    stopCamera();
    resetFaceGuide();
    setSetupStep(faceProfile?.enabled ? 'dashboard' : 'intro');
    setCameraError('');
    setInstruction(faceProfile?.enabled ? 'FacePaie est actif sur votre compte.' : 'Confirmez votre PIN pour commencer.');
  };

  const isSetupActive = setupStep !== 'intro';

  return (
    <>
      <DashboardHeader searchPlaceholder="Rechercher dans FacePaie..." />
      <main className="min-h-screen bg-white pt-24">
        <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col gap-4 px-4 pb-6 pt-2 sm:max-w-xl">
          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-3">
            <Link
              href="/dashboard/mbongo-dashboard"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0A8B46]/15 bg-white text-[#0A8B46] shadow-sm transition hover:bg-[#0A8B46]/5"
              aria-label="Retour"
            >
              <FacePaieBackMark />
            </Link>
            <div className="min-w-0 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0A8B46]">Mbongo</p>
              <h1 className="truncate text-lg font-black text-slate-950">FacePaie</h1>
            </div>
            <div aria-hidden="true" />
          </div>

          <section className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-[2rem] bg-[#0A8B46] p-5 text-white shadow-2xl shadow-[#0A8B46]/20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_16%,rgba(255,255,255,0.24),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.12),transparent_48%)]" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-white/12" />
            {isProfileLoading ? (
              <div className="relative flex min-h-[28rem] flex-col items-center justify-center text-center">
                <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                <p className="mt-4 text-sm font-black text-white/80">Chargement FacePaie...</p>
              </div>
            ) : setupStep === 'dashboard' ? (
              <div className="relative flex min-h-full flex-col gap-4">
                <div className="flex items-center gap-3 rounded-[1.6rem] border border-white/14 bg-white/12 p-3 backdrop-blur">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-white p-2 shadow-lg shadow-black/10">
                    <Image src="/facepaie-icon.svg" alt="FacePaie" width={56} height={56} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/64">Profil actif</p>
                    <h2 className="truncate text-xl font-black leading-tight">Mon FacePaie</h2>
                    <p className="mt-1 text-xs font-bold leading-5 text-white/70">
                      Paiement par visage prêt pour les opérations autorisées.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0A8B46]">
                    Actif
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <article className="rounded-2xl bg-white/12 p-3 text-center backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/58">Analyse</p>
                    <p className="mt-1 text-2xl font-black">100%</p>
                    <p className="text-[10px] font-bold text-white/62">validée</p>
                  </article>
                  <article className="rounded-2xl bg-white/12 p-3 text-center backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/58">Images</p>
                    <p className="mt-1 text-2xl font-black">{faceProfile?.frameCount || 4}</p>
                    <p className="text-[10px] font-bold text-white/62">frames</p>
                  </article>
                  <article className="rounded-2xl bg-white/12 p-3 text-center backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/58">Secours</p>
                    <p className="mt-1 text-2xl font-black">{emergencyPhone ? 'OK' : '-'}</p>
                    <p className="text-[10px] font-bold text-white/62">numéro</p>
                  </article>
                </div>

                <div className="rounded-[1.55rem] bg-white p-3 text-slate-950 shadow-xl shadow-black/10">
                  <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#0A8B46]">Actions FacePaie</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={updateFacePaieFace}
                      className="flex items-center gap-3 rounded-2xl border border-[#0A8B46]/10 bg-[#0A8B46]/5 p-3 text-left transition active:scale-[0.98]"
                    >
                      <FacePaieDashboardIcon type="face" />
                      <span className="min-w-0">
                        <span className="block text-sm font-black">Mettre à jour</span>
                        <span className="block text-[10px] font-bold text-slate-500">Reprendre le visage</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteFacePaieProfile()}
                      disabled={isSavingSettings}
                      className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-left transition active:scale-[0.98] disabled:opacity-60"
                    >
                      <FacePaieDashboardIcon type="delete" />
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-red-600">Supprimer</span>
                        <span className="block text-[10px] font-bold text-red-400">Désactiver FacePaie</span>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.55rem] bg-white p-3 text-slate-950 shadow-xl shadow-black/10">
                  <div className="flex items-center gap-3">
                    <FacePaieDashboardIcon type="phone" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black">Numéro de secours</p>
                      <p className="text-[11px] font-bold leading-4 text-slate-500">Utilisé si une validation supplémentaire est demandée.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={emergencyPhone}
                      onChange={(event) => setEmergencyPhone(event.target.value)}
                      inputMode="tel"
                      placeholder="+243..."
                      className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-[#0A8B46] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => void saveFacePaieSettings(settings, emergencyPhone)}
                      disabled={isSavingSettings}
                      className="h-12 rounded-2xl bg-[#0A8B46] px-4 text-xs font-black text-white shadow-lg shadow-[#0A8B46]/20 disabled:opacity-60"
                    >
                      {isSavingSettings ? '...' : 'OK'}
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.55rem] bg-white p-3 text-slate-950 shadow-xl shadow-black/10">
                  <p className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#0A8B46]">Paramètres</p>
                  <div className="mt-3 space-y-2">
                    {[
                      {
                        key: 'transactionAlerts' as const,
                        icon: 'bell' as const,
                        title: 'Alertes de transaction',
                        text: 'Notifier chaque usage FacePaie.',
                      },
                      {
                        key: 'requirePinFallback' as const,
                        icon: 'shield' as const,
                        title: 'PIN de secours',
                        text: 'Garder une validation alternative.',
                      },
                      {
                        key: 'allowMerchantFacePaie' as const,
                        icon: 'merchant' as const,
                        title: 'Paiement commerçant',
                        text: 'Autoriser les points de vente FacePaie.',
                      },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleFacePaieSetting(item.key)}
                        disabled={isSavingSettings}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition active:scale-[0.99] disabled:opacity-60"
                      >
                        <FacePaieDashboardIcon type={item.icon} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-black">{item.title}</span>
                          <span className="block text-[11px] font-bold leading-4 text-slate-500">{item.text}</span>
                        </span>
                        <span className={`relative h-7 w-12 rounded-full p-1 transition ${settings[item.key] ? 'bg-[#0A8B46]' : 'bg-slate-300'}`}>
                          <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${settings[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : !isSetupActive ? (
              <>
                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[1.8rem] bg-white p-3 shadow-xl shadow-black/10">
                    <div className="relative h-full w-full">
                      <Image
                        src="/facepaie-icon.svg"
                        alt="FacePaie"
                        fill
                        sizes="112px"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>

                  <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-white/70">Paiement par le visage</p>
                  <h2 className="mt-2 max-w-xs text-2xl font-black leading-tight">
                    Payez partout, même sans téléphone.
                  </h2>
                  <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-white/82">
                    FacePaie vous permet d’effectuer des transactions financières en magasin, supermarché, taxi et autres points de service simplement avec votre visage.
                  </p>
                </div>

                <div className="relative mt-6 grid grid-cols-3 gap-2">
                  {benefits.map((item) => {
                    const Visual = item.visual;
                    return (
                      <article key={item.title} className="rounded-2xl border border-white/14 bg-white/10 p-2.5 text-center backdrop-blur">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center [&_svg]:h-12 [&_svg]:w-12">
                          <Visual />
                        </div>
                        <h3 className="mt-2 text-[11px] font-black leading-tight text-white">{item.title}</h3>
                        <p className="mt-1 text-[10px] font-bold leading-4 text-white/68">{item.text}</p>
                      </article>
                    );
                  })}
                </div>

                <div className="relative mt-6 space-y-3">
                  <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-bold leading-5 text-white/82">
                      Plus besoin de dépendre de votre téléphone pour payer : votre identité faciale devient votre moyen de paiement sécurisé.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartSetup}
                    className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-[#0A8B46] shadow-xl shadow-black/10 transition hover:scale-[1.01] active:scale-[0.98]"
                  >
                    Commencer avec FacePaie
                  </button>
                </div>
              </>
            ) : (
              <div className="relative flex min-h-full flex-col justify-between gap-4">
                <div className="text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
                    Configuration sécurisée
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">
                    {setupStep === 'done' ? 'FacePaie est prêt.' : 'Enregistrez votre visage'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-xs font-bold leading-5 text-white/76">
                    {instruction}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/14 bg-white/10 p-3 backdrop-blur">
                  {setupStep === 'consent' && (
                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white p-2">
                        <Image src="/facepaie-icon.svg" alt="" width={72} height={72} className="h-full w-full object-contain" />
                      </div>
                      <p className="text-sm font-black">Étape 1/2</p>
                      <p className="text-xs font-bold leading-5 text-white/76">
                        FacePaie va ouvrir la caméra, contrôler votre visage en direct, puis enregistrer votre profil de paiement.
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        disabled={isCameraStarting}
                        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-[#0A8B46] shadow-lg transition active:scale-[0.98] disabled:opacity-70"
                      >
                        {isCameraStarting ? 'Ouverture camera...' : 'Ouvrir la camera'}
                      </button>
                    </div>
                  )}

                  {(setupStep === 'capture' || setupStep === 'saving') && (
                    <div className="space-y-3">
                      <div className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          onLoadedMetadata={() => {
                            void videoRef.current?.play().then(() => setIsVideoReady(true)).catch(() => undefined);
                          }}
                          onCanPlay={() => setIsVideoReady(true)}
                          className="h-full w-full scale-x-[-1] object-cover"
                        />
                        {!isVideoReady && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#052b1b] text-center text-white">
                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                            <p className="max-w-[11rem] text-xs font-black leading-5 text-white/78">
                              Activation de la camera...
                            </p>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-8 rounded-[1.4rem] border-2 border-white/78" />
                        <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px bg-white/35" />
                        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-black/42 px-3 py-2 text-center text-[11px] font-black leading-4 text-white backdrop-blur">
                          {faceGuideMessage}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-white/72">
                          <span>
                            {faceGuideStatus === 'valid'
                              ? 'Validation'
                              : faceGuideStatus === 'loading'
                                ? 'Chargement'
                            : faceGuideStatus === 'blocked'
                              ? 'Bloqué'
                              : 'Analyse'}
                          </span>
                          <span>{Math.min(100, Math.max(0, faceGuideQuality))}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/14">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, faceGuideQuality))}%` }}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-1.5">
                          {challengeSteps.map((step, index) => {
                            const isDone = index < guideStepIndex || isFaceReady;
                            const isCurrent = index === guideStepIndex && !isFaceReady;
                            return (
                              <div
                                key={step.id}
                                className={`rounded-xl px-2 py-1.5 text-center text-[9px] font-black ${
                                  isDone
                                    ? 'bg-white text-[#0A8B46]'
                                    : isCurrent
                                      ? 'bg-white/18 text-white'
                                      : 'bg-white/8 text-white/48'
                                }`}
                              >
                                {step.short}
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[10px] font-bold leading-4 text-white/64">
                          FacePaie vérifie une vidéo en direct. Une photo fixe ne doit pas pouvoir activer le paiement.
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/72">
                        <span>
                          {faceApiStatus === 'ready'
                            ? 'FacePaie prêt'
                            : faceApiStatus === 'loading'
                              ? 'Chargement'
                              : 'Preuve vidéo requise'}
                        </span>
                        <span>{setupStep === 'saving' ? 'Sauvegarde...' : isFaceReady ? 'Prêt' : `${capturedFrameCount}/4 frames`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={captureFace}
                        disabled={setupStep === 'saving' || !isFaceReady}
                        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-[#0A8B46] shadow-lg transition active:scale-[0.98] disabled:opacity-70"
                      >
                        {setupStep === 'saving'
                          ? 'Enregistrement...'
                          : isFaceReady
                            ? 'Capturer mon visage'
                            : 'Suivez les consignes'}
                      </button>
                    </div>
                  )}

                  {setupStep === 'done' && (
                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white p-2">
                        <Image src="/facepaie-icon.svg" alt="" width={72} height={72} className="h-full w-full object-contain" />
                      </div>
                      <p className="text-sm font-black">Configuration terminée</p>
                      <p className="text-xs font-bold leading-5 text-white/76">
                        Votre profil FacePaie est lié à votre compte eNkamba. Les prochaines étapes d’utilisation seront ajoutées au flux de paiement.
                      </p>
                      <button
                        type="button"
                        onClick={resetSetup}
                        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-[#0A8B46] shadow-lg transition active:scale-[0.98]"
                      >
                        Terminer
                      </button>
                    </div>
                  )}

                  {cameraError && (
                    <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-red-600">
                      {cameraError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </section>
      </main>
      <PinVerification
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={handlePinSuccess}
        purpose="facepaie"
      />
    </>
  );
}
