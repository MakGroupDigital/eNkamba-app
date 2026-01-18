# 📋 CONTEXTE COMPLET - Mbongo.io

## 🎯 Vue d'ensemble

**Mbongo.io** est une plateforme fintech complète conçue pour la République Démocratique du Congo (RDC) et la diaspora. C'est une application web moderne qui combine les services bancaires traditionnels avec des produits financiers innovants, le tout dans une interface intuitive et sécurisée.

**Tagline:** "Votre Avenir Financier, Simplifié"  
**Entreprise:** Global solution et services sarl  
**Écosystème:** eNkamba - "La vie simplifiée et meilleure"

---

## 🏗️ ARCHITECTURE GÉNÉRALE

### Stack Technologique

#### Frontend
- **Next.js 15.3.8** - Framework React full-stack avec App Router
- **React 18.3.1** - Bibliothèque UI avec hooks
- **TypeScript 5** - Développement type-safe
- **Tailwind CSS 3.4.1** - Framework CSS utility-first
- **Framer Motion 11.5.7** - Animations fluides

#### Composants UI
- **Radix UI** - Composants headless accessibles (40+ composants)
- **shadcn/ui** - Système de composants pré-construits
- **Lucide React** - Bibliothèque d'icônes (475+ icônes)

#### Backend & IA
- **Google Genkit 1.20.0** - Framework IA pour intégration LLM
- **Google Gemini 2.5 Flash** - Modèle LLM haute performance
- **Firebase 11.9.1** - Backend-as-a-Service (auth, DB, hosting)
- **Firebase App Hosting** - Plateforme de déploiement

#### Formulaires & Validation
- **React Hook Form 7.54.2** - Gestion d'état de formulaires
- **Zod 3.24.2** - Validation de schémas TypeScript-first
- **@hookform/resolvers** - Intégration Hook Form + Zod

#### Données & Visualisation
- **Recharts 2.15.1** - Graphiques React pour données financières
- **jsPDF 2.5.1** - Génération de rapports PDF
- **QRCode 1.5.3** - Génération de codes QR pour paiements

#### Utilitaires
- **date-fns 3.6.0** - Manipulation de dates
- **next-themes 0.3.0** - Support du mode sombre
- **dotenv 16.5.0** - Gestion des variables d'environnement

---

## 📁 STRUCTURE DU PROJET

```
src/
├── ai/                                    # Intégration IA/Genkit
│   ├── genkit.ts                         # Configuration Genkit + Google AI
│   ├── dev.ts                            # Point d'entrée développement
│   └── flows/                            # Définitions de workflows IA
│       ├── ai-report-generation.ts       # Génération de rapports financiers
│       └── enkamba-chat-flow.ts          # Assistant IA eNkamba
│
├── app/                                   # Pages Next.js App Router
│   ├── landing/                          # Page d'accueil avec features
│   ├── login/                            # Authentification
│   ├── kyc/                              # Vérification KYC (Know Your Customer)
│   ├── dashboard/                        # Hub principal de l'application
│   │   ├── mbongo-dashboard/             # Tableau de bord wallet
│   │   ├── wallet/                       # Gestion du portefeuille
│   │   ├── send/                         # Transfert d'argent
│   │   ├── pay-receive/                  # Paiement & réception
│   │   ├── scanner/                      # Scanner QR code
│   │   ├── history/                      # Historique des transactions
│   │   ├── report/                       # Rapports alimentés par IA
│   │   ├── savings/                      # Épargne quotidienne
│   │   ├── credit/                       # Produits de crédit
│   │   ├── tontine/                      # Épargne de groupe (tontine)
│   │   ├── conversion/                   # Conversion multi-devises
│   │   ├── referral/                     # Programme de parrainage
│   │   ├── bonus/                        # Gestion des bonus
│   │   ├── agent/                        # Comptes agents relais
│   │   ├── link-account/                 # Liaison de comptes
│   │   ├── miyiki-chat/                  # Messagerie intégrée
│   │   ├── nkampa/                       # E-commerce intégré
│   │   ├── ugavi/                        # Logistique intégrée
│   │   ├── makutano/                     # Réseau social intégré
│   │   ├── ai/                           # Interface assistant IA
│   │   └── settings/                     # Paramètres utilisateur
│   ├── ecosystem/                        # Aperçu de l'écosystème
│   ├── docs/                             # Documentation API
│   ├── layout.tsx                        # Layout racine
│   ├── page.tsx                          # Page racine
│   └── globals.css                       # Styles globaux
│
├── components/
│   ├── ui/                               # Composants shadcn/ui (40+)
│   ├── dashboard/                        # Composants spécifiques dashboard
│   ├── masolo/                           # Bouton flottant & notifications
│   ├── logo.tsx                          # Logo Mbongo.io
│   ├── enkamba-logo.tsx                  # Logo écosystème eNkamba
│   └── theme-provider.tsx                # Fournisseur mode sombre
│
├── hooks/                                # Hooks React personnalisés
│   ├── use-mobile.tsx                    # Détection mobile
│   └── use-toast.ts                      # Notifications toast
│
└── lib/                                  # Utilitaires
    ├── utils.ts                          # Fonctions helper
    └── placeholder-images.ts             # Images placeholder
```

