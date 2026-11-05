'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { ArrowLeft, Camera, ChevronRight, ImageUp, Loader2, MapPin, QrCode, Search, ShieldCheck, X } from 'lucide-react';

import { EChurchIcon } from '@/components/icons/service-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { churchPaymentPath, parseChurchLink, type ChurchAccount } from '@/lib/echurch';
import { db } from '@/lib/firebase';

type FoundChurch = Pick<ChurchAccount, 'id' | 'name' | 'city' | 'country' | 'logoUrl' | 'paymentAlias' | 'publicId' | 'status'>;

const RECENT_KEY = 'kenz.churchPay.recent';

function readRecent(): FoundChurch[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function rememberChurch(church: FoundChurch) {
  try {
    const next = [church, ...readRecent().filter((item) => item.id !== church.id)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Préférence locale seulement.
  }
}

async function findChurch(rawReference: string): Promise<FoundChurch | null> {
  const value = rawReference.trim();
  if (!value) return null;
  const link = parseChurchLink(value);
  const attempts: Array<[string, string]> = link
    ? [['paymentAlias', link.alias]]
    : [['publicId', value.toUpperCase()], ['paymentAlias', value.toLowerCase()], ['paymentAlias', value]];
  for (const [field, candidate] of attempts) {
    const snapshot = await getDocs(query(collection(db, 'church_accounts'), where(field, '==', candidate), limit(1)));
    const item = snapshot.docs[0];
    if (item) {
      const data = item.data() as ChurchAccount;
      return { id: item.id, name: data.name, city: data.city, country: data.country, logoUrl: data.logoUrl, paymentAlias: data.paymentAlias, publicId: data.publicId, status: data.status };
    }
  }
  return null;
}

/**
 * Kenz Pay › Église : identifier l'Église (référence ou QR) puis payer l'un de ses frais.
 * La gestion de l'Église (paroisses, frais, QR) se fait dans Kenz Business.
 */
export default function ChurchPayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reference, setReference] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [church, setChurch] = useState<FoundChurch | null>(null);
  const [recent, setRecent] = useState<FoundChurch[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { setRecent(readRecent()); }, []);

  const openChurch = useCallback((found: FoundChurch, qrId?: string | null) => {
    rememberChurch(found);
    router.push(churchPaymentPath(found.paymentAlias, qrId));
  }, [router]);

  const search = async (value = reference) => {
    if (!value.trim()) {
      toast({ variant: 'destructive', title: 'Référence requise', description: 'Saisissez la référence donnée par votre Église (ex. ECH-REP-AB12C).' });
      return;
    }
    setIsSearching(true);
    setNotFound(false);
    setChurch(null);
    try {
      const found = await findChurch(value);
      if (!found) setNotFound(true);
      else setChurch(found);
    } catch (error) {
      console.error('Recherche Église:', error);
      toast({ variant: 'destructive', title: 'Recherche impossible', description: 'Vérifiez votre connexion et réessayez.' });
    } finally {
      setIsSearching(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanning(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const handleDecoded = useCallback(async (data: string) => {
    const link = parseChurchLink(data);
    if (!link) {
      setScanError('Ce QR n’est pas un QR d’Église Kenz. Pour payer une personne, utilisez le scanner principal.');
      return false;
    }
    stopCamera();
    setIsSearching(true);
    try {
      const found = await findChurch(data);
      if (!found) { setNotFound(true); return true; }
      openChurch(found, link.qrId);
    } finally {
      setIsSearching(false);
    }
    return true;
  }, [openChurch, stopCamera]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        if (code?.data) {
          void handleDecoded(code.data).then((handled) => {
            if (!handled && streamRef.current) frameRef.current = requestAnimationFrame(scanFrame);
          });
          return;
        }
      }
    }
    frameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDecoded]);

  const startCamera = async () => {
    setScanError('');
    setNotFound(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('La caméra n’est pas disponible sur cet appareil. Importez une photo du QR.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setIsScanning(true);
      requestAnimationFrame(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => undefined);
        frameRef.current = requestAnimationFrame(scanFrame);
      });
    } catch {
      setScanError('Accès à la caméra refusé. Autorisez la caméra ou importez une photo du QR.');
    }
  };

  const scanImage = (file?: File | null) => {
    if (!file) return;
    setScanError('');
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !context) return;
      const ratio = Math.min(1, 900 / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      if (!code?.data) setScanError('Aucun QR lisible sur cette image.');
      else void handleDecoded(code.data);
    };
    image.onerror = () => { URL.revokeObjectURL(url); setScanError('Image illisible.'); };
    image.src = url;
  };

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4 pb-28">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour"><Link href="/dashboard/mbongo-dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex items-center gap-2">
          <EChurchIcon size={32} />
          <div><h1 className="text-lg font-black">Payer mon Église</h1><p className="text-xs text-muted-foreground">Dîme, offrande et autres frais</p></div>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="church-reference" className="text-sm font-bold">Référence de l’Église</Label>
            <div className="flex gap-2">
              <Input
                id="church-reference"
                value={reference}
                onChange={(event) => { setReference(event.target.value); setNotFound(false); }}
                onKeyDown={(event) => { if (event.key === 'Enter') void search(); }}
                placeholder="Ex. ECH-REP-AB12C"
                autoCapitalize="characters"
                className="h-12 font-mono text-base"
              />
              <Button className="h-12 shrink-0 px-4" onClick={() => search()} disabled={isSearching} aria-label="Rechercher l’Église">
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">La référence est communiquée par votre Église (affiche, bulletin, QR).</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>

          {isScanning ? (
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video ref={videoRef} className="aspect-square w-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-white/80" />
              <Button variant="secondary" size="icon" className="absolute right-3 top-3" onClick={stopCamera} aria-label="Fermer la caméra"><X className="h-5 w-5" /></Button>
              <p className="absolute inset-x-0 bottom-3 text-center text-sm font-bold text-white">Placez le QR de l’Église dans le cadre</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12" onClick={startCamera}><Camera className="mr-2 h-5 w-5" />Scanner le QR</Button>
              <Button variant="outline" className="h-12" onClick={() => fileRef.current?.click()}><ImageUp className="mr-2 h-5 w-5" />Importer</Button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { scanImage(event.target.files?.[0]); event.target.value = ''; }} />
          <canvas ref={canvasRef} className="hidden" />
          {scanError && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{scanError}</p>}
          {notFound && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">Aucune Église ne correspond à cette référence. Vérifiez-la auprès de votre Église.</p>}
        </CardContent>
      </Card>

      {church && (
        <Card className="rounded-2xl border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <ChurchRow church={church} />
            {church.status === 'validated' ? (
              <Button className="mt-4 h-12 w-full text-base font-bold" onClick={() => openChurch(church)}>Choisir un frais et payer<ChevronRight className="ml-1 h-5 w-5" /></Button>
            ) : (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Cette Église est en cours de vérification par Kenz et ne peut pas encore recevoir de paiement.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!church && recent.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-bold text-muted-foreground">Églises récentes</h2>
          {recent.map((item) => (
            <button key={item.id} type="button" onClick={() => openChurch(item)} className="w-full rounded-2xl border bg-card p-3 text-left transition hover:border-primary/40">
              <ChurchRow church={item} compact />
            </button>
          ))}
        </section>
      )}

      <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Paiement depuis votre wallet Kenz Pay, confirmé par PIN, avec reçu électronique.</p>
    </main>
  );
}

function ChurchRow({ church, compact = false }: { church: FoundChurch; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${compact ? 'h-10 w-10' : 'h-14 w-14'} shrink-0 overflow-hidden rounded-xl bg-primary/10`}>
        {church.logoUrl ? <img src={church.logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-primary"><QrCode className="h-5 w-5" /></span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{church.name}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{[church.city, church.country].filter(Boolean).join(', ')}</p>
        {!compact && <p className="mt-0.5 font-mono text-xs text-muted-foreground">{church.publicId}</p>}
      </div>
      {compact && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}
