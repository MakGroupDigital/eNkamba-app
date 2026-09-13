import { redirect } from 'next/navigation';
import { businessPortalUrl } from '@/lib/business-portal';

export default async function BusinessRedirect(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ type: string }>;
}) {
  const params = await props.params;
  redirect(businessPortalUrl(`/dashboard/agent-relay/dashboard/${encodeURIComponent(params.type)}`, await props.searchParams));
}
