import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, businessName, type, subCategory, registrationNumber, address, city, country, contactEmail, contactPhone, apiCallbackUrl, documents } = data;

    // Valider les données
    if (!businessName?.trim()) {
      return NextResponse.json(
        { error: 'Le nom de l\'entreprise est requis' },
        { status: 400 }
      );
    }

    if (!['COMMERCE', 'LOGISTICS', 'PAYMENT'].includes(type)) {
      return NextResponse.json(
        { error: 'Type d\'entreprise invalide' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const now = Date.now();
    const requestId = `${userId}_${now}`;

    // Créer la demande
    const newRequest = {
      userId,
      businessName,
      type,
      subCategory,
      registrationNumber,
      address,
      city,
      country,
      contactEmail,
      contactPhone,
      apiCallbackUrl: apiCallbackUrl || null,
      documents: documents || {},
      status: 'PENDING',
      submittedAt: now,
      updatedAt: now,
    };

    // Retourner la demande créée
    // Note: La sauvegarde Firestore se fera côté client via le hook
    return NextResponse.json({
      success: true,
      data: {
        ...newRequest,
        id: requestId,
      },
    });
  } catch (error: any) {
    console.error('Erreur soumission demande:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la soumission' },
      { status: 500 }
    );
  }
}
