/**
 * Gestionnaire des permissions d'appareil
 * Stocke les autorisations accordées pour éviter de les redemander
 */

export type PermissionType = 'camera' | 'microphone' | 'location' | 'photos' | 'contacts' | 'calendar' | 'clipboard';

interface PermissionState {
  status: 'granted' | 'denied' | 'prompt' | 'unknown';
  timestamp: number;
  expiresAt?: number;
}

interface StoredPermissions {
  [key: string]: PermissionState | undefined;
}

const STORAGE_KEY = 'enkamba_device_permissions';
const PERMISSION_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours

class PermissionsManager {
  private permissions: StoredPermissions = {};

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Charger les permissions depuis le localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.permissions = JSON.parse(stored);
          this.cleanExpiredPermissions();
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error);
    }
  }

  /**
   * Sauvegarder les permissions dans le localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.permissions));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des permissions:', error);
    }
  }

  /**
   * Nettoyer les permissions expirées
   */
  private cleanExpiredPermissions(): void {
    const now = Date.now();
    let hasChanges = false;

    for (const [key, permission] of Object.entries(this.permissions)) {
      if (permission?.expiresAt && permission.expiresAt < now) {
        delete this.permissions[key as PermissionType];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveToStorage();
    }
  }

  /**
   * Obtenir l'état d'une permission
   */
  getPermissionState(type: PermissionType): PermissionState | null {
    const permission = this.permissions[type];
    
    if (!permission) {
      return null;
    }

    // Vérifier si la permission a expiré
    if (permission.expiresAt && permission.expiresAt < Date.now()) {
      delete this.permissions[type];
      this.saveToStorage();
      return null;
    }

    return permission;
  }

  /**
   * Vérifier si une permission a déjà été accordée
   */
  isPermissionGranted(type: PermissionType): boolean {
    const state = this.getPermissionState(type);
    return state?.status === 'granted';
  }

  /**
   * Vérifier si une permission a déjà été refusée
   */
  isPermissionDenied(type: PermissionType): boolean {
    const state = this.getPermissionState(type);
    return state?.status === 'denied';
  }

  /**
   * Vérifier si une permission doit être demandée
   */
  shouldPromptForPermission(type: PermissionType): boolean {
    const state = this.getPermissionState(type);
    return !state || state.status === 'prompt' || state.status === 'unknown';
  }

  /**
   * Enregistrer une permission accordée
   */
  setPermissionGranted(type: PermissionType): void {
    this.permissions[type] = {
      status: 'granted',
      timestamp: Date.now(),
      expiresAt: Date.now() + PERMISSION_CACHE_DURATION,
    };
    this.saveToStorage();
  }

  /**
   * Enregistrer une permission refusée
   */
  setPermissionDenied(type: PermissionType): void {
    this.permissions[type] = {
      status: 'denied',
      timestamp: Date.now(),
      expiresAt: Date.now() + PERMISSION_CACHE_DURATION,
    };
    this.saveToStorage();
  }

  /**
   * Réinitialiser une permission
   */
  resetPermission(type: PermissionType): void {
    delete this.permissions[type];
    this.saveToStorage();
  }

  /**
   * Réinitialiser toutes les permissions
   */
  resetAllPermissions(): void {
    this.permissions = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des permissions:', error);
    }
  }

  /**
   * Obtenir toutes les permissions stockées
   */
  getAllPermissions(): StoredPermissions {
    this.cleanExpiredPermissions();
    return { ...this.permissions };
  }
}

// Instance singleton
export const permissionsManager = new PermissionsManager();
