# 🧪 Guide de Test - Compte Entreprise

## 🚀 Système Redémarré

Le système est maintenant en cours d'exécution. Voici les chemins d'accès pour tester :

## 📍 Accès aux Pages

### 1. Page Utilisateur - Demander un Compte Entreprise
```
URL : http://localhost:3000/dashboard/settings/business-account
```

**Étapes de test :**
1. Aller à l'URL ci-dessus
2. Remplir le formulaire avec :
   - Nom : "Test Company"
   - Type : "COMMERCE"
   - Sous-catégorie : "RETAIL"
   - Numéro d'enregistrement : "12345-ABC"
   - Adresse : "123 Rue Test"
   - Ville : "Kinshasa"
   - Pays : "RDC"
   - Email : "test@company.com"
   - Téléphone : "+243123456789"
3. Télécharger les documents (optionnel pour le test)
4. Cliquer "Soumettre la demande"

**Résultat attendu :**
- Message de succès
- Demande visible dans Firestore → `business_requests`
- Status = "PENDING"

### 2. Dashboard Admin - Gérer les Demandes
```
URL : http://localhost:3000/admin/business-requests
```

**Étapes de test :**
1. Aller à l'URL ci-dessus
2. Voir la liste des demandes en attente
3. Cliquer sur une demande pour voir les détails
4. Cliquer "Approuver" ou "Rejeter"

**Résultat attendu :**
- Demande disparaît de la liste
- Firestore → `business_requests` → status = "VERIFIED" ou "REJECTED"
- Si approuvé : `businesses` → document créé

### 3. Paramètres Utilisateur - Lien vers Compte Entreprise
```
URL : http://localhost:3000/dashboard/settings
```

**Étapes de test :**
1. Aller à l'URL ci-dessus
2. Voir la section "Compte Entreprise"
3. Cliquer sur "Obtenir un compte entreprise"
4. Redirection vers `/dashboard/settings/business-account`

## 🔍 Vérification dans Firestore

### Collections à Vérifier

1. **business_requests**
   - Voir les demandes soumises
   - Vérifier les champs : userId, businessName, type, status
   - Vérifier les documents uploadés

2. **businesses**
   - Voir les entreprises approuvées
   - Vérifier que les données sont copiées correctement

3. **users/{userId}**
   - Vérifier les champs ajoutés : isBusiness, businessId, businessType, businessStatus

## 📊 Flux de Test Complet

```
1. Utilisateur soumet une demande
   ↓
2. Demande créée dans business_requests (status: PENDING)
   ↓
3. Admin voit la demande dans /admin/business-requests
   ↓
4. Admin approuve la demande
   ↓
5. Demande copiée dans businesses (status: VERIFIED)
   ↓
6. Profil utilisateur mis à jour (isBusiness: true)
   ↓
7. Utilisateur voit le statut "Vérifié"
```

## ⚠️ Important - Cloud Functions

**Les Cloud Functions ne sont pas encore déployées.**

Pour que le test fonctionne complètement, vous devez :

1. **Déployer les Cloud Functions** via Firebase Console
   - Voir `.kiro/CLOUD_FUNCTIONS_MANUAL_DEPLOYMENT.md`

2. **Ou utiliser le déploiement CLI**
   ```bash
   firebase deploy --only functions --timeout 600
   ```

## 🧪 Test Sans Cloud Functions

Vous pouvez quand même tester :
- ✅ L'interface utilisateur
- ✅ La validation du formulaire
- ✅ L'upload de documents (côté client)
- ✅ L'affichage du dashboard admin

Mais les opérations suivantes nécessitent les Cloud Functions :
- ❌ Soumettre la demande (appelle submitBusinessRequest)
- ❌ Approuver/Rejeter (appelle approveBusinessRequest/rejectBusinessRequest)

## 📝 Checklist de Test

- [ ] Page utilisateur accessible
- [ ] Formulaire dynamique fonctionne
- [ ] Sous-catégories se mettent à jour
- [ ] Upload de documents fonctionne
- [ ] Dashboard admin accessible
- [ ] Cloud Functions déployées
- [ ] Soumission de demande fonctionne
- [ ] Approbation fonctionne
- [ ] Firestore mis à jour correctement
- [ ] Profil utilisateur mis à jour

## 🔗 Liens Utiles

- **Page utilisateur** : http://localhost:3000/dashboard/settings/business-account
- **Dashboard admin** : http://localhost:3000/admin/business-requests
- **Paramètres** : http://localhost:3000/dashboard/settings
- **Firestore Console** : https://console.firebase.google.com
- **Cloud Functions Deployment** : `.kiro/CLOUD_FUNCTIONS_MANUAL_DEPLOYMENT.md`

## 📞 Troubleshooting

### Erreur : "Cloud Function not found"
- Les Cloud Functions ne sont pas déployées
- Voir `.kiro/CLOUD_FUNCTIONS_MANUAL_DEPLOYMENT.md`

### Erreur : "Permission denied"
- Vérifier les Firestore Rules
- Vérifier que l'utilisateur est authentifié

### Erreur : "Document not found"
- Vérifier que la demande a été créée dans Firestore
- Vérifier les logs Firebase

## ✅ Prochaines Étapes

1. Tester l'interface utilisateur
2. Déployer les Cloud Functions
3. Tester le flux complet
4. Vérifier Firestore
5. Tester l'approbation/rejet
