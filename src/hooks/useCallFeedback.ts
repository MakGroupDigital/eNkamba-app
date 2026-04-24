'use client';

import { useEffect, useRef } from 'react';

type FeedbackTone = 'incoming' | 'ringback';

function getTonePattern(kind: FeedbackTone) {
  return kind === 'incoming'
    ? {
        frequencies: [780, 980],
        stepMs: 420,
        pauseMs: 160,
        gain: 0.035,
      }
    : {
        frequencies: [440, 480],
        stepMs: 360,
        pauseMs: 220,
        gain: 0.025,
      };
}

export function useCallFeedback(active: boolean, kind: FeedbackTone, vibrate = false) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);
  const vibrationRef = useRef<number | null>(null);

  useEffect(() => {
    const stopAll = async () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];

      if (vibrationRef.current) {
        window.clearInterval(vibrationRef.current);
        vibrationRef.current = null;
      }

      try {
        navigator.vibrate?.(0);
      } catch {}

      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
    };

    if (!active || typeof window === 'undefined') {
      void stopAll();
      return () => {
        void stopAll();
      };
    }

    const playPattern = async () => {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch {}
      }

      const { frequencies, stepMs, pauseMs, gain } = getTonePattern(kind);

      const scheduleStep = (index = 0) => {
        if (!audioContextRef.current) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = kind === 'incoming' ? 'triangle' : 'sine';
        oscillator.frequency.value = frequencies[index % frequencies.length];
        gainNode.gain.value = gain;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + stepMs / 1000);

        const nextTimer = window.setTimeout(() => {
          scheduleStep(index + 1);
        }, stepMs + pauseMs);
        timersRef.current.push(nextTimer);
      };

      scheduleStep();
    };

    void playPattern();

    if (vibrate) {
      try {
        navigator.vibrate?.([250, 160, 250]);
      } catch {}

      vibrationRef.current = window.setInterval(() => {
        try {
          navigator.vibrate?.([250, 160, 250]);
        } catch {}
      }, 1500);

      void import('@capacitor/haptics')
        .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Heavy }))
        .catch(() => undefined);
    }

    return () => {
      void stopAll();
    };
  }, [active, kind, vibrate]);
}

