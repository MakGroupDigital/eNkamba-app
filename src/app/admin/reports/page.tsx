'use client';

import { AdminPageHeader, AdminReportsView } from '@/components/admin/admin-monitoring';

export default function AdminReportsPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <AdminPageHeader
          title="Rapports exportables"
          description="Exports admin pour logs, activite utilisateur, cyber, attaques, synthese operationnelle et audit client."
        />
        <AdminReportsView />
      </div>
    </main>
  );
}
