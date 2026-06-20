'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

const MODULE_BY_PATH: Array<[string, string]> = [
  ['/admin/infrastructure', 'Admin Infrastructure'],
  ['/admin/logs', 'Admin Logs'],
  ['/admin/cyber', 'Admin Cyber'],
  ['/admin/attacks', 'Admin Attacks'],
  ['/admin/reports', 'Admin Reports'],
  ['/admin', 'Admin'],
  ['/dashboard/miyiki-chat', 'Masolo'],
  ['/dashboard/nkampa', 'Nkampa'],
  ['/dashboard/ugavi', 'Ugavi'],
  ['/dashboard/makutano', 'Makutano'],
  ['/dashboard/estream', 'eStream'],
  ['/dashboard/ai', 'Miyiki AI'],
  ['/dashboard/mbongo-dashboard', 'Mbongo'],
  ['/dashboard/wallet', 'Mbongo'],
  ['/dashboard/pay-receive', 'Mbongo'],
  ['/dashboard/send', 'Mbongo'],
  ['/dashboard/scanner', 'Mbongo'],
  ['/dashboard/settings', 'Parametres'],
  ['/dashboard/business-pro', 'Business Pro'],
];

function resolveModule(pathname: string) {
  return MODULE_BY_PATH.find(([prefix]) => pathname.startsWith(prefix))?.[1] || 'Dashboard';
}

function classifySecuritySignal(pathname: string) {
  if (pathname.includes('..') || pathname.includes('%2e%2e')) return 'Path traversal';
  if (/[<>{}]/.test(pathname)) return 'Injection URL';
  if (pathname.toLowerCase().includes('admin') && !pathname.startsWith('/admin')) return 'Admin probing';
  return null;
}

export function AdminTelemetryAgent() {
  const pathname = usePathname() || '/dashboard';
  const { user } = useAuth();
  const [clientContext, setClientContext] = useState<Record<string, any> | null>(null);
  const activeVisitRef = useRef<{ id: string; startedAt: number; path: string } | null>(null);

  const moduleName = useMemo(() => resolveModule(pathname), [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const response = await fetch('/api/admin/client-context/', { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled) setClientContext(data);
      } catch {
        if (!cancelled) {
          setClientContext({
            ip: 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          });
        }
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !clientContext) return;
    const currentUser = user;
    const context = clientContext;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function closePreviousVisit() {
      const currentVisit = activeVisitRef.current;
      if (!currentVisit) return;
      const durationMs = Date.now() - currentVisit.startedAt;
      try {
        await updateDoc(doc(db, 'admin_user_activity', currentVisit.id), {
          active: false,
          exitedAt: serverTimestamp(),
          durationMs,
          durationSeconds: Math.round(durationMs / 1000),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Telemetry must never block navigation.
      }
    }

    async function openVisit() {
      await closePreviousVisit();
      if (cancelled) return;

      try {
        const startedAt = Date.now();
        const activityRef = await addDoc(collection(db, 'admin_user_activity'), {
          userId: currentUser.uid,
          userEmail: currentUser.email || null,
          userName: currentUser.displayName || null,
          module: moduleName,
          page: document.title || pathname,
          path: pathname,
          ip: context.ip || 'unknown',
          city: context.city || null,
          region: context.region || null,
          country: context.country || null,
          latitude: context.latitude || null,
          longitude: context.longitude || null,
          userAgent: context.userAgent || navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          active: true,
          durationMs: 0,
          durationSeconds: 0,
          enteredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        activeVisitRef.current = { id: activityRef.id, startedAt, path: pathname };

        const signal = classifySecuritySignal(pathname);
        if (signal) {
          await addDoc(collection(db, 'admin_security_events'), {
            type: signal,
            severity: 'high',
            module: moduleName,
            path: pathname,
            userId: currentUser.uid,
            userEmail: currentUser.email || null,
            ip: context.ip || 'unknown',
            location: [context.city, context.country].filter(Boolean).join(', ') || null,
            userAgent: context.userAgent || navigator.userAgent,
            recommendation: 'Verifier les parametres de route et bloquer les motifs URL suspects au niveau middleware/WAF.',
            createdAt: serverTimestamp(),
          });
        }

        intervalId = setInterval(() => {
          const currentVisit = activeVisitRef.current;
          if (!currentVisit || currentVisit.path !== pathname) return;
          const durationMs = Date.now() - currentVisit.startedAt;
          void updateDoc(doc(db, 'admin_user_activity', currentVisit.id), {
            durationMs,
            durationSeconds: Math.round(durationMs / 1000),
            updatedAt: serverTimestamp(),
          }).catch(() => undefined);
        }, 15000);
      } catch {
        // Firestore rules may disable telemetry in some environments.
      }
    }

    openVisit();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      void closePreviousVisit();
    };
  }, [clientContext, moduleName, pathname, user]);

  useEffect(() => {
    if (!user || !clientContext) return;

    const writeError = (payload: {
      message: string;
      stack?: string;
      source?: string;
      line?: number;
      column?: number;
      type: string;
    }) => {
      void addDoc(collection(db, 'admin_error_logs'), {
        ...payload,
        severity: payload.type === 'unhandledrejection' ? 'critical' : 'error',
        module: resolveModule(window.location.pathname),
        page: document.title || window.location.pathname,
        path: window.location.pathname,
        userId: user.uid,
        userEmail: user.email || null,
        userName: user.displayName || null,
        ip: clientContext.ip || 'unknown',
        location: [clientContext.city, clientContext.country].filter(Boolean).join(', ') || null,
        userAgent: clientContext.userAgent || navigator.userAgent,
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    };

    const onError = (event: ErrorEvent) => {
      writeError({
        type: 'error',
        message: event.message || 'Erreur JavaScript inconnue',
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      writeError({
        type: 'unhandledrejection',
        message: reason?.message || String(reason || 'Promise rejetee sans detail'),
        stack: reason?.stack,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [clientContext, user]);

  return null;
}
