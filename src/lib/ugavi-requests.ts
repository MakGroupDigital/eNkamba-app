'use client';

import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UgaviLogisticsStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'registered'
  | 'assigned'
  | 'in_transit'
  | 'arrived_depot'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'blocked';

export type UgaviTrackingStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';

export type UgaviStatusHistoryEntry = {
  code: UgaviLogisticsStatus | 'payment_confirmed';
  label: string;
  location: string;
  actor: string;
  createdAtIso: string;
};

export const UGAVI_STATUS_LABELS: Record<UgaviLogisticsStatus, string> = {
  draft: 'Demande creee',
  pending_payment: 'En attente de paiement',
  paid: 'Paiement confirme',
  registered: 'Colis enregistre',
  assigned: 'Prestataire assigne',
  in_transit: 'En transit',
  arrived_depot: 'Arrive au depot',
  out_for_delivery: 'En livraison',
  delivered: 'Livre',
  returned: 'Retour',
  blocked: 'Bloque',
};

export const UGAVI_TRACKING_STATUS_MAP: Record<UgaviLogisticsStatus, UgaviTrackingStatus> = {
  draft: 'pending',
  pending_payment: 'pending',
  paid: 'in_transit',
  registered: 'in_transit',
  assigned: 'in_transit',
  in_transit: 'in_transit',
  arrived_depot: 'in_transit',
  out_for_delivery: 'in_transit',
  delivered: 'delivered',
  returned: 'failed',
  blocked: 'failed',
};

export const UGAVI_PRIMARY_FLOW: UgaviLogisticsStatus[] = [
  'registered',
  'assigned',
  'in_transit',
  'arrived_depot',
  'out_for_delivery',
  'delivered',
];

export function buildUgaviStatusEntry(
  code: UgaviStatusHistoryEntry['code'],
  actor: string,
  location: string,
  label?: string
): UgaviStatusHistoryEntry {
  return {
    code,
    label: label || UGAVI_STATUS_LABELS[code as UgaviLogisticsStatus] || 'Mise a jour',
    location,
    actor,
    createdAtIso: new Date().toISOString(),
  };
}

export async function appendUgaviStatus(
  requestId: string,
  logisticsStatus: UgaviLogisticsStatus,
  actor: string,
  location: string,
  label?: string
) {
  await updateDoc(doc(db, 'ugaviRequests', requestId), {
    logisticsStatus,
    statusHistory: arrayUnion(buildUgaviStatusEntry(logisticsStatus, actor, location, label)),
    updatedAt: serverTimestamp(),
    ...(logisticsStatus === 'delivered' ? { deliveredAt: serverTimestamp() } : {}),
  });
}
