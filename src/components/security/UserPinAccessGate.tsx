"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SESSION_PREFIX = "enkamba-user-pin-unlocked";
const BIOMETRIC_PREFIX = "enkamba-user-biometric";
const MAX_ATTEMPTS = 3;

type GateMode =
  | "loading"
  | "no-user"
  | "create-pin"
  | "verify-pin"
  | "unlocked";

type BiometricRegistration = {
  credentialId: string;
  createdAt: string;
  label: string;
};

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function randomChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

function getStoredUserLabel(user: User | null): string {
  if (user?.email) return user.email;
  if (user?.phoneNumber) return user.phoneNumber;
  if (typeof window === "undefined") return "Utilisateur eNkamba";

  try {
    const storedUser = localStorage.getItem("enkamba_user");
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    return (
      parsed?.email || parsed?.phone || parsed?.name || "Utilisateur eNkamba"
    );
  } catch {
    return "Utilisateur eNkamba";
  }
}

async function isPlatformBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential)
    return false;
  if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)
    return true;

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function UserPinAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<GateMode>("loading");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);
  const [biometricRegistration, setBiometricRegistration] =
    useState<BiometricRegistration | null>(null);
  const [hasAutoPromptedBiometric, setHasAutoPromptedBiometric] =
    useState(false);
  const [userLabel, setUserLabel] = useState("Utilisateur eNkamba");

  const shouldSkipGate = useMemo(() => {
    return (
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/api") ||
      pathname?.startsWith("/enkamba-returns")
    );
  }, [pathname]);

  const sessionKey = user?.uid ? `${SESSION_PREFIX}:${user.uid}` : "";
  const biometricKey = user?.uid ? `${BIOMETRIC_PREFIX}:${user.uid}` : "";

  const markUnlocked = useCallback(() => {
    if (sessionKey) {
      sessionStorage.setItem(sessionKey, "true");
    }
    setMode("unlocked");
  }, [sessionKey]);

  const loadSecurityState = useCallback(
    async (currentUser: User | null) => {
      if (shouldSkipGate) {
        setMode("unlocked");
        return;
      }

      if (!currentUser) {
        setMode("no-user");
        return;
      }

      const currentSessionKey = `${SESSION_PREFIX}:${currentUser.uid}`;
      const currentBiometricKey = `${BIOMETRIC_PREFIX}:${currentUser.uid}`;

      if (sessionStorage.getItem(currentSessionKey) === "true") {
        setMode("unlocked");
        return;
      }

      try {
        const [pinDoc, biometricAvailable] = await Promise.all([
          getDoc(doc(db, "users", currentUser.uid, "security", "pin")),
          isPlatformBiometricAvailable(),
        ]);

        setIsBiometricAvailable(biometricAvailable);

        const savedBiometric = localStorage.getItem(currentBiometricKey);
        setBiometricRegistration(
          savedBiometric ? JSON.parse(savedBiometric) : null,
        );
        setMode(pinDoc.exists() ? "verify-pin" : "create-pin");
      } catch (error) {
        console.error("Erreur chargement sécurité utilisateur:", error);
        setMessage("Impossible de vérifier la sécurité du compte. Réessayez.");
        setMode("verify-pin");
      }
    },
    [shouldSkipGate],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setPin("");
      setConfirmPin("");
      setAttempts(0);
      setMessage("");
      setUserLabel(getStoredUserLabel(currentUser));
      setHasAutoPromptedBiometric(false);
      void loadSecurityState(currentUser);
    });

    return () => unsubscribe();
  }, [loadSecurityState]);

  const verifyPinValue = useCallback(
    async (value: string) => {
      if (!user) return false;

      const pinDoc = await getDoc(
        doc(db, "users", user.uid, "security", "pin"),
      );
      const storedPin = pinDoc.data()?.pin;

      return storedPin === btoa(value);
    },
    [user],
  );

  const handleCreatePin = async () => {
    if (!user || pin.length !== 4 || pin !== confirmPin) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      await setDoc(doc(db, "users", user.uid, "security", "pin"), {
        pin: btoa(pin),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setPin("");
      setConfirmPin("");
      setMode("verify-pin");
      setMessage("Code PIN créé. Confirmez-le pour ouvrir l'application.");
    } catch (error) {
      console.error("Erreur création PIN accès app:", error);
      setMessage("Impossible de créer le code PIN pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!user || pin.length !== 4) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const isValid = await verifyPinValue(pin);

      if (isValid) {
        setPin("");
        setAttempts(0);
        markUnlocked();
        return;
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPin("");
      setMessage(
        nextAttempts >= MAX_ATTEMPTS
          ? "Trop de tentatives. Patientez puis réessayez."
          : `Code PIN incorrect. Il reste ${MAX_ATTEMPTS - nextAttempts} tentative(s).`,
      );
    } catch (error) {
      console.error("Erreur vérification PIN accès app:", error);
      setMessage("Impossible de vérifier le code PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterBiometric = async () => {
    if (!user || !biometricKey || !window.PublicKeyCredential) return;

    setIsBiometricBusy(true);
    setMessage("");

    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: randomChallenge(),
          rp: { name: "eNkamba" },
          user: {
            id: new TextEncoder().encode(user.uid),
            name: getStoredUserLabel(user),
            displayName: user.displayName || getStoredUserLabel(user),
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            residentKey: "preferred",
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        setMessage("L'activation biométrique a été annulée.");
        return;
      }

      const registration: BiometricRegistration = {
        credentialId: bufferToBase64Url(credential.rawId),
        createdAt: new Date().toISOString(),
        label: "Biométrie appareil",
      };

      localStorage.setItem(biometricKey, JSON.stringify(registration));
      setBiometricRegistration(registration);

      await setDoc(
        doc(db, "users", user.uid, "security", "biometric"),
        {
          enabled: true,
          credentialId: registration.credentialId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      setMessage(
        "Biométrie activée avec succès.",
      );
    } catch (error) {
      console.error("Erreur activation biométrie:", error);
      setMessage("L'appareil n'a pas validé l'activation biométrique.");
    } finally {
      setIsBiometricBusy(false);
    }
  };

  const handleBiometricUnlock = useCallback(async () => {
    if (!biometricRegistration || !window.PublicKeyCredential) return;

    setIsBiometricBusy(true);
    setMessage("");

    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          allowCredentials: [
            {
              id: base64UrlToBuffer(biometricRegistration.credentialId),
              type: "public-key",
            },
          ],
          timeout: 60000,
          userVerification: "required",
        },
      });

      if (assertion) {
        markUnlocked();
      } else {
        setMessage("Authentification appareil annulée.");
      }
    } catch (error) {
      console.error("Erreur déverrouillage biométrique:", error);
      setMessage(
        "Face ID, empreinte ou code téléphone non validé. Utilisez le PIN.",
      );
    } finally {
      setIsBiometricBusy(false);
    }
  }, [biometricRegistration, markUnlocked]);

  useEffect(() => {
    if (
      mode === "verify-pin" &&
      biometricRegistration &&
      isBiometricAvailable &&
      !hasAutoPromptedBiometric
    ) {
      setHasAutoPromptedBiometric(true);
      void handleBiometricUnlock();
    }
  }, [
    biometricRegistration,
    handleBiometricUnlock,
    hasAutoPromptedBiometric,
    isBiometricAvailable,
    mode,
  ]);

  const handlePinInput = (value: string) => {
    setPin(value.replace(/\D/g, "").slice(0, 4));
  };

  const handleConfirmPinInput = (value: string) => {
    setConfirmPin(value.replace(/\D/g, "").slice(0, 4));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "create-pin") {
      void handleCreatePin();
    } else {
      void handleVerifyPin();
    }
  };

  if (mode === "unlocked" || shouldSkipGate) {
    return <>{children}</>;
  }

  if (mode === "no-user") {
    return <>{children}</>;
  }

  const isCreateMode = mode === "create-pin";
  const canSubmit = isCreateMode
    ? pin.length === 4 && confirmPin.length === 4 && pin === confirmPin
    : pin.length === 4 && attempts < MAX_ATTEMPTS;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 px-4 py-8 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full space-y-8">
          {/* Logo avec effet flottant */}
          <div className="flex justify-center">
            <div className="relative animate-float">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"></div>
              <div className="relative h-28 w-28 overflow-hidden rounded-full bg-primary shadow-2xl ring-4 ring-white/60">
                <Image
                  src="/enkamba-logo.png"
                  alt="eNkamba"
                  width={112}
                  height={112}
                  className="h-full w-full scale-[1.42] rounded-full object-cover [clip-path:circle(50%_at_50%_50%)]"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Titre minimaliste */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCreateMode ? "Créer un PIN" : "Bienvenue"}
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              {isCreateMode
                ? "Sécurisez votre compte avec un code à 4 chiffres"
                : "Confirmez votre identité pour continuer"}
            </p>
          </div>

          {mode === "loading" ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Vérification...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bouton biométrique minimaliste */}
              {!isCreateMode &&
                biometricRegistration &&
                isBiometricAvailable && (
                  <button
                    type="button"
                    onClick={() => void handleBiometricUnlock()}
                    disabled={isBiometricBusy}
                    className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/90 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex flex-col items-center gap-2">
                      {isBiometricBusy ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Fingerprint className="h-6 w-6" />
                      )}
                      <span className="text-sm font-medium">
                        Déverrouiller
                      </span>
                    </div>
                  </button>
                )}

              {/* Formulaire PIN minimaliste */}
              <form onSubmit={submit} className="space-y-4">
                {/* Champ PIN avec design épuré */}
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      id="app-pin"
                      type={showPin ? "text" : "password"}
                      value={pin}
                      inputMode="numeric"
                      maxLength={4}
                      onChange={(event) => handlePinInput(event.target.value)}
                      placeholder="••••"
                      className="h-16 rounded-2xl border-2 border-gray-200 bg-white text-center text-3xl font-bold tracking-[0.5em] text-gray-900 placeholder:text-gray-300 focus:border-primary focus:ring-0 focus-visible:ring-0 transition-colors"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      aria-label={
                        showPin ? "Masquer le PIN" : "Afficher le PIN"
                      }
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    {isCreateMode ? "Entrez 4 chiffres" : "Entrez votre PIN"}
                  </p>
                </div>

                {/* Confirmation PIN */}
                {isCreateMode && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        id="app-pin-confirm"
                        type={showPin ? "text" : "password"}
                        value={confirmPin}
                        inputMode="numeric"
                        maxLength={4}
                        onChange={(event) =>
                          handleConfirmPinInput(event.target.value)
                        }
                        placeholder="••••"
                        className="h-16 rounded-2xl border-2 border-gray-200 bg-white text-center text-3xl font-bold tracking-[0.5em] text-gray-900 placeholder:text-gray-300 focus:border-primary focus:ring-0 focus-visible:ring-0 transition-colors"
                      />
                    </div>
                    {pin.length === 4 &&
                      confirmPin.length === 4 &&
                      pin === confirmPin && (
                        <div className="flex items-center justify-center gap-2 text-sm text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Correspondance validée</span>
                        </div>
                      )}
                  </div>
                )}

                {/* Message d'erreur minimaliste */}
                {message && (
                  <div className="rounded-xl bg-[#FFA500]/10 border border-[#FFA500]/30 p-3 text-center">
                    <p className="text-sm text-[#FFA500]">{message}</p>
                  </div>
                )}

                {/* Bouton de validation minimaliste */}
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="h-14 w-full rounded-2xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>{isCreateMode ? "Créer" : "Continuer"}</span>
                  )}
                </Button>
              </form>

              {/* Bouton activer biométrie - design minimaliste */}
              {!isCreateMode &&
                isBiometricAvailable &&
                !biometricRegistration && (
                  <button
                    type="button"
                    onClick={() => void handleRegisterBiometric()}
                    disabled={isBiometricBusy}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isBiometricBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Fingerprint className="h-4 w-4" />
                    )}
                    Activer la biométrie
                  </button>
                )}

              {/* Note de sécurité minimaliste */}
              <p className="text-center text-xs text-gray-400 max-w-xs mx-auto">
                Vos données biométriques restent sécurisées sur cet appareil
              </p>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
