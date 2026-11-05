'use client';

import { AdminInfrastructureView, AdminPageHeader } from '@/components/admin/admin-monitoring';

export default function AdminInfrastructurePage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <AdminPageHeader
          title="Infrastructure systeme"
          description="Centre de donnees visuel, serveurs par module, pare-feu, agents connectes, points GPS et etat global."
        />
        <AdminInfrastructureView />
      </div>
    </main>
  );
}
