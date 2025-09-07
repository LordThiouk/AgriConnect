/**
 * Authentication Logging Service - AgriConnect
 * Service de journalisation des événements d'authentification et de sécurité
 * Traçabilité complète pour audit et monitoring
 */

import { supabase } from '../supabase/client';
import type { AuthSession, User } from '@supabase/supabase-js';

export interface AuthLogEntry {
  id?: string;
  user_id?: string;
  event_type: AuthEventType;
  platform: 'mobile' | 'web';
  auth_method: 'otp_sms' | 'email_password';
  user_role?: string;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export type AuthEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_refresh'
  | 'session_expired'
  | 'platform_access_denied'
  | 'permission_denied'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'otp_sent'
  | 'otp_verified'
  | 'otp_expired'
  | 'account_created'
  | 'account_updated'
  | 'account_deleted'
  | 'role_changed'
  | 'suspicious_activity'
  | 'rate_limit_exceeded';

export interface AuthLogFilters {
  user_id?: string;
  event_type?: AuthEventType;
  platform?: 'mobile' | 'web';
  success?: boolean;
  date_from?: string;
  date_to?: string;
  user_role?: string;
}

export interface AuthLogStats {
  total_events: number;
  success_rate: number;
  events_by_type: Record<AuthEventType, number>;
  events_by_platform: Record<string, number>;
  events_by_role: Record<string, number>;
  recent_failures: AuthLogEntry[];
}

/**
 * Service de journalisation des événements d'authentification
 */
export class AuthLoggingService {
  private static readonly TABLE_NAME = 'auth_logs';

