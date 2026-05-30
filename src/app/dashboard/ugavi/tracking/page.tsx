'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Package, Search, AlertCircle, CheckCircle, Clock, MapPin, Download, ReceiptText, ScanLine, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { appendUgaviStatus, UGAVI_PRIMARY_FLOW, UGAVI_STATUS_LABELS, UGAVI_TRACKING_STATUS_MAP, type UgaviLogisticsStatus } from '@/lib/ugavi-requests';

interface TrackingInfo {
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  sender: string;
  recipient: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  lastUpdate: string;
  totalAmount?: number;
  transactionId?: string;
  serviceMode?: string;
  currentPosition?: string;
  packageDescription?: string;
  packageWeight?: number;
  declaredValue?: number;
  transportLabel?: string;
  agencyName?: string;
  courierName?: string;
  recipientPhone?: string;
  paymentLabel?: string;
  proofLabel?: string;
  requestId?: string;
  logisticsStatus?: UgaviLogisticsStatus;
  events: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    actor?: string;
  }>;
}

export default function UgaviTrackingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hasAutoSearched = useRef(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const scannerFrameRef = useRef<number | null>(null);

  const downloadUgaviReceipt = () => {
    if (!trackingInfo) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Recu Ugavi</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; padding: 24px; color: #0f172a; }
          .hero { background: linear-gradient(135deg, #0E7A52, #F28C28); color: white; padding: 28px; border-radius: 20px 20px 0 0; }
          .content { border: 1px solid #dbe4ea; border-top: none; padding: 24px; border-radius: 0 0 20px 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
          .item { background: #f8fafc; border-radius: 14px; padding: 14px; }
          .label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
          .value { font-weight: 700; }
          .timeline { margin-top: 20px; }
          .timeline-item { border-left: 3px solid #0E7A52; padding: 0 0 14px 14px; margin-left: 6px; }
        </style>
      </head>
      <body>
        <div class="hero">
          <h1>eNkamba Ugavi</h1>
          <p>Recu de demande logistique</p>
          <p><strong>${trackingInfo.trackingNumber}</strong></p>
        </div>
        <div class="content">
          <div class="grid">
            <div class="item"><div class="label">Expediteur</div><div class="value">${trackingInfo.sender}</div></div>
            <div class="item"><div class="label">Destinataire</div><div class="value">${trackingInfo.recipient}</div></div>
            <div class="item"><div class="label">Origine</div><div class="value">${trackingInfo.origin}</div></div>
            <div class="item"><div class="label">Destination</div><div class="value">${trackingInfo.destination}</div></div>
            <div class="item"><div class="label">Statut</div><div class="value">${getStatusLabel(trackingInfo.status)}</div></div>
            <div class="item"><div class="label">Montant</div><div class="value">${(trackingInfo.totalAmount || 0).toLocaleString('fr-FR')} CDF</div></div>
          </div>
          <div class="timeline">
            ${trackingInfo.events.map((event) => `
              <div class="timeline-item">
                <div class="label">${event.date} ${event.time}</div>
                <div class="value">${event.status}</div>
                <div>${event.location}${event.actor ? ` · ${event.actor}` : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recu-ugavi-${trackingInfo.trackingNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSearch = useCallback(async (numberOverride?: string) => {
    const numberToSearch = (numberOverride ?? trackingNumber).trim();
    if (!numberToSearch) {
      setSearchError('Veuillez entrer un numéro de suivi');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const { db } = await import('@/lib/firebase');
      const { collection, query, where, getDocs, doc: docRef, getDoc } = await import('firebase/firestore');

      const ugaviRequestsRef = collection(db, 'ugaviRequests');
      const ugaviQuery = query(ugaviRequestsRef, where('trackingNumber', '==', numberToSearch));
      const ugaviSnapshot = await getDocs(ugaviQuery);

      if (!ugaviSnapshot.empty) {
        const ugaviDoc = ugaviSnapshot.docs[0];
        const ugaviData = ugaviDoc.data();
        const requestUserDoc = ugaviData.userId ? await getDoc(docRef(db, 'users', ugaviData.userId)) : null;
        const requestUserData = requestUserDoc?.exists() ? requestUserDoc.data() : null;
        const history = Array.isArray(ugaviData.statusHistory) ? ugaviData.statusHistory : [];
        const events =
          history.length > 0
            ? history
                .map((entry: any) => {
                  const eventDate = entry.createdAtIso ? new Date(entry.createdAtIso) : new Date();
                  return {
                    date: eventDate.toLocaleDateString('fr-FR'),
                    time: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    status: entry.label || 'Mise a jour',
                    location: entry.location || 'Ugavi',
                    actor: entry.actor || undefined,
                  };
                })
                .reverse()
            : [
                {
                  date: new Date().toLocaleDateString('fr-FR'),
                  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  status: 'Demande creee',
                  location: ugaviData.senderAddress || 'Point de depart',
                  actor: ugaviData.senderName || undefined,
                },
              ];

        const logisticsStatus = (ugaviData.logisticsStatus || ugaviData.status || 'draft') as UgaviLogisticsStatus;

        const trackingData: TrackingInfo = {
          trackingNumber: numberToSearch,
          status: UGAVI_TRACKING_STATUS_MAP[logisticsStatus] || 'pending',
          sender: requestUserData?.fullName || requestUserData?.displayName || ugaviData.senderName || 'Expediteur',
          recipient: ugaviData.receiverName || 'Destinataire',
          origin: ugaviData.senderAddress || 'Origine',
          destination: ugaviData.receiverAddress || 'Destination',
          estimatedDelivery: ugaviData.eta || 'Selon trajet',
          lastUpdate: (ugaviData.updatedAt?.toDate?.() || new Date()).toLocaleString('fr-FR'),
          totalAmount: ugaviData.totalAmount || 0,
          transactionId: ugaviData.transactionId || '',
          serviceMode: ugaviData.serviceMode || '',
          currentPosition: events[0]?.location || ugaviData.currentLocation || ugaviData.senderAddress || 'Position en cours de mise a jour',
          packageDescription: ugaviData.description || ugaviData.packageType || 'Colis Ugavi',
          packageWeight: Number(ugaviData.packageWeight || 0),
          declaredValue: Number(ugaviData.declaredValue || ugaviData.packageValue || 0),
          transportLabel:
            ugaviData.internationalShipment?.transportLabel ||
            ugaviData.nationalShipment?.transportLabel ||
            ugaviData.relayShipment?.serviceLabel ||
            ugaviData.selectedCourier?.locomotion ||
            ugaviData.serviceMode ||
            'Ugavi',
          agencyName: ugaviData.selectedAgency?.name || ugaviData.agencyName || '',
          courierName: ugaviData.selectedCourier?.name || '',
          recipientPhone: ugaviData.receiverPhone || '',
          paymentLabel: ugaviData.paymentStatus === 'completed' ? 'Payé' : ugaviData.paymentStatus === 'cash_on_delivery' ? 'A la livraison' : 'En attente',
          proofLabel: ugaviData.deliveryProof?.type || ugaviData.proofOfDelivery ? 'Preuve de livraison disponible' : 'Preuve attendue a la livraison',
          requestId: ugaviDoc.id,
          logisticsStatus,
          events,
        };

        setTrackingInfo(trackingData);
        toast({
          title: 'Suivi Ugavi trouve',
          description: `Reference: ${numberToSearch}`,
        });
        return;
      }

      const ordersRef = collection(db, 'nkampa_orders');
      const q = query(ordersRef, where('trackingNumber', '==', numberToSearch));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchError('Aucune commande trouvée avec ce numéro de suivi');
        toast({
          variant: 'destructive',
          title: 'Colis introuvable',
          description: 'Vérifiez le numéro de suivi et réessayez',
        });
        return;
      }

      const orderDoc = querySnapshot.docs[0];
      const orderData = orderDoc.data();
      const sellerDoc = await getDoc(docRef(db, 'users', orderData.sellerId));
      const sellerData = sellerDoc.exists() ? sellerDoc.data() : null;
      const buyerDoc = await getDoc(docRef(db, 'users', orderData.buyerId));
      const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;

      const statusMap: Record<string, 'pending' | 'in_transit' | 'delivered' | 'failed'> = {
        pending: 'pending',
        paid: 'in_transit',
        processing: 'in_transit',
        shipped: 'in_transit',
        delivered: 'delivered',
        cancelled: 'failed',
      };

      const createdDate = orderData.createdAt?.toDate?.() || new Date();
      const events = [
        {
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Commande créée',
          location: sellerData?.location || 'Boutique Nkampa',
        },
      ];

      if (['paid', 'processing', 'shipped', 'delivered'].includes(orderData.status)) {
        events.push({
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Paiement confirmé',
          location: 'eNkambaPay',
        });
      }

      if (orderData.pickupRoute?.enabled) {
        events.push({
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Itinéraire boutique disponible',
          location: orderData.pickupRoute.storeLocationLabel || 'Boutique',
        });
      }

      if (['shipped', 'delivered'].includes(orderData.status)) {
        const shippedDate = orderData.shippedAt?.toDate?.() || orderData.updatedAt?.toDate?.() || new Date();
        events.push({
          date: shippedDate.toLocaleDateString('fr-FR'),
          time: shippedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Colis expédié',
          location: sellerData?.location || 'Kinshasa',
        });
      }

      if (orderData.status === 'delivered') {
        const deliveredDate = orderData.deliveredAt?.toDate?.() || orderData.updatedAt?.toDate?.() || new Date();
        events.push({
          date: deliveredDate.toLocaleDateString('fr-FR'),
          time: deliveredDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Colis livré',
          location: orderData.shippingAddress || orderData.pickupRoute?.storeLocationLabel || 'Destination',
        });
      }

      const estimatedDelivery = new Date(createdDate);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + (orderData.pickupRoute?.enabled ? 1 : 4));

      const trackingData: TrackingInfo = {
        trackingNumber: numberToSearch,
        status: statusMap[orderData.status] || 'pending',
        sender: sellerData?.fullName || sellerData?.displayName || orderData.sellerName || 'Vendeur',
        recipient: buyerData?.fullName || buyerData?.displayName || orderData.buyerName || 'Client',
        origin: sellerData?.location || orderData.pickupRoute?.storeLocationLabel || 'Kinshasa',
        destination: orderData.shippingAddress || orderData.pickupRoute?.storeLocationLabel || 'Destination',
        estimatedDelivery: estimatedDelivery.toLocaleDateString('fr-FR'),
        lastUpdate: (orderData.updatedAt?.toDate?.() || new Date()).toLocaleString('fr-FR'),
        currentPosition: events[0]?.location || orderData.shippingAddress || 'Position en cours de mise a jour',
        packageDescription: orderData.items?.[0]?.name || orderData.description || 'Commande Nkampa',
        packageWeight: Number(orderData.packageWeight || 0),
        transportLabel: orderData.pickupRoute?.enabled ? 'Retrait boutique' : 'Livraison',
        agencyName: orderData.pickupRoute?.storeLocationLabel || sellerData?.businessName || '',
        recipientPhone: buyerData?.phoneNumber || orderData.buyerPhone || '',
        paymentLabel: orderData.paymentStatus === 'paid' || orderData.status === 'paid' ? 'Payé' : 'Selon commande',
        proofLabel: orderData.status === 'delivered' ? 'Livraison confirmee' : 'Preuve attendue a la livraison',
        events: events.reverse(),
      };

      setTrackingInfo(trackingData);
      toast({
        title: 'Colis trouvé ✅',
        description: `Numéro de suivi: ${numberToSearch}`,
      });
    } catch (error) {
      console.error('Erreur recherche suivi Ugavi:', error);
      setSearchError('Erreur lors de la recherche. Veuillez réessayer.');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de trouver le colis',
      });
    } finally {
      setIsSearching(false);
    }
  }, [trackingNumber, toast]);

  const stopScanner = useCallback(() => {
    if (scannerFrameRef.current !== null) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }
    scannerStreamRef.current?.getTracks().forEach((track) => track.stop());
    scannerStreamRef.current = null;
    setIsScannerReady(false);
  }, []);

  const handleScannedCode = useCallback((code: string) => {
    const scannedCode = code.trim();
    if (!scannedCode) return;
    stopScanner();
    setIsScannerOpen(false);
    setTrackingNumber(scannedCode);
    setSearchError(null);
    void handleSearch(scannedCode);
  }, [handleSearch, stopScanner]);

  const startScanner = useCallback(async () => {
    setScannerError(null);
    setIsScannerReady(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera indisponible sur cet appareil.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      scannerStreamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setIsScannerReady(true);

      const scanFrame = async () => {
        const currentVideo = videoRef.current;
        const canvas = canvasRef.current;
        if (!currentVideo || !canvas || currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          scannerFrameRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        canvas.width = currentVideo.videoWidth;
        canvas.height = currentVideo.videoHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          scannerFrameRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);

        try {
          const BarcodeDetectorCtor = (window as any).BarcodeDetector;
          if (BarcodeDetectorCtor) {
            const detector = new BarcodeDetectorCtor({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] });
            const codes = await detector.detect(canvas);
            const rawValue = codes?.[0]?.rawValue;
            if (rawValue) {
              handleScannedCode(rawValue);
              return;
            }
          } else {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const jsQR = (await import('jsqr')).default;
            const result = jsQR(imageData.data, imageData.width, imageData.height);
            if (result?.data) {
              handleScannedCode(result.data);
              return;
            }
          }
        } catch (error) {
          console.error('Erreur scan code colis:', error);
        }

        scannerFrameRef.current = requestAnimationFrame(scanFrame);
      };

      scannerFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (error: any) {
      console.error('Erreur ouverture scanner:', error);
      setScannerError(error?.message || 'Impossible d ouvrir la camera.');
      stopScanner();
    }
  }, [handleScannedCode, stopScanner]);

  useEffect(() => {
    if (!isScannerOpen) {
      stopScanner();
      return;
    }

    void startScanner();
    return () => stopScanner();
  }, [isScannerOpen, startScanner, stopScanner]);

  const moveUgaviStatus = async (nextStatus: UgaviLogisticsStatus) => {
    if (!trackingInfo?.requestId || !trackingInfo.logisticsStatus || !user) return;

    setIsUpdatingStatus(true);
    try {
      const actorName = user.displayName || user.email || 'Operateur';
      const location =
        nextStatus === 'delivered'
          ? trackingInfo.destination
          : nextStatus === 'arrived_depot'
            ? 'Depot Ugavi'
            : nextStatus === 'out_for_delivery'
              ? 'Zone de livraison'
              : trackingInfo.origin;

      await appendUgaviStatus(trackingInfo.requestId, nextStatus, actorName, location);
      await handleSearch(trackingInfo.trackingNumber);
      toast({
        title: 'Statut mis a jour',
        description: UGAVI_STATUS_LABELS[nextStatus],
      });
    } catch (error) {
      console.error('Erreur mise a jour statut Ugavi:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre a jour le statut',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const prefilledTracking = (searchParams?.get('tracking') || '').trim();
    if (!prefilledTracking || hasAutoSearched.current) return;
    hasAutoSearched.current = true;
    setTrackingNumber(prefilledTracking);
    void handleSearch(prefilledTracking);
  }, [searchParams, handleSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'in_transit':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Package className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Livré';
      case 'in_transit':
        return 'En transit';
      case 'failed':
        return 'Problème de livraison';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  };

  const progressSteps = [
    { key: 'registered', label: 'Enregistré' },
    { key: 'assigned', label: 'Ramassé' },
    { key: 'in_transit', label: 'En transit' },
    { key: 'arrived_depot', label: 'Arrivé' },
    { key: 'delivered', label: 'Livré' },
  ];

  const activeProgressIndex = Math.max(
    0,
    progressSteps.findIndex((step) => step.key === trackingInfo?.logisticsStatus)
  );

  return (
    <div className="container mx-auto flex min-h-screen max-w-2xl flex-col bg-muted/20 p-4">
      <header className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ugavi">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="flex-1 text-2xl font-bold text-primary">Suivi de Colis Ugavi</h1>
      </header>

      {!trackingInfo && (
        <Card className="mb-6">
          <CardContent className="space-y-4 p-6">
            <div>
              <Label htmlFor="tracking" className="text-base font-semibold">
                Numéro de Suivi
              </Label>
              <p className="mt-1 text-sm text-gray-600">Entrez le numéro de suivi de votre colis</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <Input
                id="tracking"
                placeholder="Ex: ENK-2026-001234"
                value={trackingNumber}
                onChange={(e) => {
                  setTrackingNumber(e.target.value);
                  setSearchError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleSearch();
                  }
                }}
                className="h-12 text-base"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsScannerOpen(true)}
                className="h-12 px-4"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scanner QR / Code-barres
              </Button>
              <Button
                onClick={() => void handleSearch()}
                disabled={isSearching || !trackingNumber.trim()}
                className="h-12 bg-primary px-6 text-white hover:bg-primary/90"
              >
                {isSearching ? (
                  <>Recherche...</>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>

            {searchError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Scanner colis</p>
                <p className="text-xs text-slate-500">QR code ou code-barres du reçu / colis</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  stopScanner();
                  setIsScannerOpen(false);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-3 p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-950">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
                <div className="pointer-events-none absolute left-12 right-12 top-1/2 h-0.5 bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.95)]" />
                {!isScannerReady && !scannerError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-sm font-semibold text-white">
                    Ouverture de la camera...
                  </div>
                )}
              </div>

              {scannerError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Scanner indisponible</AlertTitle>
                  <AlertDescription>{scannerError}</AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-slate-500">
                Le scan remplit automatiquement le numéro de suivi et lance la recherche. Seules les informations autorisées du colis sont affichées.
              </p>
            </div>
          </div>
        </div>
      )}

      {trackingInfo && (
        <div className="flex-1 space-y-6">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(trackingInfo.status)}
                  <div>
                    <p className="text-sm text-gray-600">État du colis</p>
                    <p className="text-2xl font-bold text-gray-900">{getStatusLabel(trackingInfo.status)}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Numéro de suivi: <span className="font-mono font-semibold">{trackingInfo.trackingNumber}</span>
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/80 p-3">
                  <p className="text-xs text-gray-600">Position actuelle</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{trackingInfo.currentPosition || trackingInfo.origin}</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3">
                  <p className="text-xs text-gray-600">Transport</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{trackingInfo.transportLabel || trackingInfo.serviceMode || 'Ugavi'}</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3">
                  <p className="text-xs text-gray-600">Dernière mise à jour</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{trackingInfo.lastUpdate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Progression du colis</h3>
                  <p className="text-sm text-gray-600">{trackingInfo.origin} → {trackingInfo.destination}</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {progressSteps.map((step, index) => {
                  const isDone = index <= activeProgressIndex || trackingInfo.status === 'delivered';
                  return (
                    <div key={step.key} className="min-w-0">
                      <div className={`h-2 rounded-full ${isDone ? 'bg-primary' : 'bg-slate-200'}`} />
                      <p className={`mt-2 truncate text-[11px] font-semibold ${isDone ? 'text-primary' : 'text-slate-500'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Journal Ugavi</h3>
                  <p className="text-sm text-gray-600">Trace de paiement et progression logistique</p>
                </div>
                <Button variant="outline" onClick={downloadUgaviReceipt}>
                  <Download className="mr-2 h-4 w-4" />
                  Recu
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-600">Service</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.serviceMode || 'Ugavi'}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Montant</p>
                  <p className="font-semibold text-gray-900">{(trackingInfo.totalAmount || 0).toLocaleString('fr-FR')} CDF</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Paiement</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.paymentLabel || 'Selon dossier'}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Preuve livraison</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.proofLabel || 'A confirmer à la livraison'}</p>
                </div>
              </div>

              {trackingInfo.transactionId && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-xs text-gray-600">Transaction</p>
                  <p className="font-mono text-sm font-semibold text-slate-900">{trackingInfo.transactionId}</p>
                </div>
              )}

              {trackingInfo.requestId && trackingInfo.logisticsStatus && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs text-gray-600">Progression logistique</p>
                  <div className="flex flex-wrap gap-2">
                    {UGAVI_PRIMARY_FLOW.map((statusCode) => (
                      <Button
                        key={statusCode}
                        type="button"
                        size="sm"
                        variant={trackingInfo.logisticsStatus === statusCode ? 'default' : 'outline'}
                        className="rounded-full"
                        disabled={isUpdatingStatus}
                        onClick={() => void moveUgaviStatus(statusCode)}
                      >
                        {UGAVI_STATUS_LABELS[statusCode]}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full border-orange-200 text-orange-700"
                      disabled={isUpdatingStatus}
                      onClick={() => void moveUgaviStatus('returned')}
                    >
                      Retour
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full border-red-200 text-red-700"
                      disabled={isUpdatingStatus}
                      onClick={() => void moveUgaviStatus('blocked')}
                    >
                      Bloque
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-lg font-semibold">Informations de Livraison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-600">Expéditeur</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.sender}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Destinataire</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.recipient}</p>
                  {trackingInfo.recipientPhone && <p className="text-xs text-gray-500">{trackingInfo.recipientPhone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-600">Origine</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-gray-900">{trackingInfo.origin}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Destination</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-gray-900">{trackingInfo.destination}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-600">Colis</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.packageDescription || 'Colis'}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Poids / valeur</p>
                  <p className="font-semibold text-gray-900">
                    {trackingInfo.packageWeight ? `${trackingInfo.packageWeight} kg` : 'Non renseigné'}
                    {trackingInfo.declaredValue ? ` · ${trackingInfo.declaredValue.toLocaleString('fr-FR')} CDF` : ''}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Agence responsable</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.agencyName || 'Ugavi'}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Livreur / agent</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.courierName || trackingInfo.events[0]?.actor || 'Selon affectation'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Timeline</h3>
              </div>
              <div className="space-y-4">
                {trackingInfo.events.map((event, index) => (
                  <div key={`${event.date}-${event.time}-${index}`} className="flex gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <span className="h-3 w-3 rounded-full bg-primary" />
                      {index < trackingInfo.events.length - 1 && <span className="mt-1 h-full w-px bg-primary/20" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-semibold text-slate-900">{event.status}</p>
                      <p className="text-xs text-slate-500">{event.date} · {event.time}</p>
                      <p className="text-sm text-slate-700">{event.location}</p>
                      {event.actor && <p className="text-xs text-slate-500">Par {event.actor}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => setTrackingInfo(null)} className="w-full">
            Nouveau Suivi
          </Button>
        </div>
      )}
    </div>
  );
}
