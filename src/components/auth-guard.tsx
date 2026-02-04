"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

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
            <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a]">
                <style>{`
                    @keyframes spin-smooth {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.6; }
                        50% { opacity: 1; }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    .spin-smooth {
                        animation: spin-smooth 3s linear infinite;
                    }
                    .pulse-glow {
                        animation: pulse-glow 2s ease-in-out infinite;
                    }
                    .float {
                        animation: float 3s ease-in-out infinite;
                    }
                `}</style>
                
                <div className="flex flex-col items-center gap-8">
                    {/* Logo Container with Glow Effect */}
                    <div className="relative">
                        {/* Outer Glow Ring */}
                        <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl scale-150"></div>
                        
                        {/* Animated Rings */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/30 spin-smooth"></div>
                        <div className="absolute inset-0 rounded-full border border-white/20 spin-smooth" style={{ animationDirection: 'reverse', animationDuration: '4s' }}></div>
                        
                        {/* Logo Circle Background */}
                        <div className="relative w-40 h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-2xl overflow-hidden">
                            {/* Inner Glow */}
                            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                            
                            {/* Logo Image - Cropped in Circle */}
                            <div className="relative z-10 float w-full h-full flex items-center justify-center">
                                <Image
                                    src="/enkamba-logo.png"
                                    alt="eNkamba"
                                    width={160}
                                    height={160}
                                    className="drop-shadow-lg object-cover w-full h-full"
                                    style={{ color: 'transparent' }}
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    {/* Loading Text */}
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-white text-2xl font-bold tracking-wide text-center max-w-xs">
                            La vie simplifiée et meilleure
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/60 pulse-glow" style={{ animationDelay: '0s' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/60 pulse-glow" style={{ animationDelay: '0.3s' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/60 pulse-glow" style={{ animationDelay: '0.6s' }}></span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Text */}
                    <p className="text-white/60 text-xs mt-4">Veuillez patienter...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
