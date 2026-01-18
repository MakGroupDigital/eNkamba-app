import { redirect } from 'next/navigation';

// This page acts as a gateway to the onboarding page.
export default function RootPage() {
  redirect('/onboarding');
}
