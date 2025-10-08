/**
 * Session Manager - AgriConnect Mobile
 * Gestionnaire de sessions pour l'application mobile
 * Gère la validation, le renouvellement et le cycle de vie des sessions JWT
 */

import { MobileAuthService } from './mobileAuthService';
import type { Session } from '@supabase/supabase-js';
import type { UserRole } from '../../../lib/types/core/user';

export interface SessionStatus {
  isValid: boolean;
  needsRefresh: boolean;
  expiresIn: number; // Temps restant en millisecondes
  platform: 'mobile';
  userRole?: UserRole | null;
}

export class SessionManager {
  private static refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 heure

  /**
   * Obtient la session actuelle
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const response = await MobileAuthService.getCurrentSession();
      
      if (!response.success || !response.session) {
        return null;
      }
      
      return response.session;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  /**
   * Vérification et validation de la session actuelle
   * Renouvelle automatiquement si nécessaire
   */
  static async ensureValidSession(): Promise<Session> {
    const response = await MobileAuthService.getCurrentSession();
    
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
  static async refreshSession(): Promise<Session> {
    const response = await MobileAuthService.refreshSession();
    
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
    await MobileAuthService.signOut();
    
    console.log('Session nettoyée avec succès');
  }

  /**
   * Obtention du statut de la session
   */
  static getSessionStatus(session: Session): SessionStatus {
    const now = Date.now();
    const expiresAt = session.expires_at! * 1000; // Conversion en millisecondes
    const expiresIn = expiresAt - now;
    const userRole = MobileAuthService.getUserRole(session.user);
    
    return {
      isValid: expiresIn > 0,
      needsRefresh: expiresIn < this.REFRESH_THRESHOLD,
      expiresIn: Math.max(0, expiresIn),
      platform: 'mobile',
      userRole
    };
  }

  /**
   * Vérification si la session est valide
   */
  static isSessionValid(session: Session): boolean {
    const status = this.getSessionStatus(session);
    return status.isValid;
  }

  /**
   * Vérification si la session nécessite un renouvellement
   */
  static needsSessionRefresh(session: Session): boolean {
    const status = this.getSessionStatus(session);
    return status.needsRefresh;
  }

  /**
   * Démarrage du timer de renouvellement automatique
   */
  static startAutoRefreshTimer(session: Session): void {
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
   * Utile pour les applications en arrière-plan
   */
  static async checkSessionValidity(): Promise<boolean> {
    try {
      const response = await MobileAuthService.getCurrentSession();
      
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
  static getSessionInfo(session: Session): {
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
    const days = Math.floor(hours / 24);
    
    let expiresIn: string;
    if (days > 0) {
      expiresIn = `${days} jour(s) ${hours % 24} heure(s)`;
    } else if (hours > 0) {
      expiresIn = `${hours} heure(s) ${minutes % 60} minute(s)`;
    } else {
      expiresIn = `${minutes} minute(s)`;
    }

    return {
      userId: session.user.id,
      userRole: session.user.user_metadata?.role || 'unknown',
      platform: 'mobile',
      expiresAt: expiresAt,
      expiresIn: expiresIn
    };
  }

  /**
   * Nettoyage des ressources lors de la destruction
   */
  static destroy(): void {
    this.stopAutoRefreshTimer();
    console.log('SessionManager détruit');
  }
}
