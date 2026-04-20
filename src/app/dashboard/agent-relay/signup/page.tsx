'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Phone,
  User,
  Building,
  Camera,
  Fingerprint,
  CheckCircle2,
  Upload,
  FileText,
  Shield,
  Lock,
  X,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { BiometricCapture } from '@/components/agent-relay/BiometricCapture';
import { AgentContract } from '@/components/agent-relay/AgentContract';

interface SignupData {
  agentType: string;
  phoneNumber: string;
  pin: string;
  confirmPin: string;
  profileType: 'individual' | 'enterprise';
  fullName: string;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  idPhotos: File[];
  selfieUrl: string;
  videoUrl: string;
  fingerprint: string;
  signature: string;
  // Confirmations étape 5
  confirmAccuracy: boolean;
  confirmContract: boolean;
}

// Fonction pour hasher le PIN (simple hash pour le client)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const agentTypes = {
  'agent-relais': { title: 'Agent Relais', color: 'bg-primary' },
  'cabinet': { title: 'Cabiniste', color: 'bg-orange-600' },
  'point-service': { title: 'Point de Service', color: 'bg-orange-600' }
};

export default function AgentSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentType = searchParams.get('type') || 'agent-relais';
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationDocId, setApplicationDocId] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [signupData, setSignupData] = useState<SignupData>({
    agentType: agentType,
    phoneNumber: '',
    pin: '',
    confirmPin: '',
    profileType: 'individual',
    fullName: '',
    dateOfBirth: '',
    idType: '',
    idNumber: '',
    idPhotos: [],
    selfieUrl: '',
    videoUrl: '',
    fingerprint: '',
    signature: '',
    confirmAccuracy: false,
    confirmContract: false
  });

  const totalSteps = 5;

  // Charger la progression au montage
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.uid) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        // Charger le profil utilisateur pour pré-remplir le téléphone
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.phone && !signupData.phoneNumber) {
            setSignupData(prev => ({
              ...prev,
              phoneNumber: userData.phone
            }));
          }
        }

        // Chercher une application existante pour cet utilisateur
        // Requête simplifiée: chercher par userId seulement, puis filtrer manuellement
        const q = query(
          collection(db, 'agentRelayApplications'),
          where('userId', '==', user.uid)
        );

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          // Filtrer par agentType et trier manuellement par createdAt (plus récent en premier)
          const docs = snapshot.docs
            .filter(doc => doc.data().agentType === agentType)
            .sort((a, b) => {
              const aTime = a.data().createdAt?.toMillis() || 0;
              const bTime = b.data().createdAt?.toMillis() || 0;
              return bTime - aTime;
            });
          
          if (docs.length > 0) {
            const latestDoc = docs[0];
            const data = latestDoc.data();
            
            // Si déjà soumis, rediriger vers status
            if (data.status === 'submitted') {
              router.push('/dashboard/agent-relay/status');
              return;
            }
            
            // Si approuvé, rediriger vers dashboard
            if (data.status === 'approved') {
              router.push('/dashboard/agent-relay/dashboard');
              return;
            }

            // Charger les données existantes (seulement si in_progress)
            if (data.status === 'in_progress') {
              setApplicationDocId(latestDoc.id);
              setSignupData(prev => ({
                ...prev,
                phoneNumber: data.phoneNumber || prev.phoneNumber,
                profileType: data.profileType || 'individual',
                fullName: data.fullName || '',
                dateOfBirth: data.dateOfBirth || '',
                idType: data.idType || '',
                idNumber: data.idNumber || '',
                selfieUrl: data.selfieUrl || '',
                videoUrl: data.videoUrl || ''
              }));

              // Déterminer l'étape actuelle basée sur currentStep sauvegardé
              const savedStep = data.currentStep || 1;
              setCurrentStep(savedStep);
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement progression:', err);
        // En cas d'erreur, continuer avec l'étape 1
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadProgress();
  }, [user, agentType, router]);

  const updateData = (field: string, value: any) => {
    setSignupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = async () => {
    setError(null);
    
    // Validation pour l'étape 1 (numéro et PIN)
    if (currentStep === 1) {
      if (!signupData.phoneNumber || signupData.phoneNumber.length < 10) {
        setError('Veuillez entrer un numéro de téléphone valide');
        return;
      }
      if (!signupData.pin || signupData.pin.length !== 4) {
        setError('Le PIN doit contenir 4 chiffres');
        return;
      }
      if (signupData.pin !== signupData.confirmPin) {
        setError('Les codes PIN ne correspondent pas');
        return;
      }
      
      // Sauvegarder dans Firestore avec PIN hashé
      try {
        setIsLoading(true);
        const hashedPin = await hashPin(signupData.pin);
        
        if (applicationDocId) {
          // Mettre à jour le document existant
          await updateDoc(doc(db, 'agentRelayApplications', applicationDocId), {
            phoneNumber: signupData.phoneNumber,
            pinHash: hashedPin,
            currentStep: 2,
            updatedAt: serverTimestamp()
          });
        } else {
          // Créer un nouveau document
          const docRef = await addDoc(collection(db, 'agentRelayApplications'), {
            userId: user?.uid || 'anonymous',
            agentType: signupData.agentType,
            phoneNumber: signupData.phoneNumber,
            pinHash: hashedPin,
            status: 'in_progress',
            currentStep: 2,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setApplicationDocId(docRef.id);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur sauvegarde:', err);
        setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
        setIsLoading(false);
        return;
      }
    }
    
    // Sauvegarde étape 2 (profil)
    if (currentStep === 2 && applicationDocId) {
      try {
        setIsLoading(true);
        await updateDoc(doc(db, 'agentRelayApplications', applicationDocId), {
          profileType: signupData.profileType,
          currentStep: 3,
          updatedAt: serverTimestamp()
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur sauvegarde profil:', err);
        setError('Erreur lors de la sauvegarde.');
        setIsLoading(false);
        return;
      }
    }
    
    // Validation pour l'étape 3 (informations d'identité)
    if (currentStep === 3) {
      if (!signupData.fullName || signupData.fullName.trim().length < 3) {
        setError('Veuillez entrer votre nom complet');
        return;
      }
      if (!signupData.dateOfBirth) {
        setError('Veuillez entrer votre date de naissance');
        return;
      }
      if (!signupData.idType) {
        setError('Veuillez sélectionner un type de pièce d\'identité');
        return;
      }
      if (!signupData.idNumber || signupData.idNumber.trim().length < 5) {
        setError('Veuillez entrer un numéro de pièce d\'identité valide');
        return;
      }
      
      // Sauvegarder l'étape 3
      if (applicationDocId) {
        try {
          setIsLoading(true);
          await updateDoc(doc(db, 'agentRelayApplications', applicationDocId), {
            fullName: signupData.fullName,
            dateOfBirth: signupData.dateOfBirth,
            idType: signupData.idType,
            idNumber: signupData.idNumber,
            currentStep: 4,
            updatedAt: serverTimestamp()
          });
          setIsLoading(false);
        } catch (err) {
          console.error('Erreur sauvegarde identité:', err);
          setError('Erreur lors de la sauvegarde.');
          setIsLoading(false);
          return;
        }
      }
    }
    
    // Sauvegarde étape 4 (biométrie) - déjà sauvegardé via BiometricCapture
    if (currentStep === 4 && applicationDocId) {
      try {
        setIsLoading(true);
        await updateDoc(doc(db, 'agentRelayApplications', applicationDocId), {
          currentStep: 5,
          updatedAt: serverTimestamp()
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur sauvegarde biométrie:', err);
        setError('Erreur lors de la sauvegarde.');
        setIsLoading(false);
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    // Empêcher le retour en arrière
    setError('Vous ne pouvez pas revenir en arrière. Chaque étape est sauvegardée.');
  };

  const handleSubmit = async () => {
    // Validation étape 5
    if (!signupData.confirmAccuracy) {
      setError('Veuillez confirmer l\'exactitude des informations');
      return;
    }
    if (!signupData.confirmContract) {
      setError('Veuillez accepter les termes et conditions');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!applicationDocId) {
        setError('Erreur: Document d\'application non trouvé');
        setIsLoading(false);
        return;
      }
      
      // Mettre à jour le document existant avec toutes les données
      const docRef = doc(db, 'agentRelayApplications', applicationDocId);
      await updateDoc(docRef, {
        profileType: signupData.profileType,
        fullName: signupData.fullName,
        dateOfBirth: signupData.dateOfBirth,
        idType: signupData.idType,
        idNumber: signupData.idNumber,
        selfieUrl: signupData.selfieUrl,
        videoUrl: signupData.videoUrl,
        confirmAccuracy: signupData.confirmAccuracy,
        confirmContract: signupData.confirmContract,
        status: 'submitted',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      router.push('/dashboard/agent-relay/success');
    } catch (err) {
      console.error('Erreur soumission:', err);
      setError('Erreur lors de la soumission. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="px-6 py-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Numéro de Téléphone
              </h2>
              <p className="text-sm text-gray-600">
                Entrez votre numéro et définissez un code PIN
              </p>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone size={16} />
                  Numéro de Téléphone
                </label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={signupData.phoneNumber}
                  onChange={(e) => {
                    // Ne garder que les chiffres, +, espaces et tirets
                    const value = e.target.value.replace(/[^\d+\s-]/g, '');
                    updateData('phoneNumber', value);
                  }}
                  placeholder="+243 99 123 4567"
                  className="h-12 text-center text-lg border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 text-center">
                  Format: +243 suivi de votre numéro
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock size={16} />
                  Définir un code PIN (4 chiffres)
                </label>
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    value={signupData.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      updateData('pin', value);
                    }}
                    placeholder="••••"
                    className="h-12 text-center text-2xl tracking-widest border-gray-300 rounded-lg pr-12"
                    maxLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock size={16} />
                  Confirmer le code PIN
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPin ? "text" : "password"}
                    inputMode="numeric"
                    value={signupData.confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      updateData('confirmPin', value);
                    }}
                    placeholder="••••"
                    className="h-12 text-center text-2xl tracking-widest border-gray-300 rounded-lg pr-12"
                    maxLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-[#32BB78]/10 border border-[#32BB78]/30">
                <p className="text-xs text-gray-600 text-center">
                  Ce code PIN sera utilisé pour sécuriser votre compte agent
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="px-6 py-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Sélection du Profil
              </h2>
              <p className="text-sm text-gray-600">
                Choisissez votre type de profil
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateData('profileType', 'individual')}
                className={`p-8 rounded-2xl border-2 transition-all ${
                  signupData.profileType === 'individual'
                    ? 'border-[#32BB78] bg-[#32BB78]/10'
                    : 'border-gray-200 bg-white hover:border-[#32BB78]/50'
                }`}
              >
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-[#32BB78]/20 flex items-center justify-center">
                    <User size={32} className="text-[#32BB78]" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Individuel</h3>
                </div>
              </button>
              
              <button
                onClick={() => updateData('profileType', 'enterprise')}
                className={`p-8 rounded-2xl border-2 transition-all ${
                  signupData.profileType === 'enterprise'
                    ? 'border-[#32BB78] bg-[#32BB78]/10'
                    : 'border-gray-200 bg-white hover:border-[#32BB78]/50'
                }`}
              >
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-[#32BB78]/20 flex items-center justify-center">
                    <Building size={32} className="text-[#32BB78]" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Entreprise</h3>
                </div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="px-6 py-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Informations d'Identité
              </h2>
              <p className="text-sm text-gray-600">
                Complétez vos données personnelles
              </p>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Nom Complet</label>
                <Input
                  value={signupData.fullName}
                  onChange={(e) => updateData('fullName', e.target.value)}
                  placeholder="Votre nom complet"
                  className="h-12 border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Date de Naissance</label>
                <Input
                  type="date"
                  value={signupData.dateOfBirth}
                  onChange={(e) => updateData('dateOfBirth', e.target.value)}
                  className="h-12 border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Type de Pièce d'Identité</label>
                <Select 
                  value={signupData.idType}
                  onValueChange={(value) => updateData('idType', value)}
                >
                  <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cni">Carte Nationale d'Identité</SelectItem>
                    <SelectItem value="passport">Passeport</SelectItem>
                    <SelectItem value="permis">Permis de Conduire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Numéro de la Pièce d'Identité</label>
                <Input
                  value={signupData.idNumber}
                  onChange={(e) => updateData('idNumber', e.target.value)}
                  placeholder="Numéro de votre pièce d'identité"
                  className="h-12 border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Photos des Documents</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      updateData('idPhotos', files);
                    }}
                    className="hidden"
                    id="id-photos-upload"
                  />
                  <label
                    htmlFor="id-photos-upload"
                    className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-[#32BB78] rounded-lg cursor-pointer hover:bg-[#32BB78]/5 transition-colors"
                  >
                    <Upload size={16} className="text-[#32BB78]" />
                    <span className="text-sm font-medium text-[#32BB78]">
                      {signupData.idPhotos.length > 0 
                        ? `${signupData.idPhotos.length} fichier(s) sélectionné(s)` 
                        : 'Ajouter Photos des Documents'}
                    </span>
                  </label>
                </div>
                {signupData.idPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {signupData.idPhotos.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1 bg-[#32BB78]/10 rounded-lg">
                        <FileText size={14} className="text-[#32BB78]" />
                        <span className="text-xs text-gray-700">{file.name}</span>
                        <button
                          onClick={() => {
                            const newFiles = signupData.idPhotos.filter((_, i) => i !== index);
                            updateData('idPhotos', newFiles);
                          }}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="px-6 py-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Vérification Biométrique
              </h2>
              <p className="text-sm text-gray-600">
                Capturez vos données biométriques
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Selfie avec caméra */}
              <BiometricCapture
                type="photo"
                onCapture={async (url) => {
                  updateData('selfieUrl', url);
                  // Sauvegarder immédiatement dans Firestore
                  if (applicationDocId && url) {
                    try {
                      await updateDoc(doc(db, 'agentRelayApplications', applicationDocId), {
                        selfieUrl: url,
                        updatedAt: serverTimestamp()
                      });
                    } catch (err) {
                      console.error('Erreur sauvegarde selfie:', err);
                    }
                  }
                }}
                capturedUrl={signupData.selfieUrl || null}
              />
              
              {/* Vidéo avec caméra */}
              <BiometricCapture
                type="video"
                onCapture={async (url) => {
                  updateData('videoUrl', url);
                  // Sauvegarder immédiatement dans Firestore
                  if (applicationDocId && url) {
                    try {
                      await updateDoc(doc(db, 'agentRelayApplications', applicationDocId), {
                        videoUrl: url,
                        updatedAt: serverTimestamp()
                      });
                    } catch (err) {
                      console.error('Erreur sauvegarde vidéo:', err);
                    }
                  }
                }}
                capturedUrl={signupData.videoUrl || null}
              />
              
              {/* Empreinte digitale - Placeholder */}
              <div className="p-6 rounded-2xl bg-gray-100 border border-gray-300">
                <div className="text-center">
                  <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <Fingerprint size={32} className="text-gray-500" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-800">Empreinte Digitale</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Cette fonctionnalité sera disponible lors de la formation
                  </p>
                  <Button 
                    variant="outline" 
                    disabled
                    className="cursor-not-allowed"
                  >
                    Non disponible en ligne
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="px-6 py-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Résumé de l'Inscription
              </h2>
              <p className="text-sm text-gray-600">
                Vérifiez vos informations avant de soumettre
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-800">Informations Personnelles</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type d'agent:</span>
                    <span className="font-medium text-gray-800">
                      {agentTypes[signupData.agentType as keyof typeof agentTypes]?.title || 'Agent Relais'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profil:</span>
                    <span className="font-medium text-gray-800">
                      {signupData.profileType === 'individual' ? 'Individuel' : 'Entreprise'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span className="font-medium text-gray-800">{signupData.fullName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de naissance:</span>
                    <span className="font-medium text-gray-800">{signupData.dateOfBirth || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="font-medium text-gray-800">{signupData.phoneNumber}</span>
                  </div>
                </div>
              </div>
              
              {/* Documents */}
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-800">Documents</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type de pièce:</span>
                    <span className="font-medium text-gray-800">
                      {signupData.idType === 'cni' ? 'CNI' : 
                       signupData.idType === 'passport' ? 'Passeport' : 
                       signupData.idType === 'permis' ? 'Permis' : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro:</span>
                    <span className="font-medium text-gray-800">{signupData.idNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Photos documents:</span>
                    <span className="font-medium text-gray-800">{signupData.idPhotos.length} fichier(s)</span>
                  </div>
                </div>
              </div>
              
              {/* Vérification biométrique */}
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-800">Vérification Biométrique</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {signupData.selfieUrl ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm text-gray-700">Selfie capturé</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {signupData.videoUrl ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm text-gray-700">Vidéo de vérification</span>
                  </div>
                </div>
              </div>
              
              {/* Confirmation */}
              <div className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  </div>
                )}
                
                {/* Bouton pour lire le contrat */}
                <button
                  onClick={() => setShowContract(true)}
                  className="w-full p-4 rounded-lg border-2 border-[#32BB78] bg-[#32BB78]/5 hover:bg-[#32BB78]/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-[#32BB78]" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800">Lire le contrat</p>
                      <p className="text-sm text-gray-600">
                        Contrat {agentTypes[signupData.agentType as keyof typeof agentTypes]?.title || 'Agent Relais'}
                      </p>
                    </div>
                    <div className="text-[#32BB78]">→</div>
                  </div>
                </button>
                
                {/* Checkbox 1: Exactitude des informations */}
                <button
                  onClick={() => updateData('confirmAccuracy', !signupData.confirmAccuracy)}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                    signupData.confirmAccuracy
                      ? 'border-[#32BB78] bg-[#32BB78]/10'
                      : 'border-gray-300 bg-white hover:border-[#32BB78]/50'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    signupData.confirmAccuracy
                      ? 'border-[#32BB78] bg-[#32BB78]'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {signupData.confirmAccuracy && (
                      <CheckCircle2 size={16} className="text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700 text-left">
                    Je confirme que toutes les informations fournies sont exactes et complètes
                  </span>
                </button>
                
                {/* Checkbox 2: Acceptation du contrat */}
                <button
                  onClick={() => updateData('confirmContract', !signupData.confirmContract)}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                    signupData.confirmContract
                      ? 'border-[#32BB78] bg-[#32BB78]/10'
                      : 'border-gray-300 bg-white hover:border-[#32BB78]/50'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    signupData.confirmContract
                      ? 'border-[#32BB78] bg-[#32BB78]'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {signupData.confirmContract && (
                      <CheckCircle2 size={16} className="text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700 text-left">
                    J'accepte les termes et conditions du programme Agent Relais eNkamba
                  </span>
                </button>
                
                {!signupData.confirmContract && (
                  <p className="text-xs text-gray-500 text-center">
                    Veuillez lire et accepter le contrat pour continuer
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoadingProgress ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-[#32BB78] mx-auto mb-4" />
            <p className="text-gray-600">Chargement de votre progression...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header - Avec couleurs Enkamba */}
          <div className="bg-gradient-to-r from-[#32BB78] via-[#2BA86A] to-[#32BB78] px-4 py-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()} 
                className="text-white hover:bg-white/20 rounded-full"
              >
                <ArrowLeft size={20} />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-lg">
                  <Image 
                    src="/enkamba-logo.png" 
                    alt="eNkamba Logo" 
                    width={48} 
                    height={48}
                    className="object-contain rounded-full"
                  />
                </div>
                <span className="text-white text-xl font-bold tracking-tight">eNkamba-Pay</span>
              </div>
              
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <span className="text-white text-xs font-medium">FR</span>
                <span className="text-white/70 text-xs">|</span>
                <span className="text-white/70 text-xs">EN</span>
              </div>
            </div>
          </div>

      {/* Content Area */}
      <div className="bg-white pb-32">
        {renderStepContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-md mx-auto">
          {currentStep < totalSteps ? (
            <Button 
              onClick={nextStep} 
              disabled={isLoading}
              className="w-full h-12 bg-[#32BB78] hover:bg-[#2BA86A] text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Vérification...' : currentStep === 1 ? 'Continuer' : 'Suivant'}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-12 bg-[#FF6B35] hover:bg-[#FF5722] text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Envoi...' : 'Soumettre'}
            </Button>
          )}
        </div>
      </div>

          {/* Progress Bar - Avec couleur Enkamba */}
          <div className="fixed bottom-20 left-0 right-0">
            <div className="max-w-md mx-auto px-4">
              <div className="h-1 bg-gray-200 rounded-full">
                <div 
                  className="h-1 bg-[#32BB78] rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">
                Étape {currentStep} sur {totalSteps} - Progression sauvegardée
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* Modal Contrat */}
      {showContract && (
        <AgentContract
          agentType={signupData.agentType}
          onAccept={() => {
            setShowContract(false);
            updateData('confirmContract', true);
          }}
          onClose={() => setShowContract(false)}
        />
      )}
    </div>
  );
}