'use client';

import { useAccessCode } from '@/hooks/useAccessCode';
import { LogOut } from 'lucide-react';

export function AccessCodeLogout() {
  const { logout } = useAccessCode();

  return (
    <button
      onClick={() => {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter du code d\'accès ?')) {
          logout();
          window.location.href = '/';
        }
      }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
    >
      <LogOut className="w-4 h-4" />
      Déconnexion accès
    </button>
  );
}