  /**
   * Enregistrer un événement d'authentification
   */
  static async logEvent(entry: Omit<AuthLogEntry, 'id' | 'created_at'>): Promise<AuthLogEntry | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          user_id: entry.user_id,
          event_type: entry.event_type,
          platform: entry.platform,
          auth_method: entry.auth_method,
          user_role: entry.user_role,
          success: entry.success,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          error_message: entry.error_message,
          metadata: entry.metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la journalisation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la journalisation:', error);
      return null;
    }
  }

  /**
   * Journaliser une tentative de connexion
   */
  static async logLoginAttempt(
    user: User | null,
    platform: 'mobile' | 'web',
    authMethod: 'otp_sms' | 'email_password',
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventType: AuthEventType = success ? 'login_success' : 'login_failure';
    
    await this.logEvent({
      user_id: user?.id,
      event_type: eventType,
      platform,
      auth_method: authMethod,
      user_role: user?.user_metadata?.role,
      success,
      error_message: errorMessage,
      metadata
    });
  }

  /**
   * Journaliser un accès à une plateforme
   */
  static async logPlatformAccess(
    user: User,
    platform: 'mobile' | 'web',
    authMethod: 'otp_sms' | 'email_password',
    allowed: boolean,
    errorMessage?: string
  ): Promise<void> {
    const eventType: AuthEventType = allowed ? 'login_success' : 'platform_access_denied';
    
    await this.logEvent({
      user_id: user.id,
      event_type: eventType,
      platform,
      auth_method: authMethod,
      user_role: user.user_metadata?.role,
      success: allowed,
      error_message: errorMessage,
      metadata: {
        requested_platform: platform,
        user_role: user.user_metadata?.role
      }
    });
  }

  /**
   * Journaliser un déconnexion
   */
  static async logLogout(
    user: User,
    platform: 'mobile' | 'web',
    authMethod: 'otp_sms' | 'email_password'
  ): Promise<void> {
    await this.logEvent({
      user_id: user.id,
      event_type: 'logout',
      platform,
      auth_method: authMethod,
      user_role: user.user_metadata?.role,
      success: true,
      metadata: {
        session_duration: this.calculateSessionDuration(user)
      }
    });
  }

  /**
   * Journaliser un renouvellement de session
   */
  static async logSessionRefresh(
    user: User,
    platform: 'mobile' | 'web',
    authMethod: 'otp_sms' | 'email_password',
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      user_id: user.id,
      event_type: 'session_refresh',
      platform,
      auth_method: authMethod,
      user_role: user.user_metadata?.role,
      success,
      error_message: errorMessage
    });
  }

  /**
   * Journaliser un événement OTP
   */
  static async logOTPEvent(
    eventType: 'otp_sent' | 'otp_verified' | 'otp_expired',
    phone: string,
    platform: 'mobile' | 'web',
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      event_type: eventType,
      platform,
      auth_method: 'otp_sms',
      success,
      metadata: {
        phone: this.maskPhoneNumber(phone),
        ...metadata
      }
    });
  }

  /**
   * Journaliser une activité suspecte
   */
  static async logSuspiciousActivity(
    eventType: 'rate_limit_exceeded' | 'suspicious_activity',
    platform: 'mobile' | 'web',
    authMethod: 'otp_sms' | 'email_password',
    details: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      event_type: eventType,
      platform,
      auth_method: authMethod,
      success: false,
      error_message: details,
      metadata: {
        security_alert: true,
        ...metadata
      }
    });
  }

  /**
   * Récupérer les logs d'authentification avec filtres
   */
  static async getAuthLogs(filters: AuthLogFilters, limit = 100): Promise<AuthLogEntry[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.platform) {
        query = query.eq('platform', filters.platform);
      }
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters.user_role) {
        query = query.eq('user_role', filters.user_role);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      return [];
    }
  }

  /**
   * Obtenir les statistiques des logs d'authentification
   */
  static async getAuthLogStats(filters?: AuthLogFilters): Promise<AuthLogStats> {
    try {
      const logs = await this.getAuthLogs(filters || {}, 1000);
      
      const totalEvents = logs.length;
      const successCount = logs.filter(log => log.success).length;
      const successRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 0;

      const eventsByType: Record<AuthEventType, number> = {} as Record<AuthEventType, number>;
      const eventsByPlatform: Record<string, number> = {};
      const eventsByRole: Record<string, number> = {};

      logs.forEach(log => {
        // Compter par type d'événement
        eventsByType[log.event_type] = (eventsByType[log.event_type] || 0) + 1;
        
        // Compter par plateforme
        eventsByPlatform[log.platform] = (eventsByPlatform[log.platform] || 0) + 1;
        
        // Compter par rôle
        if (log.user_role) {
          eventsByRole[log.user_role] = (eventsByRole[log.user_role] || 0) + 1;
        }
      });

      const recentFailures = logs
        .filter(log => !log.success)
        .slice(0, 10);

      return {
        total_events: totalEvents,
        success_rate: Math.round(successRate * 100) / 100,
        events_by_type: eventsByType,
        events_by_platform: eventsByPlatform,
        events_by_role: eventsByRole,
        recent_failures: recentFailures
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        total_events: 0,
        success_rate: 0,
        events_by_type: {} as Record<AuthEventType, number>,
        events_by_platform: {},
        events_by_role: {},
        recent_failures: []
      };
    }
  }

  /**
   * Nettoyer les anciens logs (rétention configurable)
   */
  static async cleanupOldLogs(retentionDays = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Erreur lors du nettoyage des logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      return 0;
    }
  }

  /**
   * Masquer un numéro de téléphone pour la confidentialité
   */
  private static maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return phone;
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
  }

  /**
   * Calculer la durée d'une session
   */
  private static calculateSessionDuration(user: User): number | null {
    if (!user.created_at) return null;
    
    const createdAt = new Date(user.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - createdAt.getTime()) / 1000); // en secondes
  }

  /**
   * Exporter les logs en CSV (pour audit externe)
   */
  static async exportLogsToCSV(filters?: AuthLogFilters): Promise<string> {
    try {
      const logs = await this.getAuthLogs(filters || {}, 10000);
      
      if (logs.length === 0) {
        return '';
      }

      const headers = Object.keys(logs[0]).join(',');
      const rows = logs.map(log => 
        Object.values(log).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );

      return [headers, ...rows].join('\n');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      return '';
    }
  }
}

export default AuthLoggingService;
