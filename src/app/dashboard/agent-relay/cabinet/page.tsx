import { redirect } from 'next/navigation';
import { businessPortalUrl } from '@/lib/business-portal';

export default async function BusinessRedirect(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(businessPortalUrl(`/dashboard/agent-relay/cabinet`, await props.searchParams));
}
