'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const DEFAULT_APP_ROUTE = '/dashboard/miyiki-chat';

export default function HubPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(DEFAULT_APP_ROUTE);
  }, [router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Ouverture de la messagerie...</p>
      </div>
    </div>
  );
}
