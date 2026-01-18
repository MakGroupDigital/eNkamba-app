'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  History as HistoryIcon, 
  ArrowLeft, 
  Search, 
  Filter, 
  Download,
  ArrowUp,
  ArrowDown,
  Send,
  Receipt,
  QrCode,
  Wallet,
  ArrowRightLeft,
  Calendar,
  ChevronDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TransactionType = 'deposit' | 'payment' | 'transfer' | 'withdrawal' | 'conversion' | 'all';
type Currency = 'CDF' | 'USD' | 'EUR' | 'all';

interface Transaction {
  id: string;
  type: TransactionType;
  source: string;
  amount: string;
  currency: 'CDF' | 'USD' | 'EUR';
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    source: 'Salaire',
    amount: '3,750,000.00',
    currency: 'CDF',
    date: "Aujourd'hui",
    time: '10:30',
    status: 'completed',
    reference: 'REF-2024-001',
  },
  {
    id: '2',
    type: 'payment',
    source: 'Achat Nkampa - Commande #1234',
    amount: '113,750.00',
    currency: 'CDF',
    date: 'Hier',
    time: '14:45',
    status: 'completed',
    reference: 'REF-2024-002',
  },
  {
    id: '3',
    type: 'transfer',
    source: 'Transfert à J. Doe',
    amount: '250,000.00',
    currency: 'CDF',
    date: '15/05/2024',
    time: '09:15',
    status: 'completed',
    reference: 'REF-2024-003',
  },
  {
    id: '4',
    type: 'withdrawal',
    source: 'Retrait Agent - Point Kinshasa',
    amount: '500,000.00',
    currency: 'CDF',
    date: '14/05/2024',
    time: '16:20',
    status: 'completed',
    reference: 'REF-2024-004',
  },
  {
    id: '5',
    type: 'conversion',
    source: 'Conversion USD → CDF',
    amount: '2,850,000.00',
    currency: 'CDF',
    date: '13/05/2024',
    time: '11:30',
    status: 'completed',
    reference: 'REF-2024-005',
  },
  {
    id: '6',
    type: 'payment',
    source: 'Facture Regideso',
    amount: '45,000.00',
    currency: 'CDF',
    date: '12/05/2024',
    time: '08:00',
    status: 'completed',
    reference: 'REF-2024-006',
  },
  {
    id: '7',
    type: 'deposit',
    source: 'Bonus de Parrainage',
    amount: '50,000.00',
    currency: 'CDF',
    date: '11/05/2024',
    time: '15:45',
    status: 'completed',
    reference: 'REF-2024-007',
  },
  {
    id: '8',
    type: 'transfer',
    source: 'Envoi vers Airtel Money',
    amount: '150,000.00',
    currency: 'CDF',
    date: '10/05/2024',
    time: '13:20',
    status: 'pending',
    reference: 'REF-2024-008',
  },
];

const getTransactionIcon = (type: TransactionType) => {
  switch (type) {
    case 'deposit':
      return <ArrowDown className="h-5 w-5 text-green-500" />;
    case 'payment':
      return <Receipt className="h-5 w-5 text-blue-500" />;
    case 'transfer':
      return <Send className="h-5 w-5 text-orange-500" />;
    case 'withdrawal':
      return <ArrowUp className="h-5 w-5 text-red-500" />;
    case 'conversion':
      return <ArrowRightLeft className="h-5 w-5 text-purple-500" />;
    default:
      return <Wallet className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: Transaction['status']) => {
  const variants: Record<typeof status, { label: string; className: string }> = {
    completed: { label: 'Terminé', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    failed: { label: 'Échoué', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  };
  const { label, className } = variants[status];
  return <Badge className={className}>{label}</Badge>;
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [currencyFilter, setCurrencyFilter] = useState<Currency>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = tx.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCurrency = currencyFilter === 'all' || tx.currency === currencyFilter;
    const matchesDate = dateFilter === 'all' || tx.date.includes(dateFilter);
    
    return matchesSearch && matchesType && matchesCurrency && matchesDate;
  });

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-xl font-bold text-primary">
              Historique des Transactions
            </h1>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </header>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType)}>
              <SelectTrigger>
                <SelectValue placeholder="Type de transaction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="deposit">Dépôt</SelectItem>
                <SelectItem value="payment">Paiement</SelectItem>
                <SelectItem value="transfer">Transfert</SelectItem>
                <SelectItem value="withdrawal">Retrait</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
              </SelectContent>
            </Select>

            {/* Currency Filter */}
            <Select value={currencyFilter} onValueChange={(value) => setCurrencyFilter(value as Currency)}>
              <SelectTrigger>
                <SelectValue placeholder="Devise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les devises</SelectItem>
                <SelectItem value="CDF">CDF</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute la période</SelectItem>
                <SelectItem value="Aujourd'hui">Aujourd'hui</SelectItem>
                <SelectItem value="Hier">Hier</SelectItem>
                <SelectItem value="05/2024">Mai 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune transaction trouvée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer",
                    tx.status === 'pending' && 'bg-yellow-50/50 dark:bg-yellow-900/10',
                    tx.status === 'failed' && 'bg-red-50/50 dark:bg-red-900/10'
                  )}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate">{tx.source}</p>
                      {getStatusBadge(tx.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {tx.date}
                      </span>
                      <span>{tx.time}</span>
                      <span className="font-mono text-xs">{tx.reference}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right">
                    <p className={cn(
                      "text-lg font-bold",
                      tx.type === 'deposit' || tx.type === 'conversion' ? 'text-green-600' : 'text-foreground'
                    )}>
                      {tx.type === 'deposit' || tx.type === 'conversion' ? '+' : '-'} {tx.amount} {tx.currency}
                    </p>
                    {tx.currency !== 'CDF' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈ {(parseFloat(tx.amount.replace(/,/g, '')) * (tx.currency === 'USD' ? 2500 : 3000)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
