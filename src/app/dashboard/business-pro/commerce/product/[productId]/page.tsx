import { redirect } from 'next/navigation';
import { businessPortalUrl } from '@/lib/business-portal';

export default async function BusinessRedirect(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ productId: string }>;
}) {
  const params = await props.params;
  redirect(businessPortalUrl(`/dashboard/business-pro/commerce/product/${encodeURIComponent(params.productId)}`, await props.searchParams));
}
