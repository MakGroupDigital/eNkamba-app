'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';
import { BusinessStatusCard } from '@/components/business/business-status-card';
import { CommerceDashboard } from '@/components/business/dashboards/commerce-dashboard';
import { LogisticsDashboard } from '@/components/business/dashboards/logistics-dashboard';
import { PaymentDashboard } from '@/components/business/dashboards/payment-dashboard';
import { KenzDataLoader } from '@/components/shared/kenz-data-loader';
import type { BusinessType } from '@/types/business-dashboard.types';

interface BusinessDashboardWrapperProps {
  onRetry?: () => void;
}

export function BusinessDashboardWrapper({ onRetry }: BusinessDashboardWrapperProps) {
  const searchParams = useSearchParams();
  const requestedModule = searchParams?.get('module');
  const preferredBusinessType: BusinessType | null =
    requestedModule === 'LOGISTICS' || requestedModule === 'COMMERCE' || requestedModule === 'PAYMENT'
      ? requestedModule
      : null;
  const { businessUser, isLoading, error, isApproved } = useBusinessStatus(preferredBusinessType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <KenzDataLoader size="lg" label="Chargement de votre espace entreprise..." className="text-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  // Not a business user
  if (!businessUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Vous n'avez pas de compte entreprise.</p>
        </div>
      </div>
    );
  }

  // Show status card if not approved
  if (!isApproved) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <BusinessStatusCard
          status={businessUser.status}
          businessName={businessUser.businessName}
          rejectionReason={businessUser.rejectionReason}
          onRetry={onRetry}
        />
      </div>
    );
  }

  const activeBusinessUser = preferredBusinessType
    ? { ...businessUser, businessType: preferredBusinessType }
    : businessUser;

  // Show appropriate dashboard based on business type
  switch (activeBusinessUser.businessType) {
    case 'COMMERCE':
      return <CommerceDashboard businessUser={activeBusinessUser} />;
    case 'LOGISTICS':
      return <LogisticsDashboard businessUser={activeBusinessUser} />;
    case 'PAYMENT':
      return <PaymentDashboard businessUser={activeBusinessUser} />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Type d'entreprise non reconnu.</p>
          </div>
        </div>
      );
  }
}
