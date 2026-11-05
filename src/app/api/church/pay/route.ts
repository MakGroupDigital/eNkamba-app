import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { ChurchPaymentError, processChurchPayment, type ChurchPaymentInput } from '@/lib/server/church-payment';
import { requireRequestUser } from '@/lib/verify-request-user';

export const runtime = 'nodejs';

/** Kenz Pay › Église : débite le wallet du fidèle et crédite l'Église (jeton Firebase obligatoire). */
export async function POST(request: NextRequest) {
  const caller = await requireRequestUser(request);
  if ('response' in caller) return caller.response;

  let input: ChurchPaymentInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  try {
    const result = await processChurchPayment(getAdminFirestore(), caller.uid, null, input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChurchPaymentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Paiement eChurch:', error);
    return NextResponse.json({ error: 'Le paiement n’a pas pu être finalisé. Aucun montant n’a été débité.' }, { status: 500 });
  }
}
