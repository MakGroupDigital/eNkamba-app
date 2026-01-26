'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle, ArrowRight, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BillStatus = 'pending' | 'paid' | 'overdue';
type Currency = 'CDF' | 'USD' | 'EUR';

interface Bill {
  id: string;
  provider: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  status: BillStatus;
  description: string;
  icon: string;
}

const mockBills: Bill[] = [
  {
    id: '1',
    provider: 'Électricité SNEL',
    amount: 125000,
    currency: 'CDF',
    dueDate: '2026-02-05',
    status: 'pending',
    description: 'Facture électricité - Janvier 2026',
    icon: '⚡',
  },
  {
    id: '2',
    provider: 'Internet Vodacom',
    amount: 50000,
    currency: 'CDF',
    dueDate: '2026-02-10',
    status: 'pending',
    description: 'Abonnement Internet - Février 2026',
    icon: '📡',
  },
  {
    id: '3',
    provider: 'Eau REGIDESO',
    amount: 75000,
    currency: 'CDF',
    dueDate: '2026-01-20',
    status: 'overdue',
    description: 'Facture eau - Janvier 2026',
    icon: '💧',
  },
  {
    id: '4',
    provider: 'Téléphone Airtel',
    amount: 25000,
    currency: 'CDF',
    dueDate: '2026-01-15',
    status: 'paid',
    description: 'Recharge téléphone - Janvier 2026',
    icon: '📱',
  },
];

export default function BillsPage() {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedBill = selectedBillId ? bills.find(b => b.id === selectedBillId) : null;

  const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">Payée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">En attente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700">En retard</Badge>;
    }
  };

  const getStatusIcon = (status: BillStatus) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingBills = filteredBills.filter(b => b.status === 'pending');
  const paidBills = filteredBills.filter(b => b.status === 'paid');
  const overdueBills = filteredBills.filter(b => b.status === 'overdue');

  const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0);

  const handlePayBill = () => {
    if (!selectedBillId) return;

    const bill = bills.find(b => b.id === selectedBillId);
    if (!bill) return;

    // Préparer les données de paiement pour la facture
    const paymentData = {
      context: 'bills',
      amount: bill.amount,
      description: `Paiement facture: ${bill.provider}`,
      metadata: {
        billId: bill.id,
        provider: bill.provider,
        billAmount: bill.amount,
        billCurrency: bill.currency,
        dueDate: bill.dueDate,
        type: 'bill_payment'
      }
    };

    // Stocker les données
    sessionStorage.setItem('bills_payment_data', JSON.stringify(paymentData));
    
    // Rediriger vers le paiement
    window.location.href = '/dashboard/pay?context=bills';
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Mes Factures
        </h1>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending, 'CDF')}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En retard</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue, 'CDF')}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total factures</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(bills.reduce((sum, b) => sum + b.amount, 0), 'CDF')}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une facture..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bills Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Toutes ({filteredBills.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({pendingBills.length})</TabsTrigger>
          <TabsTrigger value="overdue">En retard ({overdueBills.length})</TabsTrigger>
          <TabsTrigger value="paid">Payées ({paidBills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredBills.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune facture trouvée</p>
              </CardContent>
            </Card>
          ) : (
            filteredBills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{bill.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-headline font-semibold">{bill.provider}</p>
                        {getStatusBadge(bill.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{bill.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(bill.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(bill.amount, bill.currency)}
                        </span>
                      </div>
                    </div>
                    {bill.status !== 'paid' && (
                      <Button
                        onClick={() => {
                          setSelectedBillId(bill.id);
                          setShowPayDialog(true);
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Payer <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{bill.icon}</div>
                  <div className="flex-1">
                    <p className="font-headline font-semibold">{bill.provider}</p>
                    <p className="text-sm text-muted-foreground">{bill.description}</p>
                    <p className="text-sm font-semibold mt-2">{formatCurrency(bill.amount, bill.currency)}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedBillId(bill.id);
                      setShowPayDialog(true);
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Payer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueBills.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Factures en retard</AlertTitle>
              <AlertDescription>
                Vous avez {overdueBills.length} facture(s) en retard. Veuillez les payer dès que possible.
              </AlertDescription>
            </Alert>
          )}
          {overdueBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{bill.icon}</div>
                  <div className="flex-1">
                    <p className="font-headline font-semibold">{bill.provider}</p>
                    <p className="text-sm text-muted-foreground">{bill.description}</p>
                    <p className="text-sm font-semibold mt-2 text-red-600">{formatCurrency(bill.amount, bill.currency)}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedBillId(bill.id);
                      setShowPayDialog(true);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Payer maintenant
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{bill.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-headline font-semibold">{bill.provider}</p>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">{bill.description}</p>
                    <p className="text-sm font-semibold mt-2">{formatCurrency(bill.amount, bill.currency)}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Reçu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Pay Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payer la facture</DialogTitle>
            <DialogDescription>
              Confirmez le paiement de votre facture {selectedBill?.provider}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fournisseur :</span>
                  <span className="font-semibold">{selectedBill.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Description :</span>
                  <span className="font-semibold text-sm">{selectedBill.description}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">Montant :</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedBill.amount, selectedBill.currency)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handlePayBill} disabled={isProcessing}>
              {isProcessing ? "Traitement..." : "Payer maintenant"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
