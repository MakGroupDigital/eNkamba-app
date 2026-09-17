import { redirect } from 'next/navigation';
import { businessPortalUrl } from '@/lib/business-portal';

export default async function BusinessRedirect(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(businessPortalUrl(`/dashboard/settings/business-account`, await props.searchParams));
}
