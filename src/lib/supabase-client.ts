import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Configuration Supabase manquante. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour les tables Supabase
export interface SupabaseUser {
  id: string;
  uid: string; // Firebase UID pour compatibilité
  email?: string;
  phone?: string;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
  last_transaction_time?: string;
}

export interface SupabaseTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  previous_balance: number;
  new_balance: number;
  description: string;
  phone_number?: string;
  provider?: string;
  provider_reference?: string;
  provider_transaction_id?: string;
  provider_status?: string;
  raw_response?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère ou crée un utilisateur dans Supabase
 */
export async function getOrCreateSupabaseUser(uid: string, email?: string, phone?: string): Promise<SupabaseUser | null> {
  try {
    // Chercher l'utilisateur existant
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single();

    if (existingUser && !fetchError) {
      return existingUser;
    }

    // Créer un nouvel utilisateur
    const newUser: Partial<SupabaseUser> = {
      uid,
      email,
      phone,
      wallet_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (createError) {
      console.error('Erreur création utilisateur Supabase:', createError);
      return null;
    }

    return createdUser;
  } catch (error) {
    console.error('Erreur getOrCreateSupabaseUser:', error);
    return null;
  }
}

/**
 * Met à jour le solde d'un utilisateur
 */
export async function updateUserBalance(uid: string, newBalance: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        wallet_balance: newBalance,
        last_transaction_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('uid', uid);

    if (error) {
      console.error('Erreur mise à jour solde:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur updateUserBalance:', error);
    return false;
  }
}

/**
 * Crée une transaction dans Supabase
 */
export async function createSupabaseTransaction(transaction: Omit<SupabaseTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseTransaction | null> {
  try {
    const transactionData = {
      ...transaction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('Erreur création transaction:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur createSupabaseTransaction:', error);
    return null;
  }
}

/**
 * Met à jour une transaction existante
 */
export async function updateSupabaseTransaction(transactionId: string, updates: Partial<SupabaseTransaction>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) {
      console.error('Erreur mise à jour transaction:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur updateSupabaseTransaction:', error);
    return false;
  }
}

/**
 * Récupère les transactions d'un utilisateur
 */
export async function getUserTransactions(uid: string, limit = 50): Promise<SupabaseTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur récupération transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur getUserTransactions:', error);
    return [];
  }
}

/**
 * Effectue une transaction atomique (mise à jour solde + création transaction)
 */
export async function performAtomicTransaction(
  uid: string,
  transactionData: Omit<SupabaseTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; transaction?: SupabaseTransaction; error?: string }> {
  try {
    // Utiliser une transaction Supabase pour garantir l'atomicité
    const { data, error } = await supabase.rpc('perform_wallet_transaction', {
      p_user_uid: uid,
      p_transaction_data: {
        ...transactionData,
        user_id: uid
      }
    });

    if (error) {
      console.error('Erreur transaction atomique:', error);
      return { success: false, error: error.message };
    }

    return { success: true, transaction: data };
  } catch (error) {
    console.error('Erreur performAtomicTransaction:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Vérifie si Supabase est configuré et disponible
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { connected: false, error: 'Configuration Supabase manquante' };
    }

    // Test simple de connexion
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return { connected: false, error: error.message };
    }

    return { connected: true };
  } catch (error) {
    return { connected: false, error: (error as Error).message };
  }
}