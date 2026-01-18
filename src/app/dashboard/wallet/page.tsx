
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet as WalletIcon,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

const transactions = [
  {
    type: 'deposit',
    source: 'Salaire',
    amount: '+ 3,750,000.00 CDF',
    date: "Aujourd'hui",
  },
  {
    type: 'payment',
    source: 'Achat Nkampa',
    amount: '- 113,750.00 CDF',
    date: 'Hier',
  },
  {
    type: 'transfer',
    source: 'Transfert à J. Doe',
    amount: '- 250,000.00 CDF',
    date: '15/05/2024',
  },
  {
    type: 'withdrawal',
    source: 'Retrait Agent',
    amount: '- 500,000.00 CDF',
    date: '14/05/2024',
  },
];

export default function WalletPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mbongo-dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <WalletIcon className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-xl font-bold text-primary">
            Mon Portefeuille
          </h1>
        </div>
      </header>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary via-green-800 to-green-900 text-primary-foreground shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            Solde Principal
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Disponible pour toutes les transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight">4,636,250.00 CDF</p>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <p><span className="font-bold">1,854.50</span> USD</p>
            <p><span className="font-bold">1,725.00</span> EUR</p>
          </div>
          <div className="flex gap-4 mt-6">
            <Button variant="secondary" className="flex-1">
              <ArrowDown className="mr-2" /> Ajouter des fonds
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowUp className="mr-2" /> Retirer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            Transactions Récentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.map((tx, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <p className="font-semibold">{tx.source}</p>
                <p className="text-sm text-muted-foreground">{tx.date}</p>
              </div>
              <p
                className={`font-semibold ${
                  tx.type === 'deposit' ? 'text-green-500' : 'text-foreground'
                }`}
              >
                {tx.amount}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
