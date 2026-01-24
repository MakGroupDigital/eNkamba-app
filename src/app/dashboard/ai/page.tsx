"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Page par défaut pour /dashboard/ai
 * Redirige automatiquement vers /dashboard/ai/chat
 */
export default function AIPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/ai/chat");
  }, [router]);

  return null;
}
