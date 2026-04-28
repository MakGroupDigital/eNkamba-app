import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const apps = getApps();
let db: any;

if (!apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.clientEmail && serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount as any),
      });
      db = getFirestore();
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}

if (!db && apps.length > 0) {
  db = getFirestore();
}

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'ID de demande requis' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Service non disponible - Firebase Admin SDK non configuré' },
        { status: 500 }
      );
    }

    // Get the request document
    const requestRef = db.collection('business_requests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists()) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data();
    const userId = requestData.userId;

    // Update request status to APPROVED
    await requestRef.update({
      status: 'APPROVED',
      approvedAt: new Date(),
    });

    // Update user document with business status
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      businessStatus: 'APPROVED',
      isBusiness: true,
      businessId: requestId,
      businessName: requestData.businessName,
      businessType: requestData.type,
      subCategory: requestData.subCategory,
      approvedAt: new Date(),
    });

    const businessUserRef = db.collection('businessUsers').doc(userId);
    await businessUserRef.set({
      uid: userId,
      businessId: requestId,
      businessName: requestData.businessName,
      businessType: requestData.type,
      subCategory: requestData.subCategory,
      status: 'APPROVED',
      isBusiness: true,
      approvedAt: Date.now(),
      submittedAt: requestData.submittedAt || Date.now(),
      updatedAt: Date.now(),
    }, { merge: true });

    // Create notification for user
    const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
    await notificationRef.set({
      id: notificationRef.id,
      type: 'BUSINESS_APPROVED',
      title: 'Compte entreprise approuvé',
      message: `Félicitations! Votre compte entreprise "${requestData.businessName}" a été approuvé.`,
      businessName: requestData.businessName,
      businessType: requestData.type,
      businessId: requestId,
      icon: '🟢',
      actionUrl: '/dashboard/business-pro',
      actionLabel: 'Accéder à mon Espace Pro',
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Demande approuvée et notification créée',
    });
  } catch (error: any) {
    console.error('Erreur approbation:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'approbation' },
      { status: 500 }
    );
  }
}
