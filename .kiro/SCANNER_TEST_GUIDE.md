# 🧪 GUIDE DE TEST - PAGE SCANNER

## 🎯 OBJECTIF
Tester la nouvelle page Scanner avec ses 3 modes et toutes les fonctionnalités.

---

## 🚀 DÉMARRAGE RAPIDE

### **1. Lancer le serveur**
```bash
npm run dev
```

### **2. Se connecter**
- Aller sur `http://localhost:3000`
- Se connecter avec un compte test
- Naviguer vers Dashboard → Scanner

---

## ✅ CHECKLIST DE TEST

### **MODE PAR DÉFAUT (Vue initiale)**

#### **Affichage**
- [ ] Le QR code de l'utilisateur s'affiche en grand
- [ ] Le nom de l'utilisateur est visible
- [ ] Le numéro de compte (ENK...) est affiché
- [ ] L'effet glow animé est visible autour du QR
- [ ] Les 3 boutons sont visibles dans l'ordre:
  - [ ] Recevoir (bleu)
  - [ ] Transférer (violet)
  - [ ] Payer (vert)

#### **Navigation**
- [ ] Le bouton retour (←) redirige vers mbongo-dashboard
- [ ] Le titre affiche "Scanner"

---

### **MODE RECEVOIR**

#### **Accès**
- [ ] Cliquer sur le bouton "Recevoir" (bleu)
- [ ] Le titre change en "Recevoir"
- [ ] Le QR code reste affiché (plus petit)

#### **Informations Affichées**
- [ ] Numéro eNkamba avec icône Hash (vert)
- [ ] Numéro de Carte avec icône CreditCard (bleu)
- [ ] Email avec icône Mail (orange) - si présent
- [ ] Téléphone avec icône Phone (violet) - si présent

#### **Fonctionnalité Copier**
Pour chaque champ:
- [ ] Cliquer sur le bouton copier (icône Copy)
- [ ] L'icône change en Check ✓ (vert)
- [ ] Un toast "Copié ! ✅" apparaît
- [ ] Après 2 secondes, l'icône redevient Copy
- [ ] Coller dans un éditeur de texte pour vérifier

#### **Télécharger QR Code**
- [ ] Cliquer sur "Télécharger QR"
- [ ] Un fichier PNG est téléchargé
- [ ] Le nom du fichier contient le numéro de compte
- [ ] Le QR code est lisible dans le fichier

#### **Partager**
- [ ] Cliquer sur "Partager"
- [ ] Sur mobile: Le menu de partage natif s'ouvre
- [ ] Sur desktop: Le numéro de compte est copié
- [ ] Toast de confirmation affiché

#### **Retour**
- [ ] Cliquer sur "Retour"
- [ ] Retour au mode par défaut
- [ ] Les 3 boutons sont à nouveau visibles

---

### **MODE TRANSFÉRER**

#### **Accès**
- [ ] Depuis le mode par défaut, cliquer sur "Transférer" (violet)
- [ ] Redirection vers `/dashboard/pay-receive`
- [ ] Le module TransferByIdentifier s'affiche

#### **Recherche Utilisateur**
- [ ] 4 boutons de type d'identifiant visibles:
  - [ ] Téléphone
  - [ ] Email
  - [ ] Numéro eNkamba
  - [ ] Numéro de Carte

#### **Test avec Numéro eNkamba**
1. [ ] Sélectionner "Numéro eNkamba"
2. [ ] Entrer un numéro valide (ex: ENK000000002284)
3. [ ] Cliquer sur le bouton recherche (loupe)
4. [ ] Les infos utilisateur s'affichent:
   - [ ] Avatar
   - [ ] Nom complet
   - [ ] Tous les identifiants
5. [ ] Entrer un montant (ex: 100)
6. [ ] Sélectionner une devise (CDF/USD/EUR)
7. [ ] Cliquer "Continuer"
8. [ ] Le PIN est demandé
9. [ ] Entrer le PIN (1234 par défaut)
10. [ ] Le paiement est traité
11. [ ] Toast de succès affiché

#### **Test avec Email**
- [ ] Répéter le test avec un email valide
- [ ] Vérifier que l'utilisateur est trouvé
- [ ] Vérifier que le paiement fonctionne

