'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Video, Mic, MapPin, Clock, Heart, Shield, X } from 'lucide-react';

interface StoriesOnboardingProps {
  onClose: () => void;
}

export function StoriesOnboarding({ onClose }: StoriesOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Camera,
      title: 'Partagez vos moments',
      description: 'Capturez et partagez des photos, vidéos ou messages audio avec vos contacts',
      gradient: 'from-purple-500 to-pink-500',
      illustration: (
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl rotate-6 opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
            <Camera size={48} className="text-white" />
          </div>
        </div>
      ),
    },
    {
      icon: Heart,
      title: 'Exprimez vos émotions',
      description: 'Démontrez votre amour, votre joie et partagez vos sentiments avec ceux qui comptent',
      gradient: 'from-red-500 to-pink-500',
      illustration: (
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-full rotate-12 opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <Heart size={48} className="text-white fill-white" />
          </div>
        </div>
      ),
    },
    {
      icon: MapPin,
      title: 'Partagez votre localisation',
      description: 'Pour plus de sécurité, partagez où vous êtes avec vos proches en temps réel',
      gradient: 'from-blue-500 to-cyan-500',
      illustration: (
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl -rotate-6 opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <MapPin size={48} className="text-white" />
          </div>
        </div>
      ),
    },
    {
      icon: Clock,
      title: 'Choisissez la durée',
      description: 'Contrôlez combien de temps votre story reste visible: 5s, 10s, 15s, 30s ou 1 minute',
      gradient: 'from-orange-500 to-yellow-500',
      illustration: (
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full rotate-45 opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
            <Clock size={48} className="text-white" />
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md bg-gradient-to-br from-background to-muted border-2 border-primary/20 shadow-2xl">
        <div className="p-6 space-y-6">
          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="rounded-full hover:bg-muted"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Illustration */}
          <div className="py-4">
            {currentStepData.illustration}
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${currentStepData.gradient} shadow-lg`}>
              <IconComponent size={32} className="text-white" />
            </div>
            
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {currentStepData.title}
            </h2>
            
            <p className="text-muted-foreground text-base leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-4 gap-3 py-4">
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <Camera size={24} className="text-primary" />
              <span className="text-xs font-medium">Photo</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <Video size={24} className="text-primary" />
              <span className="text-xs font-medium">Vidéo</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <Mic size={24} className="text-primary" />
              <span className="text-xs font-medium">Audio</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <MapPin size={24} className="text-primary" />
              <span className="text-xs font-medium">Lieu</span>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 rounded-full"
            >
              Passer
            </Button>
            <Button
              onClick={handleNext}
              className={`flex-1 rounded-full bg-gradient-to-r ${currentStepData.gradient} text-white hover:opacity-90 shadow-lg`}
            >
              {currentStep < steps.length - 1 ? 'Suivant' : 'Commencer'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
