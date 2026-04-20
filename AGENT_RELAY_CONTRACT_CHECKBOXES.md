# Agent Relay - Contrats et Coches Fonctionnelles

## Date: 20 Avril 2026

## Nouvelles Fonctionnalités

### 1. Composant Contrat Agent (`AgentContract.tsx`)

**Fichier**: `src/components/agent-relay/AgentContract.tsx`

Modal de lecture de contrat avec:
- ✅ 3 contrats différents selon le type d'agent
- ✅ Scroll obligatoire jusqu'en bas
- ✅ Bouton "J'accepte" désactivé tant que pas scrollé
- ✅ Indicateur de scroll animé
- ✅ Design professionnel avec sections structurées

#### Contrats Disponibles

**1. Agent Relais**
- Objet du contrat
- Obligations (transactions, vérification identité, liquidité, sécurité)
- Commissions: 1% dépôt, 1.5% retrait, 0.5% transfert
- Responsabilités
- Durée et résiliation (indéterminée, préavis 30 jours)
- Confidentialité

**2. Cabiniste**
- Point de vente fixe
- Obligations (local, affichage, personnel, liquidité min 500k FC)
- Commissions préférentielles: 1.2% dépôt, 1.8% retrait, 0.7% transfert
- Infrastructure requise (local, internet, sécurité, coffre)
- Responsabilités étendues
- Durée 2 ans renouvelable (préavis 60 jours)

**3. Point de Service**
- Intégration dans commerce existant
- Obligations (signalétique, formation, liquidité min 200k FC)
- Commissions: 0.8% dépôt, 1.2% retrait, 0.4% transfert
- Intégration facile
- Responsabilités
- Durée indéterminée (préavis 15 jours)

### 2. Coches Fonctionnelles (Étape 5)

**Modifications**: `src/app/dashboard/agent-relay/signup/page.tsx`

#### Nouveaux Champs dans SignupData
```typescript
interface SignupData {
  // ... champs existants
  confirmAccuracy: boolean;    // Confirme exactitude des infos
  confirmContract: boolean;    // Accepte le contrat
}
```

#### Bouton "Lire le contrat"
- Affiche le type de contrat spécifique
- Ouvre le modal de contrat
- Design avec icône et flèche

#### Checkbox 1: Exactitude des Informations
- Cliquable pour cocher/décocher
- Animation de transition
- Bordure verte quand cochée
- Icône CheckCircle2 quand active

#### Checkbox 2: Acceptation du Contrat
- Même comportement que checkbox 1
- Message d'aide si non cochée
- Obligatoire pour soumettre

### 3. Validation de Soumission

**Nouvelle validation dans `handleSubmit()`**:
```typescript
if (!signupData.confirmAccuracy) {
  setError('Veuillez confirmer l\'exactitude des informations');
  return;
}
if (!signupData.confirmContract) {
  setError('Veuillez accepter les termes et conditions');
  return;
}
```

Les deux coches doivent être activées pour pouvoir soumettre.

### 4. Sauvegarde Firestore

Les confirmations sont sauvegardées dans Firestore:
```typescript
await updateDoc(docRef, {
  // ... autres champs
  confirmAccuracy: signupData.confirmAccuracy,
  confirmContract: signupData.confirmContract,
  status: 'submitted',
  submittedAt: serverTimestamp()
});
```

---

## Flux Utilisateur

### Étape 5 - Résumé et Confirmation

1. **Voir le résumé**
   - Informations personnelles
   - Documents
   - Vérification biométrique

2. **Lire le contrat**
   - Clique sur "Lire le contrat"
   - Modal s'ouvre avec contrat adapté au type d'agent
   - Doit scroller jusqu'en bas
   - Bouton "J'accepte" se débloque
   - Clique "J'accepte" → Modal se ferme + Checkbox 2 se coche automatiquement

3. **Cocher les confirmations**
   - Coche "Exactitude des informations"
   - Coche "Acceptation du contrat" (ou via modal)
   - Les deux doivent être cochées

4. **Soumettre**
   - Clique "Soumettre"
   - Si coches manquantes → Message d'erreur
   - Si tout OK → Sauvegarde et redirection vers success

---

## Design et UX

### Bouton Contrat
```
┌─────────────────────────────────────────┐
│ 📄  Lire le contrat                  → │
│     Contrat Agent Relais                │
└─────────────────────────────────────────┘
```
- Bordure verte #32BB78
- Fond vert clair
- Hover: fond plus foncé

### Checkboxes
```
Non cochée:
┌───┐  Je confirme que...
│   │
└───┘

Cochée:
┌───┐  Je confirme que...
│ ✓ │  (fond vert, bordure verte)
└───┘
```

