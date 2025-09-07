/**
 * Web Session Manager - AgriConnect
 * Gestionnaire de sessions pour l'application web
 * Gère la validation, le renouvellement et le cycle de vie des sessions JWT
 */

import { WebAuthService, WebAuthResponse } from './webAuthService';
import type { AuthSession } from '@supabase/supabase-js';
import { getJWTExpiry } from '../../../lib/auth/config';

export interface WebSessionStatus {
  isValid: boolean;
  needsRefresh: boolean;
  expiresIn: number; // Temps restant en millisecondes
  platform: 'web';
}

export class WebSessionManager {
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static readonly REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  /**
   * Vérification et validation de la session actuelle
   * Renouvelle automatiquement si nécessaire
   */
  static async ensureValidSession(): Promise<AuthSession> {
    const response = await WebAuthService.getCurrentSession();
    
    if (!response.success || !response.session) {
      throw new Error('Session expirée, reconnexion requise');
    }

    const session = response.session;
    const sessionStatus = this.getSessionStatus(session);

    // Si la session expire bientôt, la renouveler
    if (sessionStatus.needsRefresh) {
      console.log('Session expirant bientôt, renouvellement automatique...');
      return await this.refreshSession();
    }

    // Démarrer le timer de renouvellement automatique
    this.startAutoRefreshTimer(session);

    return session;
  }

  /**
   * Renouvellement de la session
   */
  static async refreshSession(): Promise<AuthSession> {
    // Pour les sessions web, on utilise le refresh automatique de Supabase
    // Pas besoin d'implémenter un refresh manuel
    const response = await WebAuthService.getCurrentSession();
    
    if (!response.success || !response.session) {
      throw new Error('Échec du renouvellement de la session');
    }

    const session = response.session;
    
    // Redémarrer le timer de renouvellement automatique
    this.startAutoRefreshTimer(session);
    
    console.log('Session renouvelée avec succès');
    return session;
  }

  /**
   * Nettoyage de la session
   */
  static async clearSession(): Promise<void> {
    // Arrêter le timer de renouvellement automatique
    this.stopAutoRefreshTimer();
    
    // Déconnexion via le service d'authentification
    await WebAuthService.signOut();
    
    console.log('Session nettoyée avec succès');
  }

  /**
   * Obtention du statut de la session
   */
  static getSessionStatus(session: AuthSession): WebSessionStatus {
    const now = Date.now();
    const expiresAt = session.expires_at! * 1000; // Conversion en millisecondes
    const expiresIn = expiresAt - now;
    
    return {
      isValid: expiresIn > 0,
      needsRefresh: expiresIn < this.REFRESH_THRESHOLD,
      expiresIn: Math.max(0, expiresIn),
      platform: 'web'
    };
  }

  /**
   * Vérification si la session est valide
   */
  static isSessionValid(session: AuthSession): boolean {
    const status = this.getSessionStatus(session);
    return status.isValid;
  }

  /**
   * Vérification si la session nécessite un renouvellement
   */
  static needsSessionRefresh(session: AuthSession): boolean {
    const status = this.getSessionStatus(session);
    return status.needsRefresh;
  }

  /**
   * Démarrage du timer de renouvellement automatique
   */
  private static startAutoRefreshTimer(session: AuthSession): void {
    // Arrêter le timer existant s'il y en a un
    this.stopAutoRefreshTimer();

    const status = this.getSessionStatus(session);
    
    if (!status.isValid) {
      console.warn('Session déjà expirée, pas de timer de renouvellement');
      return;
    }

    // Calculer le délai avant le renouvellement
    const refreshDelay = Math.max(
      status.expiresIn - this.REFRESH_THRESHOLD,
      5 * 60 * 1000 // Minimum 5 minutes
    );

    console.log(`Timer de renouvellement automatique programmé dans ${Math.round(refreshDelay / 60000)} minutes`);

    this.refreshTimer = setTimeout(async () => {
      try {
        console.log('Renouvellement automatique de la session...');
        await this.refreshSession();
      } catch (error) {
        console.error('Échec du renouvellement automatique:', error);
        // En cas d'échec, essayer de nettoyer la session
        await this.clearSession();
      }
    }, refreshDelay);
  }

  /**
   * Arrêt du timer de renouvellement automatique
   */
  private static stopAutoRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      console.log('Timer de renouvellement automatique arrêté');
    }
  }

  /**
   * Vérification périodique de la validité de la session
   * Utile pour les applications web en arrière-plan
   */
  static async checkSessionValidity(): Promise<boolean> {
    try {
      const response = await WebAuthService.getCurrentSession();
      
      if (!response.success || !response.session) {
        return false;
      }

      const session = response.session;
      const isValid = this.isSessionValid(session);

      if (!isValid) {
        console.log('Session expirée détectée lors de la vérification périodique');
        await this.clearSession();
        return false;
      }

      // Si la session est valide mais nécessite un renouvellement
      if (this.needsSessionRefresh(session)) {
        console.log('Renouvellement de session nécessaire lors de la vérification périodique');
        await this.refreshSession();
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification de validité de la session:', error);
      return false;
    }
  }

  /**
   * Obtention des informations de session formatées
   */
  static getSessionInfo(session: AuthSession): {
    userId: string;
    userRole: string;
    platform: string;
    expiresAt: Date;
    expiresIn: string;
  } {
    const status = this.getSessionStatus(session);
    const expiresAt = new Date(session.expires_at! * 1000);
    
    // Formatage du temps restant
    const minutes = Math.floor(status.expiresIn / 60000);
    const hours = Math.floor(minutes / 60);
    
    let expiresIn: string;
    if (hours > 0) {
      expiresIn = `${hours} heure(s) ${minutes % 60} minute(s)`;
    } else {
      expiresIn = `${minutes} minute(s)`;
    }

    return {
      userId: session.user.id,
      userRole: session.user.user_metadata?.role || 'unknown',
      platform: 'web',
      expiresAt: expiresAt,
      expiresIn: expiresIn
    };
  }

  /**
   * Gestion des événements de visibilité de la page
   * Renouvelle la session quand l'utilisateur revient sur l'onglet
   */
  static setupVisibilityChangeHandler(): void {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('Page redevenue visible, vérification de la session...');
        try {
          await this.checkSessionValidity();
        } catch (error) {
          console.error('Erreur lors de la vérification de session après changement de visibilité:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyage lors de la destruction
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  /**
   * Gestion des événements de focus de la fenêtre
   * Renouvelle la session quand l'utilisateur revient sur la fenêtre
   */
  static setupFocusHandler(): void {
    const handleFocus = async () => {
      console.log('Fenêtre regagnée, vérification de la session...');
      try {
        await this.checkSessionValidity();
      } catch (error) {
        console.error('Erreur lors de la vérification de session après focus:', error);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Nettoyage lors de la destruction
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }

  /**
   * Nettoyage des ressources lors de la destruction
   */
  static destroy(): void {
    this.stopAutoRefreshTimer();
    console.log('WebSessionManager détruit');
  }
}
