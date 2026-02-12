'use client';

import React from 'react';
import { BusinessStatus } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';

interface BusinessStatusCardProps {
  status: BusinessStatus;
  businessName: string;
  rejectionReason?: string;
  onRetry?: () => void;
}

export function BusinessStatusCard({
  status,
  businessName,
  rejectionReason,
  onRetry,
}: BusinessStatusCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          icon: BusinessDashboardIcons.Clock,
          title: 'En cours de traitement',
          description: 'Votre dossier est en cours d\'analyse par nos administrateurs.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800',
          dotColor: 'bg-blue-500',
        };
      case 'APPROVED':
        return {
          icon: BusinessDashboardIcons.CheckCircle,
          title: 'Compte approuvé',
          description: 'Félicitations, vous êtes désormais un partenaire certifié Enkamba.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          badgeColor: 'bg-green-100 text-green-800',
          dotColor: 'bg-green-500',
        };
      case 'REJECTED':
        return {
          icon: BusinessDashboardIcons.XCircle,
          title: 'Demande rejetée',
          description: 'Votre demande a été rejetée. Vous pouvez modifier et renvoyer le formulaire.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          badgeColor: 'bg-red-100 text-red-800',
          dotColor: 'bg-red-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-2xl p-6 mb-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${config.dotColor} w-3 h-3 rounded-full animate-pulse`} />
          <span className={`${config.badgeColor} px-3 py-1 rounded-full text-sm font-semibold`}>
            {status === 'PENDING' && '🔵 EN COURS'}
            {status === 'APPROVED' && '🟢 APPROUVÉ'}
            {status === 'REJECTED' && '🔴 REJETÉ'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-start gap-4">
        <div className={`${config.textColor} flex-shrink-0`}>
          <Icon className="w-12 h-12" />
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${config.textColor} mb-2`}>
            {config.title}
          </h3>
          <p className={`${config.textColor} opacity-80 mb-4`}>
            {config.description}
          </p>

          {/* Business Name */}
          <div className={`${config.textColor} opacity-70 text-sm mb-4`}>
            <span className="font-semibold">Entreprise:</span> {businessName}
          </div>

          {/* Rejection Reason */}
          {status === 'REJECTED' && rejectionReason && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-4 border-l-4 border-red-500">
              <p className="text-sm font-semibold text-red-700 mb-1">Motif du rejet:</p>
              <p className="text-sm text-red-600">{rejectionReason}</p>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'REJECTED' && onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Modifier et renvoyer
            </button>
          )}

          {status === 'APPROVED' && (
            <a href="/dashboard/business-pro">
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Accéder à mon Espace Pro
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
