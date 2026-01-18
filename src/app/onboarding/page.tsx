"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  ArrowRight,
  Wallet,
  MessageSquare,
  ShoppingCart,
  Package,
  Users,
  Send,
  PiggyBank,
  Globe,
  Heart,
  Shield,
  Zap,
  ChevronRight,
  Bot,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const slides = [
  {
    id: 1,
    module: "Bienvenue",
    title: "Bienvenue sur eNkamba",
    description:
      "L'écosystème digital tout-en-un pour gérer votre argent, communiquer, acheter et livrer. Tout ce dont vous avez besoin, en une seule application.",
    icon: null, // Logo à la place
    isLogo: true,
    decorations: [
      { icon: Heart },
      { icon: Shield },
      { icon: Zap },
    ],
    benefits: ["Multi-devises", "100% Sécurisé", "Support 24/7"],
  },
  {
    id: 2,
    module: "Mbongo",
    title: "Mbongo Wallet",
    description:
      "Envoyez de l'argent partout dans le monde depuis votre devise locale. Le bénéficiaire reçoit directement dans sa propre devise. Épargnez, accédez au crédit et participez aux tontines.",
    icon: Wallet,
    isLogo: false,
    decorations: [
      { icon: Send },
      { icon: PiggyBank },
      { icon: Shield },
    ],
    benefits: ["Conversion automatique", "Toutes devises", "Tontine digitale"],
  },
  {
    id: 3,
    module: "Miyiki-Chat",
    title: "Miyiki-Chat",
    description:
      "Une messagerie intégrée pour rester connecté. Discutez avec vos contacts, vos groupes, le support client et notre assistant IA, le tout au même endroit.",
    icon: MessageSquare,
    isLogo: false,
    decorations: [
      { icon: Users },
      { icon: Zap },
      { icon: Heart },
    ],
    benefits: ["Chat sécurisé", "Groupes illimités", "Appels intégrés"],
  },
  {
    id: 4,
    module: "Nkampa",
    title: "Nkampa Market",
    description:
      "Votre marketplace intégrée. Achetez, vendez et développez votre activité en toute simplicité. Paiement sécurisé et livraison facilitée.",
    icon: ShoppingCart,
    isLogo: false,
    decorations: [
      { icon: Globe },
      { icon: Shield },
      { icon: Heart },
    ],
    benefits: ["Vendeurs vérifiés", "Paiement sécurisé", "Livraison intégrée"],
  },
  {
    id: 5,
    module: "Ugavi",
    title: "Ugavi Delivery",
    description:
      "Envoyez et recevez des colis partout dans le monde. Suivi en temps réel, points relais pratiques et tarifs compétitifs pour toutes vos livraisons.",
    icon: Package,
    isLogo: false,
    decorations: [
      { icon: Globe },
      { icon: Zap },
      { icon: Shield },
    ],
    benefits: ["Suivi temps réel", "Livraison mondiale", "Points relais"],
  },
  {
    id: 6,
    module: "Makutano",
    title: "Makutano Social",
    description:
      "Le réseau social de l'écosystème. Partagez vos idées, connectez-vous avec d'autres utilisateurs, découvrez des projets innovants et soutenez des initiatives.",
    icon: Users,
    isLogo: false,
    decorations: [
      { icon: Heart },
      { icon: Globe },
      { icon: Zap },
    ],
    benefits: ["Réseau social", "Projets innovants", "Financement participatif"],
  },
  {
    id: 7,
    module: "eNkamba AI",
    title: "eNkamba.ai",
    description:
      "Votre assistant personnel intelligent. Analysez vos finances, détectez les anomalies, obtenez des recommandations personnalisées et générez des rapports détaillés.",
    icon: Bot,
    isLogo: false,
    decorations: [
      { icon: Sparkles },
      { icon: TrendingUp },
      { icon: Shield },
    ],
    benefits: ["Analyse financière", "Détection d'anomalies", "Rapports IA"],
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentSlide < slides.length - 1) {
      nextSlide();
    } else if (info.offset.x > threshold && currentSlide > 0) {
      prevSlide();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;
  const IconComponent = currentSlideData.icon;
  const Decoration0 = currentSlideData.decorations[0].icon;
  const Decoration1 = currentSlideData.decorations[1].icon;
  const Decoration2 = currentSlideData.decorations[2].icon;

  return (
    <div
      className="min-h-screen overflow-hidden relative"
      style={{
        background: "linear-gradient(to bottom right, #32BB78, #28a86a, #1e9f5e)",
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
        {/* Extra decorative elements */}
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
          <motion.span
            key={currentSlideData.module}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/70 text-sm font-medium bg-white/15 px-3 py-1 rounded-full"
          >
            {currentSlide + 1} / {slides.length}
          </motion.span>
          <Link href="/login">
            <span className="text-white/80 text-sm hover:text-white transition-colors flex items-center gap-1">
              Passer
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
            >
              {/* Decorative icons around main icon */}
              <div className="relative mb-6">
                {/* Top decorations */}
                <motion.div
                  className="absolute -top-6 -left-14 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Decoration0 className="w-4 h-4 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -top-6 -right-14 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Decoration1 className="w-4 h-4 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -left-16 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30"
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                >
                  <Decoration2 className="w-3 h-3 text-white" />
                </motion.div>

                {/* Connecting lines */}
                <svg
                  className="absolute inset-0 w-full h-full -z-10"
                  style={{
                    width: "180px",
                    height: "180px",
                    left: "-45px",
                    top: "-45px",
                  }}
                >
                  <motion.line
                    x1="25"
                    y1="35"
                    x2="70"
                    y2="70"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                  <motion.line
                    x1="155"
                    y1="35"
                    x2="110"
                    y2="70"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>

                {/* Main icon container */}
                <motion.div
                  className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-2xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {currentSlideData.isLogo ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
                      <Image
                        src="/enkamba-logo.png"
                        alt="eNkamba Logo"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white flex items-center justify-center shadow-lg p-4">
                      {IconComponent && (
                        <IconComponent className="w-10 h-10 text-[#32BB78]" />
                      )}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Module badge */}
              <motion.div
                className="mb-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <span className="bg-white text-[#32BB78] text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  {currentSlideData.module}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-2xl md:text-3xl font-bold text-white mb-3 font-headline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {currentSlideData.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-white/90 text-sm leading-relaxed max-w-xs mb-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {currentSlideData.description}
              </motion.p>

              {/* Benefits */}
              <motion.div
                className="flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {currentSlideData.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full border border-white/30"
                  >
                    {benefit}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom section */}
        <div className="w-full max-w-sm space-y-6">
          {/* Pagination dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Aller à la slide ${index + 1}`}
              />
            ))}
          </div>

          {/* CTA Button */}
          {isLastSlide ? (
            <Link href="/login" className="block">
              <Button className="w-full h-14 bg-white text-[#32BB78] hover:bg-white/90 rounded-full text-lg font-semibold shadow-lg border-0">
                C&apos;est parti !
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button
              onClick={nextSlide}
              className="w-full h-14 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full text-lg font-semibold border border-white/30"
            >
              Suivant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
