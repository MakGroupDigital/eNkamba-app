'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContactsManagementPanel } from "@/components/contacts-management-panel";

export default function ContactsPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-gradient-to-r from-primary via-primary to-green-800 px-4 shadow-lg">
        <Link href="/dashboard">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-xl font-bold text-white">Gestion des Contacts</h1>
          <p className="text-xs text-white/70">Accédez à vos contacts depuis le chat</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <ContactsManagementPanel />
      </main>
    </div>
  );
}
