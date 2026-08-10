"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ENKAMBA_AUTH_SESSION_KEY, useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [canDecide, setCanDecide] = useState(false);
  const knownSession = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ENKAMBA_AUTH_SESSION_KEY) === "true";
  }, []);

  useEffect(() => {
    if (isLoading) {
      setCanDecide(false);
      return;
    }
    if (user || !knownSession) {
      setCanDecide(true);
      return;
    }

    const timeout = window.setTimeout(() => setCanDecide(true), 1600);
    return () => window.clearTimeout(timeout);
  }, [isLoading, knownSession, user]);

  useEffect(() => {
    if (isLoading || !canDecide) return;
    router.replace(user ? "/dashboard/miyiki-chat" : "/onboarding");
  }, [canDecide, isLoading, router, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary text-white">
      <Loader2 className="h-8 w-8 animate-spin" />
    </main>
  );
}
