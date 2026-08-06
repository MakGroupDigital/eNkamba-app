"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? "/dashboard/miyiki-chat" : "/onboarding");
  }, [isLoading, router, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary text-white">
      <Loader2 className="h-8 w-8 animate-spin" />
    </main>
  );
}
