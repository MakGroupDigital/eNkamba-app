'use client';

import { AdminLogsView, AdminPageHeader } from '@/components/admin/admin-monitoring';

export default function AdminLogsPage() {
  return (
    <main className="min-h-screen bg-[#F7FAF8] p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <AdminPageHeader
          title="Logs erreurs applicatives"
          description="Toutes les erreurs remontees par l'application avec module, page, utilisateur, IP, stack, copie et partage."
        />
        <AdminLogsView />
      </div>
    </main>
  );
}
