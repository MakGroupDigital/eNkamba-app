"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Vérifier le stockage local (Email Auth simulé en dev)
        const storedUser = localStorage.getItem("enkamba_user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed && parsed.email) {
                    setIsLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Erreur parsing user storage", e);
            }
        }

        // 2. Vérifier Firebase Auth (Auth réel)
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Si on a déjà trouvé un utilisateur local, on ignore l'état Firebase "déconnecté" initial
            // Mais si on veut supporter le "vrai" logout, il faut gérer ça.
            // Pour l'instant, priorité à la connexion active.

            const localUser = localStorage.getItem("enkamba_user");

            if (user || localUser) {
                setIsLoading(false);
            } else {
                // Pas d'utilisateur connecté
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#32BB78]">
                <div className="text-white flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <p className="font-medium animate-pulse">Connexion sécurisée...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