---

### **MODE PAYER (Scanner Caméra)**

#### **Accès**
- [ ] Depuis le mode par défaut, cliquer sur "Payer" (vert)
- [ ] Le titre change en "Payer"
- [ ] La caméra s'active automatiquement

#### **Permissions Caméra**
- [ ] Si première fois: Popup de permission apparaît
- [ ] Accepter l'accès à la caméra
- [ ] Le flux vidéo s'affiche
- [ ] Un cadre vert en pointillés est visible

#### **Scanner QR Code**
1. **Préparer un QR code test**:
   - [ ] Aller en mode Recevoir sur un autre appareil
   - [ ] Afficher le QR code à l'écran
   
2. **Scanner**:
   - [ ] Pointer la caméra vers le QR code
   - [ ] Le message "🔍 Recherche de QR Code..." s'affiche
   - [ ] Dès détection: Toast "QR Code Détecté ✅"
   - [ ] La caméra s'arrête
   - [ ] Les infos du destinataire s'affichent

3. **Vérifier les infos**:
   - [ ] Avatar affiché
   - [ ] Nom du destinataire
   - [ ] Numéro de compte
   - [ ] Email (si présent)

4. **Saisir le montant**:
   - [ ] Entrer un montant (ex: 500)
   - [ ] Sélectionner CDF
   - [ ] Le bouton "Envoyer l'argent" est actif

5. **Paiement**:
   - [ ] Cliquer "Envoyer l'argent"
   - [ ] Le PIN est demandé
   - [ ] Entrer 1234
   - [ ] Le paiement est traité
   - [ ] Toast "Paiement réussi ! ✅"
   - [ ] Retour automatique au mode par défaut

#### **Import Image**
1. **Préparer une image**:
   - [ ] Télécharger un QR code eNkamba
   - [ ] Sauvegarder comme image PNG/JPG

2. **Importer**:
   - [ ] Cliquer "Importer une Image"
   - [ ] Sélectionner l'image
   - [ ] L'image s'affiche immédiatement
   - [ ] Animation de scan progressive (0% → 100%)
   - [ ] Ligne verte qui descend
   - [ ] Message "⚡ Scan en cours: X%"

3. **Résultat**:
   - [ ] Si QR valide: Infos destinataire affichées
   - [ ] Si QR invalide: Message d'erreur rouge
   - [ ] Si pas de QR: "Aucun QR code détecté"

#### **QR Code Invalide**
- [ ] Scanner un QR code non-eNkamba (ex: URL)
- [ ] Message d'erreur: "⚠️ QR Code Invalide"
- [ ] Description: "Ce n'est pas un code eNkamba"
- [ ] Overlay rouge sur la caméra
- [ ] Possibilité de réessayer

#### **Scanner un autre code**
- [ ] Après un scan réussi, cliquer "Scanner un autre code"
- [ ] Retour à la caméra
- [ ] Possibilité de scanner à nouveau

#### **Retour**
- [ ] Cliquer "Retour" depuis la caméra
- [ ] Retour au mode par défaut
- [ ] La caméra s'arrête proprement

---

## 🎨 TESTS VISUELS

### **Animations**
- [ ] Effet glow pulse sur le QR code
- [ ] Transition fade-in lors du changement de mode
- [ ] Animation de la ligne de scan (import image)
- [ ] Pulse du cadre vert (scanner caméra)
- [ ] Changement d'icône Copy → Check

### **Responsive**
- [ ] Tester sur mobile (< 768px)
- [ ] Tester sur tablette (768px - 1024px)
- [ ] Tester sur desktop (> 1024px)
- [ ] Vérifier que tout est lisible
- [ ] Vérifier que les boutons sont cliquables

### **Couleurs**
- [ ] Vert eNkamba: #32BB78
- [ ] Bleu: from-blue-600 to-blue-800
- [ ] Violet: from-purple-600 to-purple-800
- [ ] Cohérence avec le reste de l'app

---

## 🐛 TESTS D'ERREUR

### **Caméra**
- [ ] Refuser l'accès caméra
- [ ] Vérifier le message d'erreur
- [ ] Vérifier que l'import image fonctionne toujours

