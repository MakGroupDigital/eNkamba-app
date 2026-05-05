"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletTransactions, Transaction } from "@/hooks/useWalletTransactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TxStatus = Transaction["status"];

interface NotificationState {
  tx: Transaction;
  status: TxStatus;
}

export function PendingPaymentWatcher() {
  const router = useRouter();
  const { transactions } = useWalletTransactions();

  const [hiddenPendingIds, setHiddenPendingIds] = useState<Set<string>>(new Set());
  const [activeNotification, setActiveNotification] = useState<NotificationState | null>(null);

  const lastStatusesRef = useRef<Record<string, TxStatus>>({});
  const notifiedRef = useRef<Set<string>>(new Set());

  // Dernière transaction en attente
  const pendingTx = useMemo(() => {
    return transactions.find((tx) =>
      tx.status === "pending" &&
      (tx.paymentMethod === "wonyapay" || tx.paymentMethod === "enkambapay" || tx.withdrawalMethod === "mobile_money")
    );
  }, [transactions]);

  const showWaiting = pendingTx && !hiddenPendingIds.has(pendingTx.id);

  // Détecter un changement de statut -> notification persistante
  useEffect(() => {
    transactions.forEach((tx) => {
      const prev = lastStatusesRef.current[tx.id];
      lastStatusesRef.current[tx.id] = tx.status;

      const isWatchedPayment = tx.paymentMethod === "wonyapay" || tx.paymentMethod === "enkambapay" || tx.withdrawalMethod === "mobile_money";
      if (!isWatchedPayment) return;

      const transitioned = prev === "pending" && tx.status !== "pending";
      if (transitioned && !notifiedRef.current.has(tx.id)) {
        notifiedRef.current.add(tx.id);
        setActiveNotification({ tx, status: tx.status });
        // retirer l'attente si on l'affichait
        setHiddenPendingIds((prevSet) => new Set([...prevSet, tx.id]));
      }
    });
  }, [transactions]);

  const handleStay = () => {
    // rien: on laisse l'overlay visible
  };

  const handleContinue = () => {
    if (pendingTx) {
      setHiddenPendingIds((prev) => new Set([...prev, pendingTx.id]));
    }
  };

  const closeNotification = () => setActiveNotification(null);

  const handleSuccessAction = () => {
    closeNotification();
    router.push("/dashboard/wallet");
  };

  const handleRetry = () => {
    closeNotification();
    router.push("/dashboard/add-funds");
  };

  return (
    <>
      {showWaiting && pendingTx && (
        <div className="fixed inset-0 z-40 flex items-end justify-center px-4 pb-6 sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <Card className="relative w-full max-w-md shadow-2xl border-primary/30">
            <CardContent className="space-y-3 pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Nous sommes en attente de la confirmation de votre paiement</p>
                <p className="text-lg font-semibold">Référence: {pendingTx.id}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button variant="secondary" className="w-full" onClick={handleStay}>
                  Rester sur cette page
                </Button>
                <Button className="w-full" onClick={handleContinue}>
                  Continuer à naviguer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeNotification && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-6 sm:w-96 animate-in slide-in-from-bottom-4 duration-300">
          <Card
            className={cn(
              "shadow-2xl border",
              activeNotification.status === "completed" ? "border-emerald-500" : "border-amber-500"
            )}
          >
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {activeNotification.status === "completed"
                    ? "Paiement confirmé"
                    : "Paiement non abouti"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeNotification.status === "completed"
                    ? "Votre opération a été confirmée."
                    : "Vous pouvez réessayer ou revenir plus tard."}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {activeNotification.status === "completed" ? (
                  <Button className="flex-1" onClick={handleSuccessAction}>
                    Voir le portefeuille
                  </Button>
                ) : (
                  <>
                    <Button className="flex-1" onClick={handleRetry}>
                      Réessayer
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={closeNotification}>
                      Faire plus tard
                    </Button>
                  </>
                )}
              </div>
              {activeNotification.status === "completed" && (
                <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={closeNotification}>
                  Fermer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