---

## 💰 SERVICES FINANCIERS (Mbongo.io)

### 1. **Portefeuille Électronique**
- Stockage, envoi, réception et paiement d'argent
- Support multi-devises (CDF, USD, EUR, RMB)
- Transactions sécurisées avec 2FA et notifications instantanées
- Alimentation via carte bancaire, virement ou dépôt cash

### 2. **Épargne Quotidienne**
- Épargne automatique quotidienne avec montants personnalisables
- Comptes d'épargne porteurs d'intérêts
- Suivi des objectifs d'épargne

### 3. **Tontine (Épargne de Groupe)**
- Pools d'épargne collectifs
- Système de payout rotatif
- Distribution basée sur tirage au sort ou ordre séquentiel

### 4. **Crédit Individuel**
- Scoring de crédit alimenté par IA basé sur l'historique de transactions
- Montants, taux et durées de prêt personnalisés
- Déblocage direct dans le wallet

### 5. **Micro-Crédit en Groupe**
- Prêts collectifs avec garanties mutuelles
- Responsabilité collective du remboursement
- Rappels de paiement automatisés

### 6. **Conversion Multi-Devises**
- Échange de devises en temps réel
- Taux compétitifs
- Conversion instantanée

### 7. **Paiements par QR Code**
- Système de paiement sans contact
- Génération de codes QR uniques pour réception
- Fonctionnalité de scan pour paiement

### 8. **Bonus de Parrainage**
- Récompenses pour invitation d'amis
- Codes/liens de parrainage uniques
- Bonus à la première transaction du filleul

### 9. **Bonus sur Transactions Mensuelles**
- Cashback sur paiements et transferts
- Système d'accumulation de points
- Crédit de bonus mensuel

### 10. **Intégration Visa/Mastercard**
- Commande de cartes physiques
- Débit direct du wallet
- Limites de dépense et blocage

### 11. **Comptes Agents Relais**
- Points de dépôt/retrait en espèces
- Système de commission automatisé
- Réseau d'agents partenaires

### 12. **Comptes Marchands**
- Réception de paiements professionnels
- Code QR fixe pour les ventes
- Suivi des paiements et facturation

### 13. **Module USSD (*211422#)**
- Accès aux services sans internet
- Transactions basiques via USSD
- Vérification de solde

---

## 🤖 FONCTIONNALITÉS IA & INTELLIGENTES

### Flows IA (Basés sur Genkit)

