"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronLeft,
  User,
} from "lucide-react";

type AuthMode = "login" | "signup" | "forgot";

const USER_STORAGE_KEY = 'enkamba_user';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  const titles = {
    login: "Connexion",
    signup: "Inscription",
    forgot: "Mot de passe oublié",
  };

  const descriptions = {
    login: "Connectez-vous pour accéder à votre compte",
    signup: "Créez votre compte en quelques secondes",
    forgot: "Entrez votre email pour réinitialiser votre mot de passe",
  };

  return (
    <div
      className="min-h-screen overflow-hidden relative"
      style={{
        background:
          "linear-gradient(to bottom right, #32BB78, #28a86a, #1e9f5e)",
      }}
    >
      {/* Floating decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10"
          animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-8 w-24 h-24 rounded-full bg-white/10"
          animate={{ y: [0, -15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-20 h-20 rounded-full bg-white/10"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-60 right-16 w-16 h-16 rounded-full bg-white/10"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/3 right-4 w-2 h-2 rounded-full bg-white/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 left-8 w-3 h-3 rounded-full bg-white/60"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between px-6 py-8">
        {/* Header */}
        <div className="w-full flex justify-between items-center">
          <Link href="/onboarding">
            <span className="text-white/80 text-sm hover:text-white transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </span>
          </Link>
          <div className="w-16" />
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm py-8">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
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
              <h1 className="text-2xl font-bold text-white font-headline mb-2">
                {titles[mode]}
              </h1>
              <p className="text-white/80 text-sm">{descriptions[mode]}</p>
            </div>

            {/* Form Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl">
              {mode === "login" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type="email"
                      placeholder="Adresse e-mail"
                      className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      className="h-14 pl-12 pr-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-white/40 focus:ring-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => setMode("forgot")}
                    className="text-white/70 text-sm hover:text-white transition-colors w-full text-right"
                  >
                    Mot de passe oublié ?
                  </button>

                  <Button
                    className="w-full h-14 bg-white text-[#32BB78] hover:bg-white/90 rounded-xl text-lg font-semibold shadow-lg"
                    onClick={(e) => {
                      if (loginEmail) {
                        // Extraire le nom depuis l'email (partie avant @)
                        const nameFromEmail = loginEmail.split('@')[0];
                        const userData = {
                          name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
                          email: loginEmail,
                        };
                        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
                      }
                    }}
                    asChild
                  >
                    <Link href="/kyc">
                      Se connecter
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type="text"
                      placeholder="Nom complet"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type="tel"
                      placeholder="Numéro de téléphone"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type="email"
                      placeholder="Adresse e-mail"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      className="h-14 pl-12 pr-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-white/40 focus:ring-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <Button
                    className="w-full h-14 bg-white text-[#32BB78] hover:bg-white/90 rounded-xl text-lg font-semibold shadow-lg"
                    onClick={(e) => {
                      if (signupName && signupEmail) {
                        const userData = {
                          name: signupName,
                          email: signupEmail,
                          phone: signupPhone || undefined,
                        };
                        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
                      }
                    }}
                    asChild
                  >
                    <Link href="/kyc">
                      S&apos;inscrire
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}

              {mode === "forgot" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type="email"
                      placeholder="Adresse e-mail"
                      className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-white/40 focus:ring-white/20"
                    />
                  </div>

                  <p className="text-white/60 text-xs text-center">
                    Nous vous enverrons un lien pour réinitialiser votre mot de
                    passe.
                  </p>

                  <Button className="w-full h-14 bg-white text-[#32BB78] hover:bg-white/90 rounded-xl text-lg font-semibold shadow-lg">
                    Envoyer le lien
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <button
                    onClick={() => setMode("login")}
                    className="text-white/70 text-sm hover:text-white transition-colors w-full text-center flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour à la connexion
                  </button>
                </div>
              )}
            </div>

            {/* Toggle between login and signup */}
            {mode !== "forgot" && (
              <div className="mt-6 text-center">
                <p className="text-white/70 text-sm">
                  {mode === "login"
                    ? "Pas encore de compte ?"
                    : "Déjà un compte ?"}
                  <button
                    onClick={() =>
                      setMode(mode === "login" ? "signup" : "login")
                    }
                    className="text-white font-semibold ml-2 hover:underline"
                  >
                    {mode === "login" ? "S'inscrire" : "Se connecter"}
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-sm text-center">
          <p className="text-white/50 text-xs">
            En continuant, vous acceptez nos{" "}
            <Link href="#" className="text-white/70 hover:text-white underline">
              Conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="#" className="text-white/70 hover:text-white underline">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