### Modal Contrat
```
┌─────────────────────────────────────────┐
│ 📄 Contrat Agent Relais eNkamba-Pay  ✕ │
├─────────────────────────────────────────┤
│                                         │
│  1. Objet du Contrat                   │
│  Le présent contrat...                 │
│                                         │
│  2. Obligations...                     │
│  ...                                   │
│                                         │
│  ↓ Faites défiler... ↓ (si pas fini)  │
├─────────────────────────────────────────┤
│ ℹ️ En acceptant ce contrat...          │
│                                         │
│ [Annuler]  [J'accepte / Lisez...]     │
└─────────────────────────────────────────┘
```

---

## Détails Techniques

### État du Scroll
```typescript
const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const element = e.currentTarget;
  const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
  if (isAtBottom && !hasScrolledToBottom) {
    setHasScrolledToBottom(true);
  }
};
```

### Bouton Accepter Conditionnel
```typescript
<Button
  onClick={onAccept}
  disabled={!hasScrolledToBottom}
  className={hasScrolledToBottom
    ? 'bg-[#32BB78] hover:bg-[#2BA86A]'
    : 'bg-gray-300 cursor-not-allowed'
  }
>
  {hasScrolledToBottom ? 'J\'accepte' : 'Lisez le contrat'}
</Button>
```

### Callback d'Acceptation
```typescript
onAccept={() => {
  setShowContract(false);           // Ferme le modal
  updateData('confirmContract', true); // Coche automatiquement
}}
```

---

## Structure Firestore Mise à Jour

### Collection: `agentRelayApplications`

Nouveaux champs ajoutés:
```typescript
{
  // ... champs existants
  
  // Confirmations étape 5
  confirmAccuracy: boolean,
  confirmContract: boolean,
  
  // ... autres champs
}
```

---

## Tests à Effectuer

### Contrat
- [ ] Modal s'ouvre au clic sur "Lire le contrat"
- [ ] Contrat correct selon type d'agent
- [ ] Scroll fonctionne
- [ ] Indicateur de scroll visible si pas fini
- [ ] Bouton "J'accepte" désactivé au début
- [ ] Bouton se débloque après scroll complet
- [ ] Clic "J'accepte" ferme modal et coche checkbox 2
- [ ] Clic "Annuler" ferme modal sans cocher

### Checkboxes
- [ ] Checkbox 1 cliquable
- [ ] Checkbox 2 cliquable
- [ ] Animation de transition fluide
- [ ] Couleurs correctes (vert quand coché)
- [ ] Icône CheckCircle2 visible quand coché

### Validation
- [ ] Erreur si checkbox 1 non cochée
- [ ] Erreur si checkbox 2 non cochée
- [ ] Soumission réussit si les deux cochées
- [ ] Confirmations sauvegardées dans Firestore

### Responsive
- [ ] Modal responsive sur mobile
- [ ] Checkboxes lisibles sur petit écran
- [ ] Scroll du contrat fonctionne sur mobile

---

## Améliorations Futures

1. **Signature Électronique**
   - Ajouter un canvas pour signer
   - Sauvegarder la signature en image
   - Afficher dans le résumé

2. **Téléchargement du Contrat**
   - Bouton pour télécharger en PDF
   - Inclure signature et date
   - Envoi par email

3. **Versions de Contrat**
   - Versionner les contrats
   - Tracker quelle version acceptée
   - Notifier si mise à jour

4. **Traduction**
   - Contrats en français et anglais
   - Sélection de langue
   - Sauvegarde de la langue choisie

---

## Résumé des Changements

### Fichiers Créés
- ✅ `src/components/agent-relay/AgentContract.tsx`
- ✅ `AGENT_RELAY_CONTRACT_CHECKBOXES.md`

### Fichiers Modifiés
- ✅ `src/app/dashboard/agent-relay/signup/page.tsx`
  - Ajout import AgentContract
  - Ajout champs confirmAccuracy et confirmContract
  - Ajout state showContract
  - Modification étape 5 avec coches fonctionnelles
  - Ajout bouton "Lire le contrat"
  - Ajout validation dans handleSubmit
  - Ajout modal contrat

### Fonctionnalités Ajoutées
- ✅ 3 contrats professionnels adaptés par type
- ✅ Modal de lecture avec scroll obligatoire
- ✅ Coches fonctionnelles et cliquables
- ✅ Validation avant soumission
- ✅ Sauvegarde des confirmations
- ✅ UX intuitive et professionnelle

---

## Notes Importantes

1. **Légalité**: Les contrats sont des exemples. Faire valider par un juriste avant production.

2. **RGPD/Protection des données**: Ajouter clauses de protection des données personnelles.

3. **Langue**: Actuellement en français uniquement. Prévoir traduction anglaise.

4. **Accessibilité**: Les checkboxes sont accessibles au clavier (boutons cliquables).

5. **Mobile**: Le modal est responsive mais tester sur vrais appareils.

Le système de contrat et de confirmation est maintenant complet et professionnel! 🎉
