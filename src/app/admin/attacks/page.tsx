'use client';

import { AdminAttacksView, AdminPageHeader } from '@/components/admin/admin-monitoring';

export default function AdminAttacksPage() {
  return (
    <main className="min-h-screen bg-[#F7FAF8] p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <AdminPageHeader
          title="Centre autonome d'attaques"
          description="Detection des signaux suspects, faille probable, methode, origine, impact et contre-mesure."
        />
        <AdminAttacksView />
      </div>
    </main>
  );
}
