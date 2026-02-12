import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { functions, db, storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { BusinessRequestData, BusinessFormState } from '@/types/business-account.types';

export function useBusinessAccount() {
  const { user } = useAuth();
  const [businessRequest, setBusinessRequest] = useState<BusinessRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger la demande existante
  useEffect(() => {
    const loadBusinessRequest = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const q = query(
          collection(db, 'business_requests'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setBusinessRequest(snapshot.docs[0].data() as BusinessRequestData);
        }
      } catch (err) {
        console.error('Erreur chargement demande entreprise:', err);
        setError('Erreur lors du chargement de votre demande');
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessRequest();
  }, [user?.uid]);

  // Uploader un document (désactivé pour le moment)
  const uploadDocument = async (
    file: File,
    documentType: string
  ): Promise<string> => {
    // Retourner une URL placeholder
    // Les documents seront uploadés manuellement plus tard via Firebase Console
    return `placeholder_${Date.now()}_${documentType}`;
  };

  // Soumettre la demande
  const submitBusinessRequest = async (formData: BusinessFormState) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non authentifié');
    }

    setIsSubmitting(true);
    try {
      setError(null);

      // Uploader les documents
      const documentUrls: Record<string, string> = {};

      if (formData.documents.idCard) {
        documentUrls.idCard = await uploadDocument(formData.documents.idCard, 'id_card');
      }
      if (formData.documents.taxDocument) {
        documentUrls.taxDocument = await uploadDocument(formData.documents.taxDocument, 'tax_doc');
      }
      if (formData.documents.businessLicense) {
        documentUrls.businessLicense = await uploadDocument(formData.documents.businessLicense, 'business_license');
      }
      if (formData.documents.bankStatement) {
        documentUrls.bankStatement = await uploadDocument(formData.documents.bankStatement, 'bank_statement');
      }

      const now = Date.now();
      const requestId = `${user.uid}_${now}`;

      // Créer la demande
      const newRequest = {
        userId: user.uid,
        businessName: formData.businessName,
        type: formData.type,
        subCategory: formData.subCategory,
        registrationNumber: formData.registrationNumber,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        apiCallbackUrl: formData.apiCallbackUrl || null,
        documents: documentUrls,
        status: 'PENDING',
        submittedAt: now,
        updatedAt: now,
      };

      // Sauvegarder directement dans Firestore (côté client)
      await setDoc(doc(db, 'business_requests', requestId), newRequest);

      setBusinessRequest(newRequest as BusinessRequestData);
      return newRequest;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la soumission';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    businessRequest,
    isLoading,
    error,
    isSubmitting,
    submitBusinessRequest,
  };
}
