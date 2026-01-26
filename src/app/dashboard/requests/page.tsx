'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMoneyRequests } from '@/hooks/useMoneyRequests';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RequestsPage() {
  const { receivedRequests, sentRequests, isLoading, acceptRequest, rejectRequest } = useMoneyRequests();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await acceptRequest(requestId);
      toast({
        title: 'Succès',
        description: 'Demande acceptée',
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'acceptation',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await rejectRequest(requestId);
      toast({
        title: 'Succès',
        description: 'Demande refusée',
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du refus',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold"><Clock className="w-3 h-3" /> En attente</span>;
      case 'accepted':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold"><CheckCircle2 className="w-3 h-3" /> Acceptée</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold"><XCircle className="w-3 h-3" /> Refusée</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Demandes de paiement
            </h1>
            <p className="text-sm text-muted-foreground">Gérez vos demandes et paiements</p>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Reçues ({receivedRequests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Envoyées ({sentRequests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          {/* Received Requests */}
          <TabsContent value="received" className="space-y-4">
            {receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune demande reçue</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              receivedRequests.map((request) => (
                <Card key={request.id} className="border-[#32BB78]/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{request.fromUserName}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#32BB78]">
                            {request.amount.toLocaleString('fr-FR')} CDF
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.createdAt?.toDate?.() || request.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Refuser
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleAccept(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Accepter
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="pt-4 border-t">
                          <Button
                            asChild
                            className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                          >
                            <Link href="/dashboard/send">
                              Envoyer le paiement
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune demande envoyée</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sentRequests.map((request) => (
                <Card key={request.id} className="border-[#32BB78]/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{request.toUserName}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#32BB78]">
                            {request.amount.toLocaleString('fr-FR')} CDF
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.createdAt?.toDate?.() || request.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="pt-4 border-t text-sm text-muted-foreground">
                          <p>En attente de réponse...</p>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-green-600 mb-3">
                            ✓ Demande acceptée. Vous pouvez maintenant envoyer le paiement.
                          </p>
                          <Button
                            asChild
                            className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                          >
                            <Link href="/dashboard/send">
                              Envoyer le paiement
                            </Link>
                          </Button>
                        </div>
                      )}

                      {request.status === 'rejected' && (
                        <div className="pt-4 border-t text-sm text-red-600">
                          <p>✗ Demande refusée</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
