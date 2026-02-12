'use client';

import React from 'react';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';
import { BusinessStatusCard } from '@/components/business/business-status-card';
import { CommerceDashboard } from '@/components/business/dashboards/commerce-dashboard';
import { LogisticsDashboard } from '@/components/business/dashboards/logistics-dashboard';
import { PaymentDashboard } from '@/components/business/dashboards/payment-dashboard';

interface BusinessDashboardWrapperProps {
  onRetry?: () => void;
}

export function BusinessDashboardWrapper({ onRetry }: BusinessDashboardWrapperProps) {
  const { businessUser, isLoading, error, isApproved } = useBusinessStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
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

  // Show appropriate dashboard based on business type
  switch (businessUser.businessType) {
    case 'COMMERCE':
      return <CommerceDashboard businessUser={businessUser} />;
    case 'LOGISTICS':
      return <LogisticsDashboard businessUser={businessUser} />;
    case 'PAYMENT':
      return <PaymentDashboard businessUser={businessUser} />;
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
