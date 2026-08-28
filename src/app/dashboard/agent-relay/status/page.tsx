'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, Phone, User, FileText } from 'lucide-react';
import Image from 'next/image';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';

const agentTypeLabels: Record<string, string> = {
  'agent-relais': 'Agent Relais',
  'cabinet': 'Cabiniste',
  'point-service': 'Point de Service'
};

export default function AgentRelayStatusPage() {
  const router = useRouter();
  const { status, application, isLoading } = useAgentRelayStatus();

  useEffect(() => {
    // Si approuvé, rediriger vers le dashboard agent
    if (!isLoading && status === 'approved') {
      router.replace(`/dashboard/agent-relay/dashboard/${application?.agentType || 'agent-relais'}`);
      return;
    }
  }, [status, isLoading, application?.agentType, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#073B9A] mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si aucune demande, afficher un message au lieu de rediriger
  if (status === 'none') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#073B9A] via-[#073B9A] to-[#073B9A] px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/dashboard/settings')} 
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ArrowLeft size={20} />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-lg">
                <Image 
                  src="/kenz-logo.png"
                  alt="Kenz Logo"
                  width={48} 
                  height={48}
                  className="object-contain rounded-full"
                />
              </div>
              <span className="text-white text-xl font-bold tracking-tight">Kenz-Pay</span>
            </div>
            
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Aucune demande trouvée
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore soumis de demande pour devenir agent relais.
            </p>
            <Button
              onClick={() => router.push('/dashboard/agent-relay')}
              className="bg-[#073B9A] hover:bg-[#073B9A] text-white"
            >
              Commencer une demande
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // N'afficher que pour in_progress, submitted et rejected
  if (!application) {
    return null;
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'in_progress':
        return {
          icon: Clock,
          color: 'text-[#F51B2B]',
          bgColor: 'bg-[#F51B2B]/10',
          borderColor: 'border-[#F51B2B]/30',
          title: 'Inscription en cours',
          description: 'Complétez votre inscription pour soumettre votre demande.'
        };
      case 'submitted':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Demande en cours d\'examen',
          description: 'Notre équipe examine votre demande. Vous serez notifié dès qu\'une décision sera prise.'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Demande non approuvée',
          description: application.rejectionReason || 'Votre demande n\'a pas été approuvée. Vous pouvez soumettre une nouvelle demande.'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Statut inconnu',
          description: 'Veuillez contacter le support.'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#073B9A] via-[#073B9A] to-[#073B9A] px-4 py-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/dashboard/settings')} 
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-lg">
              <Image 
                src="/kenz-logo.png"
                alt="Kenz Logo"
                width={48} 
                height={48}
                className="object-contain rounded-full"
              />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Kenz-Pay</span>
          </div>
          
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className={`p-6 rounded-2xl ${statusInfo.bgColor} border-2 ${statusInfo.borderColor} mb-6`}>
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 rounded-xl ${statusInfo.bgColor} border ${statusInfo.borderColor} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon size={32} className={statusInfo.color} />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${statusInfo.color} mb-2`}>
                {statusInfo.title}
              </h2>
              <p className="text-gray-700">
                {statusInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Détails de la demande</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#073B9A]/10 flex items-center justify-center">
                <FileText size={20} className="text-[#073B9A]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Type d'agent</p>
                <p className="font-medium text-gray-800">
                  {agentTypeLabels[application.agentType] || application.agentType}
                </p>
              </div>
            </div>

            {application.fullName && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#073B9A]/10 flex items-center justify-center">
                  <User size={20} className="text-[#073B9A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-medium text-gray-800">{application.fullName}</p>
                </div>
              </div>
            )}

            {application.phoneNumber && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#073B9A]/10 flex items-center justify-center">
                  <Phone size={20} className="text-[#073B9A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium text-gray-800">{application.phoneNumber}</p>
                </div>
              </div>
            )}

            {application.submittedAt && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#073B9A]/10 flex items-center justify-center">
                  <Clock size={20} className="text-[#073B9A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de soumission</p>
                  <p className="font-medium text-gray-800">
                    {new Date(application.submittedAt.toDate()).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {status === 'in_progress' && (
            <Button
              onClick={() => router.push(`/dashboard/agent-relay/signup?type=${application.agentType}`)}
              className="w-full h-12 bg-[#073B9A] hover:bg-[#073B9A] text-white rounded-xl"
            >
              Continuer l'inscription
            </Button>
          )}

          {status === 'rejected' && (
            <Button
              onClick={() => router.push('/dashboard/agent-relay')}
              className="w-full h-12 bg-[#073B9A] hover:bg-[#073B9A] text-white rounded-xl"
            >
              Soumettre une nouvelle demande
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/settings')}
            className="w-full h-12 rounded-xl"
          >
            Retour aux paramètres
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 rounded-xl bg-gray-100 border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Besoin d'aide ? Contactez notre support à{' '}
            <a href="mailto:support@enkamba.com" className="text-[#073B9A] font-medium hover:underline">
              support@enkamba.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
