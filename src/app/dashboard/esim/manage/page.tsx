'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Smartphone,
  Phone,
  MessageSquare,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

interface ESIM {
  id: string;
  phoneNumber: string;
  status: 'active' | 'suspended' | 'expired';
  activatedAt: string;
  expiresAt?: string;
  balance: number;
  callsReceived: number;
  smsReceived: number;
}

interface CallLog {
  id: string;
  from: string;
  duration: number;
  timestamp: string;
  type: 'incoming' | 'missed';
}

interface SMSLog {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function ESIMManagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [esims, setEsims] = useState<ESIM[]>([]);
  const [selectedESIM, setSelectedESIM] = useState<ESIM | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadESIMs();
    }
  }, [user]);

  useEffect(() => {
    if (selectedESIM) {
      loadCallLogs(selectedESIM.id);
      loadSMSLogs(selectedESIM.id);
    }
  }, [selectedESIM]);

  const loadESIMs = async () => {
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/esim/list?userId=${user?.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEsims(data.esims || []);
        if (data.esims && data.esims.length > 0) {
          setSelectedESIM(data.esims[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement eSIMs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCallLogs = async (esimId: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/esim/call-logs?esimId=${esimId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCallLogs(data.calls || []);
      }
    } catch (error) {
      console.error('Erreur chargement appels:', error);
    }
  };

  const loadSMSLogs = async (esimId: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/esim/sms-logs?esimId=${esimId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSmsLogs(data.sms || []);
      }
    } catch (error) {
      console.error('Erreur chargement SMS:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/10 text-primary">Actif</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-700">Suspendu</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Expiré</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (esims.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background">
        <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
          <header className="flex items-center gap-4 pt-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/partner-services">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="font-headline text-3xl font-bold">Mes eSIMs</h1>
          </header>

          <Card>
            <CardContent className="p-12 text-center">
              <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Aucun eSIM actif</h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore d'eSIM-Kenz. Achetez-en un pour commencer.
              </p>
              <Button onClick={() => router.push('/dashboard/esim/purchase')}>
                <Plus className="mr-2 h-4 w-4" />
                Acheter un eSIM
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background">
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/partner-services">
                <ArrowLeft />
              </Link>
            </Button>
            <div>
              <h1 className="font-headline text-3xl font-bold">Mes eSIMs</h1>
              <p className="text-sm text-muted-foreground">{esims.length} numéro(s) actif(s)</p>
            </div>
          </div>
          <Button onClick={() => router.push('/dashboard/esim/purchase')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau
          </Button>
        </header>

        {/* eSIM Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {esims.map((esim) => (
            <Card
              key={esim.id}
              className={`cursor-pointer transition-all ${
                selectedESIM?.id === esim.id ? 'border-primary border-2' : ''
              }`}
              onClick={() => setSelectedESIM(esim)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <span className="font-mono font-bold">{esim.phoneNumber}</span>
                  </div>
                  {getStatusBadge(esim.status)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <PhoneCall className="h-4 w-4" />
                    {esim.callsReceived} appels
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {esim.smsReceived} SMS
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected eSIM Details */}
        {selectedESIM && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <p className="text-xl font-bold">
                        {selectedESIM.status === 'active' ? 'Actif' : 'Inactif'}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Appels reçus</p>
                      <p className="text-xl font-bold">{selectedESIM.callsReceived}</p>
                    </div>
                    <PhoneCall className="h-8 w-8 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">SMS reçus</p>
                      <p className="text-xl font-bold">{selectedESIM.smsReceived}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Calls and SMS */}
            <Tabs defaultValue="calls" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calls">
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Appels ({callLogs.length})
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS ({smsLogs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calls" className="space-y-4">
                {callLogs.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun appel reçu</p>
                    </CardContent>
                  </Card>
                ) : (
                  callLogs.map((call) => (
                    <Card key={call.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              call.type === 'missed' ? 'bg-red-100' : 'bg-primary/10'
                            }`}>
                              <PhoneCall className={`h-4 w-4 ${
                                call.type === 'missed' ? 'text-red-600' : 'text-primary'
                              }`} />
                            </div>
                            <div>
                              <p className="font-mono font-semibold">{call.from}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(call.timestamp).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatDuration(call.duration)}</p>
                            <Badge variant={call.type === 'missed' ? 'destructive' : 'default'}>
                              {call.type === 'missed' ? 'Manqué' : 'Reçu'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="sms" className="space-y-4">
                {smsLogs.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun SMS reçu</p>
                    </CardContent>
                  </Card>
                ) : (
                  smsLogs.map((sms) => (
                    <Card key={sms.id} className={!sms.read ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-mono font-semibold">{sms.from}</p>
                              {!sms.read && <Badge className="bg-blue-100 text-blue-700">Nouveau</Badge>}
                            </div>
                            <p className="text-sm mb-2">{sms.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sms.timestamp).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informations eSIM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-muted">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">{selectedESIM.id}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted">
                  <span className="text-muted-foreground">Activé le:</span>
                  <span>{new Date(selectedESIM.activatedAt).toLocaleDateString('fr-FR')}</span>
                </div>
                {selectedESIM.expiresAt && (
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="text-muted-foreground">Expire le:</span>
                    <span>{new Date(selectedESIM.expiresAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
