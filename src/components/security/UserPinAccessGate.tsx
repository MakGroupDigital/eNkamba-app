"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      setMessage("Code PIN créé. Confirmez-le pour ouvrir l’application.");
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
        setMessage("L’activation biométrique a été annulée.");
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
        "Biométrie activée. À la prochaine ouverture, l’appareil demandera Face ID, empreinte ou code téléphone.",
      );
    } catch (error) {
      console.error("Erreur activation biométrie:", error);
      setMessage("L’appareil n’a pas validé l’activation biométrique.");
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
    <main className="min-h-screen bg-[#32BB78] px-4 py-8 text-[#122116]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-36 w-36 items-center justify-center overflow-hidden rounded-[32px] bg-white">
              <Image
                src="/enkamba-logo.png"
                alt="eNkamba"
                width={144}
                height={144}
                className="h-full w-full object-cover"
                priority
              />
            </div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#32BB78] px-4 py-2 text-sm font-semibold text-white">
              <LockKeyhole className="h-4 w-4" />
              Ouverture protégée
            </div>

            <h2 className="text-2xl font-bold tracking-normal text-[#122116]">
              {isCreateMode
                ? "Créez votre PIN eNkamba"
                : "Confirmez votre identité"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#52635a]">
              {isCreateMode
                ? "Ce PIN sera utilisé pour ouvrir l’application et confirmer les paiements."
                : `Compte détecté : ${userLabel}. Utilisez votre biométrie ou votre PIN de paiement.`}
            </p>
          </div>

          {mode === "loading" ? (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-[#dbe8df] bg-[#f4faf6] p-4 text-[#52635a]">
              <Loader2 className="h-5 w-5 animate-spin text-[#32BB78]" />
              Vérification de la sécurité du compte...
            </div>
          ) : (
            <>
              {!isCreateMode &&
                biometricRegistration &&
                isBiometricAvailable && (
                  <Button
                    type="button"
                    onClick={() => void handleBiometricUnlock()}
                    disabled={isBiometricBusy}
                    className="mt-8 h-14 w-full rounded-2xl bg-[#122116] text-white hover:bg-[#24372a]"
                  >
                    {isBiometricBusy ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Fingerprint className="mr-2 h-5 w-5" />
                    )}
                    Déverrouiller avec l’appareil
                  </Button>
                )}

              <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="app-pin" className="text-[#122116]">
                    {isCreateMode ? "Nouveau code PIN" : "Code PIN"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="app-pin"
                      type={showPin ? "text" : "password"}
                      value={pin}
                      inputMode="numeric"
                      maxLength={4}
                      onChange={(event) => handlePinInput(event.target.value)}
                      placeholder="••••"
                      className="h-14 rounded-2xl border-[#d7e3db] bg-[#f4faf6] pr-12 text-center text-3xl font-bold tracking-[0.45em] text-[#122116] placeholder:text-[#9aaba1] focus-visible:ring-[#32BB78]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#52635a] transition hover:bg-[#e8f4ec] hover:text-[#122116]"
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
                </div>

                {isCreateMode && (
                  <div className="space-y-2">
                    <Label htmlFor="app-pin-confirm" className="text-[#122116]">
                      Confirmer le PIN
                    </Label>
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
                      className="h-14 rounded-2xl border-[#d7e3db] bg-[#f4faf6] text-center text-3xl font-bold tracking-[0.45em] text-[#122116] placeholder:text-[#9aaba1] focus-visible:ring-[#32BB78]"
                    />
                    {pin.length === 4 &&
                      confirmPin.length === 4 &&
                      pin === confirmPin && (
                        <p className="flex items-center gap-2 text-sm text-[#22945d]">
                          <CheckCircle2 className="h-4 w-4" />
                          Les codes PIN correspondent.
                        </p>
                      )}
                  </div>
                )}

                {message && (
                  <div className="flex gap-3 rounded-2xl border border-[#f2c94c] bg-[#fff8df] p-4 text-sm leading-5 text-[#6f5600]">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="h-14 w-full rounded-2xl bg-[#32BB78] text-base font-semibold text-white hover:bg-[#2a9d63]"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-5 w-5" />
                  )}
                  {isCreateMode ? "Créer le PIN" : "Accéder"}
                </Button>
              </form>

              {!isCreateMode &&
                isBiometricAvailable &&
                !biometricRegistration && (
                  <button
                    type="button"
                    onClick={() => void handleRegisterBiometric()}
                    disabled={isBiometricBusy}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d7e3db] bg-white px-4 py-4 text-sm font-medium text-[#122116] transition hover:bg-[#f4faf6]"
                  >
                    {isBiometricBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Fingerprint className="h-4 w-4" />
                    )}
                    Activer Face ID, empreinte ou code téléphone
                  </button>
                )}

              <p className="mt-6 text-center text-xs leading-5 text-[#52635a]">
                Les données biométriques restent dans l’appareil. eNkamba ne
                reçoit que la validation sécurisée du téléphone.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
