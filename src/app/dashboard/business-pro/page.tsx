'use client';

import React from 'react';
import { BusinessDashboardWrapper } from '@/components/business/business-dashboard-wrapper';
import { useRouter } from 'next/navigation';

export default function BusinessProPage() {
  const router = useRouter();

  const handleRetry = () => {
    router.push('/dashboard/settings/business-account');
  };

  return (
    <div>
      <BusinessDashboardWrapper onRetry={handleRetry} />
    </div>
  );
}
