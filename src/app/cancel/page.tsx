'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, Home, ArrowLeft } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-red-50 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-red-600">Paiement annulé</h2>
            
            <p className="text-sm text-muted-foreground text-center">
              Votre paiement a été annulé. Aucun montant n'a été débité.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full mt-4">
              <p className="text-sm text-center text-red-800">
                Si vous avez rencontré un problème, veuillez réessayer ou contacter notre support.
              </p>
            </div>

            <div className="flex gap-3 w-full mt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/add-funds')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-[#25543A] hover:bg-[#25543A]"
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
