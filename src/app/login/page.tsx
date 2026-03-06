"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Mail,
  Phone,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Firebase imports
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInAnonymously
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, functions, db } from "@/lib/firebase";

// Authentification Email (Custom/Simulated in Dev)
import {
  generateOTPCode,
  saveEmailAuthData,
  sendEmailCode,
  getEmailAuthData,
  verifyOTPCode,
  clearEmailAuthData
} from "@/lib/email-auth";

// Capacitor Google Auth pour mobile natif
import { useCapacitorGoogleAuth } from "@/hooks/useCapacitorGoogleAuth";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneCountrySelector } from "@/components/phone-country-selector";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

type LoginMethod = "SELECT" | "EMAIL" | "PHONE" | "OTP_EMAIL" | "OTP_PHONE";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Hook Capacitor Google Auth
  const { signInWithGoogle: capacitorSignInWithGoogle, isNative } = useCapacitorGoogleAuth();

  // États
  const [method, setMethod] = useState<LoginMethod>("SELECT");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Refs
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Helper: Créer ou mettre à jour le profil utilisateur avec fallback Firestore
  const createOrUpdateProfile = async (userId: string, userEmail: string) => {
    try {
      // Essayer d'abord avec Cloud Function
      const createUserProfileFn = httpsCallable(functions, 'createOrUpdateUserProfile');
      await createUserProfileFn({ email: userEmail });
      console.log("Profil utilisateur créé avec succès via Cloud Function");
    } catch (err: any) {
      console.warn("Erreur Cloud Function, utilisation du fallback Firestore:", err.message);
      
      // Fallback: Créer directement dans Firestore
      try {
        await setDoc(doc(db, 'users', userId), {
          email: userEmail,
          uid: userId,
          createdAt: serverTimestamp(),
          kycStatus: 'not_started',
          lastLogin: serverTimestamp(),
        }, { merge: true });
        console.log("Profil utilisateur créé avec succès via Firestore");
      } catch (firestoreErr: any) {
        console.error("Erreur création profil Firestore:", firestoreErr);
        // Ne pas bloquer la connexion si la création du profil échoue
      }
    }
  };

  // Initialiser reCAPTCHA pour le téléphone
  useEffect(() => {
    if (!window.recaptchaVerifier && method === "PHONE") {
      try {
        auth.languageCode = 'fr'; // Définir la langue en français

        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible', // Mode invisible pour une meilleure UX
          'callback': () => {
            // reCAPTCHA solved
            console.log("reCAPTCHA résolu");
          },
          'expired-callback': () => {
            toast({
              variant: "destructive",
              title: "Expiration",
              description: "Le reCAPTCHA a expiré, veuillez réessayer."
            });
          }
        });
        window.recaptchaVerifier = verifier;
        recaptchaVerifierRef.current = verifier;
      } catch (error) {
        console.error("Erreur init reCAPTCHA:", error);
      }
    }
  }, [method, toast]);

  // --- HANDLERS ---

  // 1. Google Login (avec support Capacitor pour mobile natif)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      let result;
      
      if (isNative) {
        // Utiliser Capacitor Google Auth pour mobile natif
        console.log("🔐 Authentification Google native (Capacitor)");
        result = await capacitorSignInWithGoogle();
      } else {
        // Utiliser signInWithPopup pour web
        console.log("🌐 Authentification Google web (popup)");
        const provider = new GoogleAuthProvider();
        result = await signInWithPopup(auth, provider);
      }

      // Créer le profil utilisateur dans Firestore
      await createOrUpdateProfile(result.user.uid, result.user.email || '');

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur eNkamba !",
        className: "bg-[#32BB78] text-white border-none",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google Login Error:", error);
      
      // Gestion spécifique des erreurs
      if (error.code === 'auth/popup-blocked') {
        toast({
          variant: "destructive",
          title: "Popup bloquée",
          description: "Veuillez autoriser les popups pour ce site dans votre navigateur, puis réessayez.",
        });
      } else if (error.code === 'auth/cancelled-popup-request' || error.error === 'popup_closed_by_user') {
        toast({
          variant: "destructive",
          title: "Connexion annulée",
          description: "Vous avez fermé la fenêtre de connexion.",
        });
      } else if (error.code === 'auth/network-request-failed') {
        toast({
          variant: "destructive",
          title: "Problème de connexion",
          description: "Vérifiez votre connexion internet et réessayez.",
        });
      } else if (error.code === 'auth/internal-error') {
        toast({
          variant: "destructive",
          title: "Erreur interne",
          description: "Problème de connexion aux serveurs Firebase. Vérifiez votre connexion internet.",
        });
      } else if (error.error === 'DEVELOPER_ERROR' || error.message?.includes('CLIENT_ID')) {
        toast({
          variant: "destructive",
          title: "Configuration manquante",
          description: "L'authentification Google n'est pas encore configurée. Veuillez utiliser Email ou Téléphone.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: error.message || "Impossible de se connecter avec Google."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email Login (Start)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Générer et envoyer le code (simulé en dev)
      const code = generateOTPCode();
      await sendEmailCode(email, code);
      saveEmailAuthData(email, code);

      toast({
        title: "Code envoyé !",
        description: process.env.NODE_ENV === 'development'
          ? "Regardez dans la console (F12) pour le code 📧"
          : "Vérifiez votre boîte mail.",
      });

      setMethod("OTP_EMAIL");
    } catch (error: any) {
      console.error("Email Error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Email OTP Verify
  const handleEmailOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setIsLoading(true);
    try {
      const storedData = getEmailAuthData();

      if (!storedData || storedData.email !== email) {
        throw new Error("Session expirée. Recommencez.");
      }

      const isValid = verifyOTPCode(storedData.code, otpCode);

      if (isValid) {
        // Succès ! (En dev on simule la connexion utilisateur)
        // En production, on appellerait ici verifyEmailOTP Cloud Function
        clearEmailAuthData();

        // Simuler une session utilisateur dans localStorage pour le dev
        localStorage.setItem("enkamba_user", JSON.stringify({
          email: email,
          name: email.split('@')[0],
          provider: 'email'
        }));

        // CRITIQUE : Se connecter anonymement à Firebase pour avoir accès à Firestore (Chat IA)
        // même avec l'auth simulée par email
        if (process.env.NODE_ENV === 'development') {
          try {
            const result = await signInAnonymously(auth);
            console.log("Connexion Firebase Anonyme réussie pour l'accès Firestore");
            
            // Créer le profil utilisateur dans Firestore
            await createOrUpdateProfile(result.user.uid, email);
          } catch (err) {
            console.error("Erreur connexion anonyme:", err);
          }
        }

        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur eNkamba !",
          className: "bg-[#32BB78] text-white border-none",
        });

        router.push("/dashboard");
      } else {
        throw new Error("Code incorrect.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Phone Login (Start)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        throw new Error("reCAPTCHA non initialisé");
      }

      const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);

      toast({
        title: "SMS envoyé !",
        description: "Vérifiez vos messages.",
      });

      setMethod("OTP_PHONE");
    } catch (error: any) {
      console.error("Phone Error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
      // Reset captcha if needed
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined; // Force re-init next time
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Phone OTP Verify
  const handlePhoneOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !confirmationResult) return;

    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otpCode);

      // Créer le profil utilisateur dans Firestore
      await createOrUpdateProfile(result.user.uid, result.user.email || phone);

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur eNkamba !",
        className: "bg-[#32BB78] text-white border-none",
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Le code SMS est incorrect."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderSelectMethod = () => (
    <div className="w-full space-y-4">
      <Button
        variant="outline"
        className="w-full h-12 relative bg-white border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                d="M12.0003 20.45c4.6484 0 8.0844-3.2372 8.0844-8.1563 0-0.6469-.0703-1.2515-.1781-1.8328H12.0003v3.4734h4.7297c-.2438 1.4906-1.1297 2.8734-2.6578 3.7313v2.5312h3.9187V20.45z"
                fill="#4285F4"
              />
              <path
                d="M12.0003 24c3.2438 0 5.9578-1.0734 7.9453-2.9063l-3.9187-2.5312c-1.0781.7266-2.461 1.1578-4.0266 1.1578-3.1078 0-5.7422-2.1094-6.6844-4.9453H1.3815v2.625C3.391 21.3938 7.3972 24 12.0003 24z"
                fill="#34A853"
              />
              <path
                d="M5.3159 14.775c-.2444-.7313-.3831-1.5141-.3831-2.325 0-.8109.1388-1.5938.3831-2.325V7.5H1.3816C.5128 9.2437.0284 11.2172.0284 13.25c0 2.0328.4844 4.0063 1.3531 5.75l3.9344-2.625z"
                fill="#FBBC05"
              />
              <path
                d="M12.0003 5.3063c1.7672 0 3.3516.6094 4.5984 1.8l2.5875-2.5875C17.6112 2.9766 14.9956 2 12.0003 2c-4.6031 0-8.6094 2.6063-10.6188 6.5l3.9344 2.625c.9375-2.8359 3.5719-4.9453 6.6844-4.9453z"
                fill="#EA4335"
              />
            </svg>
            Continuer avec Google
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#32BB78] px-2 text-white/80">Ou continuer avec</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white border-0"
          onClick={() => setMethod("EMAIL")}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white border-0"
          onClick={() => setMethod("PHONE")}
        >
          <Phone className="mr-2 h-4 w-4" />
          Téléphone
        </Button>
      </div>
    </div>
  );

  const renderEmailForm = () => (
    <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email professionnel ou personnel</Label>
        <Input
          id="email"
          type="email"
          placeholder="nom@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/90 border-0 text-black placeholder:text-gray-400 focus-visible:ring-offset-2 focus-visible:ring-[#32BB78]"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-[#209058] hover:bg-[#186a41] text-white"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "Recevoir un code par email"}
      </Button>
    </form>
  );

  const renderPhoneForm = () => (
    <form onSubmit={handlePhoneSubmit} className="w-full space-y-4">
      <PhoneCountrySelector
        phone={phone}
        onPhoneChange={setPhone}
        selectedCountry={selectedCountry}
        onCountrySelect={setSelectedCountry}
        isLoading={isLoading}
      />

      {selectedCountry && (
        <Button
          type="submit"
          className="w-full bg-[#209058] hover:bg-[#186a41] text-white"
          disabled={isLoading || !phone || phone === selectedCountry.dialCode + " "}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Recevoir un code par SMS"}
        </Button>
      )}
    </form>
  );

  const renderOTPForm = (type: 'EMAIL' | 'PHONE') => (
    <form onSubmit={type === 'EMAIL' ? handleEmailOtpVerify : handlePhoneOtpVerify} className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-white/20 rounded-full">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white">Vérification</h3>
        <p className="text-white/80 text-sm">
          Entrez le code envoyé à <span className="font-bold">{type === 'EMAIL' ? email : phone}</span>
        </p>
      </div>

      <Input
        type="text"
        placeholder="000000"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        maxLength={6}
        className="text-center text-2xl tracking-widest bg-white/90 border-0 text-black h-14 font-mono"
        autoFocus
      />

      <Button
        type="submit"
        className="w-full bg-[#209058] hover:bg-[#186a41] text-white h-12 text-lg"
        disabled={isLoading || otpCode.length < 6}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : (
          <span className="flex items-center gap-2">
            Confirmer et continuer <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setOtpCode("");
            setMethod(type); // Retour à l'étape précédente
          }}
          className="text-white/60 text-xs hover:text-white underline"
        >
          Renvoyer le code ou changer de {type === 'EMAIL' ? 'mail' : 'numéro'}
        </button>
      </div>
    </form>
  );

  return (
    <div
      className="min-h-screen overflow-hidden relative"
      style={{
        background:
          "linear-gradient(to bottom right, #32BB78, #28a86a, #1e9f5e)",
      }}
    >
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10"
          animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-20 h-20 rounded-full bg-white/10"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between px-6 py-8">

        {/* Header */}
        <div className="w-full flex justify-between items-center max-w-md">
          <Link href="/onboarding">
            <span className="text-white/80 text-sm hover:text-white transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </span>
          </Link>
          <div className="w-16" />
        </div>

        {/* Auth Card */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm py-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-xl overflow-hidden"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/enkamba-logo.png"
                alt="eNkamba Logo"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-white font-headline mb-1">
              {method === "SELECT" ? "Connexion eNkamba" :
                method === "EMAIL" ? "Connexion par Email" :
                  method === "PHONE" ? "Connexion par Téléphone" : "Vérification"}
            </h1>
            <p className="text-white/80 text-sm">
              {method === "SELECT" ? "Identifiez-vous pour accéder à votre espace." :
                method === "OTP_EMAIL" || method === "OTP_PHONE" ? "Sécurisons votre compte." :
                  "Nous allons vous envoyer un code de vérification."}
            </p>
          </div>

          {/* Form Container */}
          <motion.div
            className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {method === "SELECT" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {renderSelectMethod()}
                </motion.div>
              )}

              {method === "EMAIL" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {renderEmailForm()}
                  <Button variant="ghost" className="w-full mt-4 text-white/60 hover:text-white hover:bg-white/10" onClick={() => setMethod("SELECT")}>
                    Annuler
                  </Button>
                </motion.div>
              )}

              {method === "PHONE" && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {renderPhoneForm()}
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-white/60 hover:text-white hover:bg-white/10" 
                    onClick={() => {
                      setMethod("SELECT");
                      setSelectedCountry(null);
                      setPhone("");
                    }}
                  >
                    Annuler
                  </Button>
                </motion.div>
              )}

              {method === "OTP_EMAIL" && (
                <motion.div
                  key="otp-email"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {renderOTPForm('EMAIL')}
                </motion.div>
              )}

              {method === "OTP_PHONE" && (
                <motion.div
                  key="otp-phone"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {renderOTPForm('PHONE')}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* Footer */}
        <div className="w-full max-w-sm text-center">
          <p className="text-white/50 text-xs">
            eNkamba.io &copy; 2026<br />
            Global solution et services sarl
          </p>
        </div>
      </div>

      {/* Global reCAPTCHA container (must be always present) */}
      <div id="recaptcha-container"></div>

      {/* Global Type Helper for Recaptcha */}
      <script dangerouslySetInnerHTML={{
        __html: `window.recaptchaVerifier = null;`
      }} />
    </div>
  );
}

// Add types for window
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}
