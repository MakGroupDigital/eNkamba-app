'use client';

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { BusinessRequestData } from '@/types/business-account.types';

export default function BusinessRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<(BusinessRequestData & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<(BusinessRequestData & { id: string }) | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Charger les demandes en attente
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'business_requests'),
          where('status', '==', 'PENDING')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as (BusinessRequestData & { id: string })[];
        setRequests(data.sort((a, b) => b.submittedAt - a.submittedAt));
      } catch (error) {
        console.error('Erreur chargement demandes:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Erreur lors du chargement des demandes',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [toast]);

  const handleApprove = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const requestRef = doc(db, 'business_requests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Demande non trouvée');
      }

      const requestData = requestDoc.data();
      const userId = requestData.userId;

      // Update request status
      await updateDoc(requestRef, {
        status: 'APPROVED',
        approvedAt: new Date(),
      });

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        businessStatus: 'APPROVED',
        isBusiness: true,
        businessId: requestId,
        businessName: requestData.businessName,
        businessType: requestData.type,
        subCategory: requestData.subCategory,
        approvedAt: new Date(),
      });

      // Create notification
      const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
      await setDoc(notificationRef, {
        id: notificationRef.id,
        type: 'BUSINESS_APPROVED',
        title: 'Compte entreprise approuvé',
        message: `Félicitations! Votre compte entreprise "${requestData.businessName}" a été approuvé.`,
        businessName: requestData.businessName,
        businessType: requestData.type,
        businessId: requestId,
        icon: '🟢',
        actionUrl: '/dashboard/business-pro',
        actionLabel: 'Accéder à mon Espace Pro',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        timestamp: new Date(),
      });

      toast({
        title: 'Succès',
        description: 'Demande approuvée et notification créée',
      });

      setRequests(requests.filter(r => r.id !== requestId));
      setSelectedRequest(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'approbation',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer une raison de rejet',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const requestRef = doc(db, 'business_requests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Demande non trouvée');
      }

      const requestData = requestDoc.data();
      const userId = requestData.userId;

      // Update request status
      await updateDoc(requestRef, {
        status: 'REJECTED',
        rejectionReason: rejectionReason,
        rejectedAt: new Date(),
      });

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        businessStatus: 'REJECTED',
        rejectionReason: rejectionReason,
      });

      // Create notification
      const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
      await setDoc(notificationRef, {
        id: notificationRef.id,
        type: 'BUSINESS_REJECTED',
        title: 'Demande de compte entreprise rejetée',
        message: `Votre demande pour "${requestData.businessName}" a été rejetée. Motif: ${rejectionReason}`,
        businessName: requestData.businessName,
        rejectionReason: rejectionReason,
        icon: '🔴',
        actionUrl: '/dashboard/settings/business-account',
        actionLabel: 'Modifier et renvoyer',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        timestamp: new Date(),
      });

      toast({
        title: 'Succès',
        description: 'Demande rejetée et notification créée',
      });

      setRequests(requests.filter(r => r.id !== requestId));
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du rejet',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Demandes de Compte Entreprise</h1>
          <p className="text-muted-foreground">Gérez les demandes en attente de vérification</p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aucune demande en attente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map(request => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{request.businessName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.type} • {request.subCategory}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50">
                        <Clock size={14} className="mr-1" />
                        En attente
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Numéro d'enregistrement</p>
                      <p className="font-medium">{request.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Adresse</p>
                      <p className="font-medium">{request.city}, {request.country}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium break-all">{request.contactEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{request.contactPhone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.businessName}</DialogTitle>
              <DialogDescription>
                Demande soumise le {selectedRequest && new Date(selectedRequest.submittedAt).toLocaleDateString('fr-FR')}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                {/* Business Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Informations de l'entreprise</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{selectedRequest.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sous-catégorie</p>
                      <p className="font-medium">{selectedRequest.subCategory}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Numéro d'enregistrement</p>
                      <p className="font-medium">{selectedRequest.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Adresse</p>
                      <p className="font-medium">{selectedRequest.address}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ville</p>
                      <p className="font-medium">{selectedRequest.city}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pays</p>
                      <p className="font-medium">{selectedRequest.country}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Informations de contact</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium break-all">{selectedRequest.contactEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{selectedRequest.contactPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Payment-specific */}
                {selectedRequest.type === 'PAYMENT' && selectedRequest.apiCallbackUrl && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Configuration API</h3>
                    <div className="text-sm">
                      <p className="text-muted-foreground">URL de callback</p>
                      <p className="font-medium break-all">{selectedRequest.apiCallbackUrl}</p>
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Documents</h3>
                  <div className="space-y-2">
                    {selectedRequest.documents.idCard && (
                      <a
                        href={selectedRequest.documents.idCard}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        📄 Pièce d'identité
                      </a>
                    )}
                    {selectedRequest.documents.taxDocument && (
                      <a
                        href={selectedRequest.documents.taxDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        📄 Document fiscal
                      </a>
                    )}
                    {selectedRequest.documents.businessLicense && (
                      <a
                        href={selectedRequest.documents.businessLicense}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        📄 Licence commerciale
                      </a>
                    )}
                    {selectedRequest.documents.bankStatement && (
                      <a
                        href={selectedRequest.documents.bankStatement}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        📄 Relevé bancaire
                      </a>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Raison du rejet (si applicable)</h3>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Entrez la raison du rejet..."
                    disabled={isProcessing}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2" size={16} />
                        Rejeter
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2" size={16} />
                        Approuver
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
