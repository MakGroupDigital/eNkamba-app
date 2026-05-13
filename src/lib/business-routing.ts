import type { BusinessType } from '@/types/business-dashboard.types';

export function getBusinessDashboardPath(businessType?: BusinessType | string | null) {
  switch (businessType) {
    case 'COMMERCE':
      return '/dashboard/business-pro?module=COMMERCE';
    case 'LOGISTICS':
      return '/dashboard/business-pro?module=LOGISTICS';
    case 'PAYMENT':
      return '/dashboard/business-pro?module=PAYMENT';
    default:
      return '/dashboard/business-pro';
  }
}

export function getBusinessStatusLabel(status?: string | null) {
  switch (status) {
    case 'APPROVED':
      return 'approuve';
    case 'PENDING':
      return 'en attente';
    case 'UNDER_REVIEW':
      return 'en verification';
    case 'REJECTED':
      return 'rejete';
    default:
      return 'non soumis';
  }
}