#### 1. **Génération de Rapports Financiers** (`ai-report-generation.ts`)
- Analyse l'historique de transactions du compte
- Détecte les anomalies et risques de sécurité
- Fournit des recommandations de produits personnalisées
- Génère des rapports en français
- À titre informatif uniquement (pas d'actions automatiques)

**Schéma d'entrée:**
```typescript
{
  accountHistory: string  // Historique détaillé du compte
}
```

**Schéma de sortie:**
```typescript
{
  summary: string,           // Résumé de l'historique
  anomalies: string,         // Anomalies détectées
  recommendations: string    // Recommandations produits
}
```

#### 2. **Assistant IA eNkamba** (`enkamba-chat-flow.ts`)
- Chatbot spécialisé pour support écosystème
- Connaissances limitées aux services eNkamba
- Support multilingue (français principal)
- Refuse les questions hors-scope
- Modèle propriétaire (cache le LLM sous-jacent)

**Schéma d'entrée:**
```typescript
{
  message: string  // Message utilisateur
}
```

**Schéma de sortie:**
```typescript
{
  response: string  // Réponse de l'assistant
}
```

### Modèle IA
- **Google Gemini 2.5 Flash** - LLM rapide et efficace
- **Framework Genkit** - Gestion structurée des workflows IA
- **Exécution côté serveur** - Traitement sécurisé

---

## 🎨 SYSTÈME DE DESIGN & BRANDING

### Palette de Couleurs
- **Primaire (Vert Frais):** #32BB78 (RGB: 50, 187, 120) - Couleur principale pour headers, icônes actifs, boutons principaux
- **Secondaire (Blanc):** #FFFFFF - Arrière-plan et surfaces
- **Mode Sombre:** Thème sombre adaptatif avec vert foncé (#32BB78 ajusté)

### Typographie
- **Titres:** Montserrat (Bold) - Moderne et impactant
- **Texte du corps:** Roboto (Regular) - Clair et lisible
- **Code:** Fira Code (Monospace) - Contenu technique

### Style UI
- Icônes mono-couleur (Vert Frais #32BB78)
- Design minimaliste et arrondi
- Transitions fluides et animations fade-in
- Design responsive (mobile-first)
- Fond blanc épuré avec accents verts

### Composants
- 40+ composants shadcn/ui pré-construits
- Primitives Radix UI pour accessibilité
- Icônes Lucide React (475+ icônes)

---

## 🔐 AUTHENTIFICATION & SÉCURITÉ

### Flux KYC (Know Your Customer)
1. **Vérification d'Identité** - Upload ID recto et verso
2. **Vérification Biométrique** - Capture selfie avec caméra
3. **Code de Parrainage** - Entrée optionnelle du code de parrainage
4. **Liaison de Compte** - Liaison de compte mobile money ou bancaire
5. **Achèvement** - Redirection vers le dashboard

### Fonctionnalités de Sécurité
- Connexion biométrique
- 2FA (Authentification à Deux Facteurs)
- Notifications de transactions en temps réel
- Chiffrement de bout en bout
- Sécurité au niveau bancaire

---

## ⚙️ CONFIGURATION & DÉPLOIEMENT

### Configuration d'Environnement
- **Intégration Firebase** - Services backend
- **Google Genkit** - Intégration IA/LLM
- **Gestion des clés API** - Variables d'environnement (.env)

### Déploiement
- **Firebase App Hosting** - Plateforme de déploiement principale
- **Max Instances:** 1 (configurable dans apphosting.yaml)
- **Build:** Build production Next.js
- **Développement:** Turbopack pour HMR rapide

### Scripts de Développement
```json
{
  "dev": "next dev --turbopack -p 9002",
  "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
  "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
  "build": "NODE_ENV=production next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

---

## 🌍 INTERNATIONALISATION & LOCALISATION

### Langues Supportées
- Français (Primaire)
- Anglais
- Espagnol
- Portugais
- Chinois
- Lingala
- Tshiluba
- Swahili

### Implémentation
- Français comme langue par défaut
- Texte UI en français partout
- Framework de support multilingue prêt

---

## 📱 PAGES CLÉS & FLUX UTILISATEUR

### Pages Publiques
- **Page d'Accueil** - Showcase des features, témoignages, sécurité, docs API
- **Connexion/Inscription** - Authentification email/téléphone
- **Aperçu Écosystème** - Introduction à l'écosystème eNkamba

### Pages Authentifiées
- **Vérification KYC** - Vérification d'identité multi-étapes
- **Hub Dashboard** - Navigation centrale vers tous les services
- **Gestion Wallet** - Solde, transactions, paramètres
- **Services Financiers** - Épargne, crédit, tontine, conversion
- **Paiements** - Envoi, réception, QR code, scanner
- **Rapports** - Insights financiers générés par IA
- **Paramètres** - Préférences utilisateur et gestion de compte

### Structure de Navigation
- **Navigation par Onglets (Bas)** - 7 sections principales:
  1. Chat (Miyiki-Chat)
  2. E-commerce (Nkampa)
  3. Logistique (Ugavi)
  4. Paiements (Mbongo)
  5. Social (Makutano)
  6. Assistant IA
  7. Paramètres

---

## 🔗 INTÉGRATION ÉCOSYSTÈME

L'application s'intègre avec d'autres services de l'écosystème eNkamba:

- **Miyiki-Chat** - Plateforme de messagerie
- **Nkampa** - Marketplace e-commerce
- **Ugavi** - Logistique et livraison
- **Makutano** - Réseau social
- **eNkamba.ai** - Assistant IA pour support écosystème

---

## 🎯 APPROCHE DE DÉVELOPPEMENT

- **Type-Safe:** Implémentation TypeScript complète
- **Composant-Driven:** Composants UI modulaires
- **Server-Side Rendering:** Next.js App Router avec SSR
- **IA-First:** Genkit pour workflows IA structurés
- **Responsive:** Design mobile-first
- **Accessible:** Radix UI pour accessibilité
- **Animé:** Framer Motion pour UX fluide
- **Validé:** Zod pour validation runtime

---

## 📊 RÉSUMÉ EXÉCUTIF

**Mbongo.io** est une plateforme fintech complète conçue pour la RDC et la diaspora. Elle combine:

✅ **Services bancaires traditionnels** - Wallet, transferts, paiements  
✅ **Produits financiers innovants** - Épargne de groupe, micro-crédit, analyse IA  
✅ **Interface moderne et intuitive** - Design épuré, animations fluides  
✅ **Sécurité bancaire** - 2FA, biométrie, notifications  
✅ **Écosystème intégré** - Chat, e-commerce, logistique, social  
✅ **Support multilingue** - 8 langues supportées  
✅ **Technologie de pointe** - Next.js, Firebase, Google Genkit, Gemini IA  

**Objectif:** Simplifier et démocratiser l'accès aux services financiers pour les populations de la RDC et de la diaspora.

---

## 🚀 PROCHAINES ÉTAPES RECOMMANDÉES

1. **Développement des Features** - Implémenter les pages dashboard manquantes
2. **Intégration Backend** - Connecter Firebase pour authentification et données
3. **Tests** - Ajouter tests unitaires et d'intégration
4. **Optimisation IA** - Affiner les prompts Genkit pour meilleure précision
5. **Déploiement** - Configurer Firebase App Hosting
6. **Monitoring** - Ajouter logging et analytics

---

**Document créé:** 14 janvier 2026  
**Version:** 1.0  
**Statut:** Complet
