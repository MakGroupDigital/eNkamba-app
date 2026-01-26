'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { UnifiedPaymentFlow } from '@/components/payment/UnifiedPaymentFlow';
import { useAuth } from '@/hooks/useAuth';

export default function PayPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Payer
            </h1>
            <p className="text-sm text-muted-foreground">Utilisez le portefeuille unifié</p>
          </div>
        </header>

        {/* Unified Payment Flow */}
        <UnifiedPaymentFlow
          context="wallet"
          customLabel="Payer"
          onSuccess={(transactionId) => {
            setTimeout(() => {
              router.push('/dashboard/wallet');
            }, 2000);
          }}
          onError={(error) => {
            console.error('Erreur de paiement:', error);
          }}
          onBack={() => router.back()}
        />
      </div>
    </div>
  );
}
