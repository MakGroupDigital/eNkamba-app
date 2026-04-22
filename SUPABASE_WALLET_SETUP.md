# Configuration Supabase pour eNkamba Wallet

## 🎯 Objectif

Utiliser Supabase comme alternative à Firebase pour contourner les problèmes d'authentification Firebase Admin SDK.

## 📋 Étapes de Configuration

### 1. Créer un Projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Choisir un nom (ex: `enkamba-wallet`)
4. Choisir une région proche (ex: `eu-west-1`)
5. Créer un mot de passe fort pour la base de données

### 2. Récupérer les Clés API

Dans le dashboard Supabase → Settings → API:
- **URL**: `https://your-project.supabase.co`
- **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Ajouter les Variables d'Environnement

Ajouter dans `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Créer les Tables Supabase

Exécuter ce SQL dans l'éditeur SQL de Supabase:

```sql
-- Table des utilisateurs
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL, -- Firebase UID pour compatibilité
  email TEXT,
  phone TEXT,
  wallet_balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_transaction_time TIMESTAMP WITH TIME ZONE
);

-- Table des transactions
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(uid),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment')),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CDF',
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  previous_balance DECIMAL(15,2) NOT NULL,
  new_balance DECIMAL(15,2) NOT NULL,
  description TEXT,
  phone_number TEXT,
  provider TEXT,
  provider_reference TEXT,
  provider_transaction_id TEXT,
  provider_status TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_provider_reference ON transactions(provider_reference);

-- Fonction pour les transactions atomiques
CREATE OR REPLACE FUNCTION perform_wallet_transaction(
  p_user_uid TEXT,
  p_transaction_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_user_record users%ROWTYPE;
  v_transaction_id UUID;
  v_new_balance DECIMAL(15,2);
BEGIN
  -- Verrouiller l'utilisateur pour éviter les conditions de course
  SELECT * INTO v_user_record 
  FROM users 
  WHERE uid = p_user_uid 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', p_user_uid;
  END IF;
  
  -- Calculer le nouveau solde
  v_new_balance := v_user_record.wallet_balance + (p_transaction_data->>'amount')::DECIMAL;
  
  -- Insérer la transaction
  INSERT INTO transactions (
    user_id, type, amount, currency, payment_method, status,
    previous_balance, new_balance, description, phone_number,
    provider, provider_reference, provider_transaction_id,
    provider_status, raw_response
  ) VALUES (
    p_user_uid,
    p_transaction_data->>'type',
    (p_transaction_data->>'amount')::DECIMAL,
    COALESCE(p_transaction_data->>'currency', 'CDF'),
    p_transaction_data->>'payment_method',
    p_transaction_data->>'status',
    v_user_record.wallet_balance,
    v_new_balance,
    p_transaction_data->>'description',
    p_transaction_data->>'phone_number',
    p_transaction_data->>'provider',
    p_transaction_data->>'provider_reference',
    p_transaction_data->>'provider_transaction_id',
    p_transaction_data->>'provider_status',
    p_transaction_data->'raw_response'
  ) RETURNING id INTO v_transaction_id;
  
  -- Mettre à jour le solde utilisateur si la transaction est complétée
  IF p_transaction_data->>'status' = 'completed' THEN
    UPDATE users 
    SET 
      wallet_balance = v_new_balance,
      last_transaction_time = NOW(),
      updated_at = NOW()
    WHERE uid = p_user_uid;
  END IF;
  
  -- Retourner les détails de la transaction
  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'success', true
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Configurer les Politiques RLS (Row Level Security)

```sql
-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs (accès à ses propres données)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (uid = current_setting('app.current_user_uid', true));

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (uid = current_setting('app.current_user_uid', true));

-- Politique pour les transactions (accès à ses propres transactions)
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (user_id = current_setting('app.current_user_uid', true));

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_uid', true));

-- Politique pour les API (accès complet avec service role)
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access transactions" ON transactions
  FOR ALL USING (current_setting('role') = 'service_role');
```

## 🧪 Test de l'Installation

### 1. Installer les Dépendances

```bash
npm install @supabase/supabase-js
```

### 2. Tester la Connexion

```bash
curl -X GET http://localhost:9002/api/wallet/add-funds-supabase
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Supabase connecté et prêt",
  "provider": "Supabase"
}
```

### 3. Tester une Transaction

```bash
curl -X POST http://localhost:9002/api/wallet/add-funds-supabase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "amount": 1000,
    "paymentMethod": "mobile_money",
    "phoneNumber": "0997654321",
    "currency": "CDF"
  }'
```

## 🔄 Migration depuis Firebase

### Avantages de Supabase
- ✅ **Pas de problèmes d'authentification service account**
- ✅ **Interface SQL familière**
- ✅ **Transactions atomiques natives**
- ✅ **Dashboard intuitif**
- ✅ **API REST automatique**
- ✅ **Politiques de sécurité flexibles**

### Utilisation Hybride
Vous pouvez utiliser les deux systèmes en parallèle:
- **Firebase**: Pour l'authentification utilisateur et les données existantes
- **Supabase**: Pour les opérations de portefeuille et transactions

### Endpoints Disponibles
- `POST /api/wallet/add-funds-supabase` - Dépôts avec Supabase
- `GET /api/wallet/add-funds-supabase` - Test de connexion
- `POST /api/wallet/add-funds/` - Dépôts avec Firebase (si fonctionnel)
- `POST /api/wallet/add-funds-lite/` - Fallback Firebase Client SDK

## 🚀 Prochaines Étapes

1. **Configurer Supabase** selon les étapes ci-dessus
2. **Tester l'API Supabase** avec de vraies transactions
3. **Migrer progressivement** les fonctionnalités vers Supabase
4. **Maintenir Firebase** pour l'authentification utilisateur
5. **Synchroniser les données** entre les deux systèmes si nécessaire

## 📝 Notes Importantes

- **Sécurité**: Supabase utilise des politiques RLS pour la sécurité
- **Performance**: Les transactions atomiques évitent les conditions de course
- **Compatibilité**: L'API reste compatible avec l'interface existante
- **Monitoring**: Dashboard Supabase pour surveiller les performances
- **Backup**: Supabase gère automatiquement les sauvegardes

Cette solution vous permet de contourner immédiatement les problèmes Firebase tout en gardant une architecture robuste et scalable.