### **Réseau**
- [ ] Désactiver le réseau
- [ ] Tenter un paiement
- [ ] Vérifier le message d'erreur
- [ ] Réactiver et réessayer

### **Montant Invalide**
- [ ] Entrer 0
- [ ] Entrer un nombre négatif
- [ ] Entrer du texte
- [ ] Vérifier que le bouton est désactivé

### **PIN Incorrect**
- [ ] Entrer un mauvais PIN
- [ ] Vérifier le message d'erreur
- [ ] Réessayer avec le bon PIN

---

## 📱 TESTS SPÉCIFIQUES MOBILE

### **Caméra Mobile**
- [ ] Tester avec caméra arrière
- [ ] Tester avec caméra avant
- [ ] Vérifier l'orientation (portrait/paysage)
- [ ] Vérifier la qualité du scan

### **Partage Mobile**
- [ ] Tester le partage natif
- [ ] Partager via WhatsApp
- [ ] Partager via Email
- [ ] Partager via SMS

### **Téléchargement Mobile**
- [ ] Télécharger le QR code
- [ ] Vérifier dans la galerie
- [ ] Vérifier la qualité de l'image

---

## ⚡ TESTS DE PERFORMANCE

### **Temps de Chargement**
- [ ] QR code généré en < 1s
- [ ] Caméra activée en < 2s
- [ ] Scan QR en < 1s après détection
- [ ] Import image traité en < 2s

### **Mémoire**
- [ ] Pas de fuite mémoire après 10 scans
- [ ] Caméra libérée après retour
- [ ] Pas de ralentissement après usage prolongé

---

## 🔄 TESTS DE FLUX COMPLETS

### **Flux 1: Recevoir → Copier → Partager**
1. [ ] Mode par défaut
2. [ ] Clic "Recevoir"
3. [ ] Copier numéro eNkamba
4. [ ] Copier email
5. [ ] Télécharger QR
6. [ ] Partager
7. [ ] Retour

### **Flux 2: Payer → Scanner → Paiement**
1. [ ] Mode par défaut
2. [ ] Clic "Payer"
3. [ ] Autoriser caméra
4. [ ] Scanner QR code
5. [ ] Entrer montant
6. [ ] Entrer PIN
7. [ ] Paiement réussi
8. [ ] Retour automatique

### **Flux 3: Transférer → Recherche → Paiement**
1. [ ] Mode par défaut
2. [ ] Clic "Transférer"
3. [ ] Redirection pay-receive
4. [ ] Sélectionner type identifiant
5. [ ] Rechercher utilisateur
6. [ ] Entrer montant
7. [ ] Entrer PIN
8. [ ] Paiement réussi

---

## 📊 RÉSULTATS ATTENDUS

### **Succès**
- ✅ Tous les tests passent
- ✅ Aucune erreur console
- ✅ Navigation fluide
- ✅ Animations smooth
- ✅ Paiements fonctionnels

### **Échec**
- ❌ Erreur console
- ❌ Crash de l'app
- ❌ Caméra ne s'active pas
- ❌ QR code non détecté
- ❌ Paiement échoue

---

## 🎯 CRITÈRES DE VALIDATION

Pour valider la refonte, il faut:
1. ✅ 100% des tests "Affichage" passent
2. ✅ 100% des tests "Fonctionnalité" passent
3. ✅ 90%+ des tests "Performance" passent
4. ✅ Aucune erreur bloquante
5. ✅ UX fluide et intuitive

---

## 📝 RAPPORT DE TEST

### **Template**
```markdown
# Rapport de Test - Scanner Page

**Date**: [DATE]
**Testeur**: [NOM]
**Environnement**: [Browser/Device]

## Résultats
- Tests réussis: X/Y
- Tests échoués: Z
- Bugs trouvés: N

## Bugs Identifiés
1. [Description du bug]
   - Sévérité: Critique/Majeur/Mineur
   - Étapes de reproduction
   - Comportement attendu
   - Comportement observé

## Recommandations
- [Amélioration 1]
- [Amélioration 2]

## Conclusion
[Validation ou Rejet avec justification]
```

---

**Bon test! 🚀**
