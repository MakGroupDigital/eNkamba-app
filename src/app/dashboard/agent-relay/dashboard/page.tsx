'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, Users, TrendingUp, Settings, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';

const agentTypeLabels: Record<string, string> = {
  'agent-relais': 'Agent Relais',
  'cabinet': 'Cabiniste',
  'point-service': 'Point de Service'
};

export default function AgentRelayDashboardPage() {
  const router = useRouter();
  const { status, application, isLoading } = useAgentRelayStatus();

  useEffect(() => {
    // Si pas approuvé, rediriger
    if (!isLoading && status !== 'approved') {
      router.push('/dashboard/agent-relay');
    }
  }, [status, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#32BB78] mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status !== 'approved' || !application) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#32BB78] via-[#2BA86A] to-[#32BB78] px-4 py-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/dashboard')} 
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-lg">
              <Image 
                src="/enkamba-logo.png" 
                alt="eNkamba Logo" 
                width={48} 
                height={48}
                className="object-contain rounded-full"
              />
            </div>
            <div className="text-center">
              <span className="text-white text-xl font-bold tracking-tight block">eNkamba-Pay</span>
              <span className="text-white/80 text-xs">{agentTypeLabels[application.agentType]}</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full"
          >
            <Settings size={20} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-[#32BB78] to-[#2BA86A] rounded-2xl p-6 text-white mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Bienvenue, {application.fullName || 'Agent'}!
          </h1>
          <p className="text-white/90">
            Votre compte {agentTypeLabels[application.agentType]} est actif
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-[#32BB78]/10 flex items-center justify-center">
                <Wallet size={24} className="text-[#32BB78]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Solde Agent</p>
                <p className="text-2xl font-bold text-gray-800">0 FC</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clients servis</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-20 bg-[#32BB78] hover:bg-[#2BA86A] text-white rounded-xl flex flex-col gap-2">
              <Wallet size={24} />
              <span className="text-sm">Nouvelle transaction</span>
            </Button>
            <Button variant="outline" className="h-20 rounded-xl flex flex-col gap-2">
              <Users size={24} />
              <span className="text-sm">Mes clients</span>
            </Button>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">
            Tableau de bord en développement
          </h3>
          <p className="text-sm text-blue-700">
            Les fonctionnalités complètes de votre espace agent seront bientôt disponibles.
            Vous serez notifié dès leur activation.
          </p>
        </div>
      </div>
    </div>
  );
}
