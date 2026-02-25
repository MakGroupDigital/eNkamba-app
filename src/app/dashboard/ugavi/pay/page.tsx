'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedPaymentFlow } from '@/components/payment/UnifiedPaymentFlow';
import { useAuth } from '@/hooks/useAuth';

export default function UgaviPayPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <div className="container mx-auto max-w-2xl space-y-6 p-4">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/ugavi">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Paiement Logistique</h1>
            <p className="text-sm text-muted-foreground">Règlement sécurisé pour les services Ugavi</p>
          </div>
        </header>

        <UnifiedPaymentFlow
          context="ugavi"
          customLabel="Payer Ugavi"
          onSuccess={() => router.push('/dashboard/ugavi')}
          onError={(error) => {
            console.error('Erreur de paiement Ugavi:', error);
          }}
          onBack={() => router.push('/dashboard/ugavi')}
        />
      </div>
    </div>
  );
}

