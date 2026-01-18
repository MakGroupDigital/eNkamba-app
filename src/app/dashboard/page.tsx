import { redirect } from 'next/navigation';

// This page now acts as a gateway to the default dashboard tab.
export default function HubPage() {
  redirect('/dashboard/mbongo-dashboard');
}
