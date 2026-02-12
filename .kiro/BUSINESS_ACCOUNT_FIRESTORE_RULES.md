# Firestore Security Rules pour Business Account

Ajouter ces règles à votre `firestore.rules` :

```
// Business Requests Collection
match /business_requests/{document=**} {
  // Les utilisateurs peuvent lire leurs propres demandes
  allow read: if request.auth.uid != null && 
              resource.data.userId == request.auth.uid;
  
  // Les utilisateurs peuvent créer/mettre à jour leurs propres demandes
  allow create, update: if request.auth.uid != null && 
                           request.resource.data.userId == request.auth.uid &&
                           request.resource.data.status == 'PENDING';
  
  // Les admins peuvent lire toutes les demandes
  allow read: if request.auth.uid != null && 
              exists(/databases/$(database)/documents/admins/$(request.auth.uid));
  
  // Les admins peuvent mettre à jour le statut
  allow update: if request.auth.uid != null && 
                exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

// Businesses Collection (Verified)
match /businesses/{document=**} {
  // Les utilisateurs peuvent lire les profils entreprise publics
  allow read: if true;
  
  // Les propriétaires peuvent lire leurs propres données
  allow read: if request.auth.uid != null && 
              resource.data.userId == request.auth.uid;
  
  // Les admins peuvent gérer les profils
  allow read, write: if request.auth.uid != null && 
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

// Storage Rules pour les documents d'entreprise
match /b/{bucket}/o/business_docs/{userId}/{allPaths=**} {
  // Les utilisateurs peuvent uploader leurs propres documents
  allow write: if request.auth.uid == userId;
  
  // Les utilisateurs peuvent lire leurs propres documents
  allow read: if request.auth.uid == userId;
  
  // Les admins peuvent lire tous les documents
  allow read: if exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

## Indexes Firestore à créer

Ajouter à `firestore.indexes.json` :

```json
{
  "indexes": [
    {
      "collectionGroup": "business_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "business_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submittedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```
