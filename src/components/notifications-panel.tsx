'use client';

import { Bell, X, CheckCircle2, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NotificationsPanel() {
  const { notifications, unreadCount, markAsRead, acknowledgeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transfer_received':
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'transfer_sent':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'payment_request':
        return <Info className="w-5 h-5 text-[#FFA500]" />;
      case 'kyc_required':
        return <ShieldCheck className="w-5 h-5 text-primary" />;
      case 'BUSINESS_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'BUSINESS_REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transfer_received':
        return 'bg-primary/5 border-primary/20';
      case 'transfer_sent':
        return 'bg-blue-50 border-blue-200';
      case 'payment_request':
        return 'bg-[#FFA500]/10 border-[#FFA500]/30';
      case 'kyc_required':
        return 'bg-primary/5 border-primary/20';
      case 'BUSINESS_APPROVED':
        return 'bg-primary/5 border-primary/20';
      case 'BUSINESS_REJECTED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Bouton notification */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Panneau notifications */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-96 bg-background border rounded-lg shadow-lg z-50 overflow-y-auto">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <Card
                  key={notif.id}
                  className={`m-2 p-3 border cursor-pointer hover:shadow-md transition-shadow ${getNotificationColor(notif.type)}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.amount && (
                        <p className="text-sm font-bold text-primary mt-2">
                          {notif.amount.toLocaleString('fr-FR')} {notif.currency}
                        </p>
                      )}
                      {notif.type === 'transfer_received' && !notif.acknowledged && (
                        <Button
                          size="sm"
                          className="mt-2 w-full bg-primary hover:bg-primary text-white h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeNotification(notif.id);
                          }}
                        >
                          Confirmer réception
                        </Button>
                      )}
                      {notif.actionUrl && notif.actionLabel && (
                        <Button
                          size="sm"
                          className="mt-2 w-full bg-primary hover:bg-primary/90 text-white h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                            const actionUrl = notif.actionUrl;
                            if (!actionUrl) return;
                            const isInternal = actionUrl.startsWith('/');
                            if (isInternal) {
                              router.push(actionUrl);
                              return;
                            }
                            window.location.href = actionUrl;
                          }}
                        >
                          {notif.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
