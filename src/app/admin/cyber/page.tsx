'use client';

import { AdminCyberView, AdminPageHeader } from '@/components/admin/admin-monitoring';

export default function AdminCyberPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <AdminPageHeader
          title="Cyber intelligence"
          description="Activite utilisateur, temps passe par module, pages visitees, IP, localisation disponible et sessions actives."
        />
        <AdminCyberView />
      </div>
    </main>
  );
}
