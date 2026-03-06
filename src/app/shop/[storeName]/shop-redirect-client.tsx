'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Map of store names to seller IDs
const STORE_NAME_TO_SELLER_ID: Record<string, string> = {
  'kasang-elektronique': 'seller-1',
  'fournisseur-premium': 'seller-1',
  'grossiste-goma': 'seller-2',
  'producteur-bio-bukavu': 'seller-3',
  'electroshop': 'seller-4',
};

export default function ShopRedirectClient({ params }: { params: Promise<{ storeName: string }> }) {
  const { storeName } = use(params);
  const router = useRouter();

  useEffect(() => {
    const sellerId = STORE_NAME_TO_SELLER_ID[storeName] || 'seller-1';
    router.replace(`/dashboard/nkampa/seller/${sellerId}`);
  }, [storeName, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary to-green-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">Redirection vers la boutique...</p>
      </div>
    </div>
  );
}
