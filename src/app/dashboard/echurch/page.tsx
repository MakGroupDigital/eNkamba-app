'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { EChurchIcon } from '@/components/icons/service-icons';

export default function EChurchPage() {
  return (
    <>
      <DashboardHeader />
      <main className="min-h-screen bg-[#F7FAF8] px-4 pb-10 pt-24">
        <section className="mx-auto flex max-w-md flex-col items-center rounded-[8px] border border-primary/10 bg-white p-6 text-center shadow-sm">
          <div className="flex h-24 w-24 items-center justify-center rounded-[8px] bg-primary/5 shadow-md ring-1 ring-primary/10">
            <EChurchIcon size={72} />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-primary">eChurch</p>
          <h1 className="mt-2 font-headline text-2xl font-black text-slate-950">App en development</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ce service sera disponible prochainement dans eNkamba.
          </p>
          <Button asChild className="mt-6 gap-2 bg-primary hover:bg-primary">
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
        </section>
      </main>
    </>
  );
}
