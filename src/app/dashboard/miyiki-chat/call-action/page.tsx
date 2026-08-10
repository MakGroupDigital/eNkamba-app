"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

import { db } from "@/lib/firebase";

function CallActionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const action = searchParams?.get("action") || "";
    const callId = searchParams?.get("callId") || "";
    const conversationId = searchParams?.get("conversationId") || "";
    const callType = searchParams?.get("callType") === "audio" ? "audiocall" : "call";

    async function handleAction() {
      if (action === "decline" && callId) {
        await updateDoc(doc(db, "calls", callId), {
          status: "missed",
          endedAt: serverTimestamp(),
          webDeclinedAt: serverTimestamp(),
        } as any).catch(() => undefined);

        router.replace(conversationId ? `/dashboard/miyiki-chat/${conversationId}` : "/dashboard/miyiki-chat");
        return;
      }

      if (callId && conversationId) {
        router.replace(`/dashboard/miyiki-chat/${callType}/${conversationId}?callId=${callId}&webAccepted=1`);
        return;
      }

      router.replace("/dashboard/miyiki-chat");
    }

    void handleAction();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary text-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-sm font-medium text-white/80">Traitement de l'appel...</p>
      </div>
    </main>
  );
}

export default function CallActionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-primary text-white">
          <Loader2 className="h-7 w-7 animate-spin" />
        </main>
      }
    >
      <CallActionClient />
    </Suspense>
  );
}
