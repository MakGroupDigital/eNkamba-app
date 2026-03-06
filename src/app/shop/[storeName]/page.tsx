import ShopRedirectClient from './shop-redirect-client';

export default function ShopRedirectPage({ params }: { params: Promise<{ storeName: string }> }) {
  return <ShopRedirectClient params={params} />;
}
