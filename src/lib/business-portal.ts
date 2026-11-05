export const BUSINESS_PORTAL_ORIGIN = (process.env.NEXT_PUBLIC_BUSINESS_PORTAL_URL || 'https://business.enkamba.io').replace(/\/$/, '');

export const BUSINESS_ROUTE_ROOTS = [
  '/dashboard/business-pro', '/dashboard/settings/business-account',
  '/dashboard/agent-relay', '/dashboard/agent', '/dashboard/echurch',
  '/dashboard/nkampa/store',
] as const;

export function businessPortalUrl(path = '/', search?: Record<string, string | string[] | undefined>) {
  const url = new URL(path.startsWith('/') && !path.startsWith('//') ? path : '/', BUSINESS_PORTAL_ORIGIN);
  if (url.origin !== new URL(BUSINESS_PORTAL_ORIGIN).origin) throw new Error('Invalid business destination');
  for (const [key, value] of Object.entries(search || {})) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) url.searchParams.append(key, item);
  }
  return url.toString();
}
