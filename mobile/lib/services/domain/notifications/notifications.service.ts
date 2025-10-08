/**
 * Service pour la gestion des notifications
 */

import { supabase } from '../../../../lib/supabase-client';
import { agriConnectCache } from '../../core/cache';
import { NotificationsCache } from './notifications.cache';
import {
  Notification,
  NotificationCreate,
  NotificationUpdate,
  NotificationFilters,
  NotificationStats,
  NotificationWithDetails,
  BulkNotificationCreate
} from './notifications.types';

export class NotificationsService {
  private cache: NotificationsCache;

  constructor() {
    this.cache = new NotificationsCache(agriConnectCache);
  }

  /**
   * Récupérer toutes les notifications avec filtres optionnels
   */
  async getAll(filters?: NotificationFilters): Promise<Notification[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getList(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour liste notifications');
        return cached;
      }

      console.log('🔔 Récupération des notifications depuis la base');

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.recipient_id) {
        query = query.eq('recipient_id', filters.recipient_id);
      }
      if (filters?.recipient_type) {
        query = query.eq('recipient_type', filters.recipient_type);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.channel) {
        query = query.eq('channel', filters.channel);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des notifications:', error);
        throw error;
      }

      const notifications = data || [];
      
      // Mettre en cache
      await this.cache.setList(notifications, filters);
      
      console.log(`✅ ${notifications.length} notifications récupérées`);
      return notifications;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.getAll:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getByUserId(userId: string, filters?: NotificationFilters): Promise<Notification[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getUserNotifications(userId, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour notifications utilisateur:', userId);
        return cached;
      }

      console.log('🔔 Récupération des notifications pour utilisateur:', userId);

      const userFilters = { ...filters, recipient_id: userId };
      const notifications = await this.getAll(userFilters);

      // Mettre en cache spécifique à l'utilisateur
      await this.cache.setUserNotifications(userId, notifications, filters);

      console.log(`✅ ${notifications.length} notifications récupérées pour l'utilisateur`);
      return notifications;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.getByUserId:', error);
      throw error;
    }
  }

  /**
   * Récupérer une notification par ID
   */
  async getById(id: string): Promise<Notification | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItem(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour notification:', id);
        return cached;
      }

      console.log('🔔 Récupération de la notification:', id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Notification non trouvée:', id);
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la notification:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setItem(id, data);
      }

      console.log('✅ Notification récupérée:', data?.title);
      return data;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.getById:', error);
      throw error;
    }
  }

  /**
   * Récupérer une notification avec détails
   */
  async getByIdWithDetails(id: string): Promise<NotificationWithDetails | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItemWithDetails(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour notification avec détails:', id);
        return cached;
      }

      console.log('🔔 Récupération de la notification avec détails:', id);

      // Récupérer la notification
      const notification = await this.getById(id);
      if (!notification) {
        return null;
      }

      // Récupérer les détails du destinataire
      let recipientDetails = {};
      if (notification.recipient_type === 'user' || notification.recipient_type === 'agent') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone')
          .eq('id', notification.recipient_id)
          .single();
        
        if (profile) {
          recipientDetails = {
            recipient_name: profile.display_name,
            recipient_phone: profile.phone
          };
        }
      }

      const result: NotificationWithDetails = {
        ...notification,
        ...recipientDetails
      };

      // Mettre en cache
      await this.cache.setItemWithDetails(id, result);

      console.log('✅ Notification avec détails récupérée:', notification.title);
      return result;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.getByIdWithDetails:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle notification
   */
  async create(data: NotificationCreate): Promise<Notification> {
    try {
      console.log('🔔 Création d\'une nouvelle notification:', data.title);

      const { data: result, error } = await supabase
        .from('notifications')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la notification:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateUserNotifications(data.recipient_id);
      await this.cache.invalidateStats();

      console.log('✅ Notification créée:', result.title);
      return result;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.create:', error);
      throw error;
    }
  }

  /**
   * Créer plusieurs notifications en lot
   */
  async createBulk(data: BulkNotificationCreate): Promise<Notification[]> {
    try {
      console.log('🔔 Création de notifications en lot:', data.title);

      const notifications = data.recipient_ids.map(recipientId => ({
        ...data,
        recipient_id: recipientId
      }));

      const { data: result, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la création des notifications:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log(`✅ ${result.length} notifications créées`);
      return result;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.createBulk:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une notification
   */
  async update(id: string, data: NotificationUpdate): Promise<Notification> {
    try {
      console.log('🔔 Mise à jour de la notification:', id);

      const { data: result, error } = await supabase
        .from('notifications')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la notification:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateUserNotifications(result.recipient_id);
      await this.cache.invalidateStats();

      console.log('✅ Notification mise à jour:', result.title);
      return result;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.update:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      console.log('🔔 Marquage de la notification comme lue:', id);

      const { data: result, error } = await supabase
        .from('notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors du marquage de la notification:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateUserNotifications(result.recipient_id);
      await this.cache.invalidateStats();

      console.log('✅ Notification marquée comme lue:', result.title);
      return result;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.markAsRead:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('🔔 Suppression de la notification:', id);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur lors de la suppression de la notification:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Notification supprimée:', id);

    } catch (error) {
      console.error('❌ Erreur NotificationsService.delete:', error);
      throw error;
    }
  }

  /**
   * Récupérer le nombre de notifications non lues pour un utilisateur
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getUnreadCount(userId);
      if (cached !== null) {
        console.log('⚡ [CACHE] Hit pour nombre notifications non lues:', userId);
        return cached;
      }

      console.log('🔔 Récupération du nombre de notifications non lues pour:', userId);

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('status', 'delivered');

      if (error) {
        console.error('❌ Erreur lors de la récupération du nombre de notifications:', error);
        throw error;
      }

      const unreadCount = count || 0;

      // Mettre en cache
      await this.cache.setUnreadCount(userId, unreadCount);

      console.log(`✅ ${unreadCount} notifications non lues pour l'utilisateur`);
      return unreadCount;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.getUnreadCount:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des notifications
   */
  async getStats(): Promise<NotificationStats> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getStats();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour stats notifications');
        return cached;
      }

      console.log('🔔 Récupération des statistiques des notifications');

      const { data, error } = await supabase
        .from('notifications')
        .select('type, priority, status, channel');

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const notifications = data || [];
      
      const stats: NotificationStats = {
        total_notifications: notifications.length,
        pending_notifications: notifications.filter(n => n.status === 'pending').length,
        sent_notifications: notifications.filter(n => n.status === 'sent').length,
        delivered_notifications: notifications.filter(n => n.status === 'delivered').length,
        read_notifications: notifications.filter(n => n.status === 'read').length,
        failed_notifications: notifications.filter(n => n.status === 'failed').length,
        by_type: notifications.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_priority: notifications.reduce((acc, n) => {
          acc[n.priority] = (acc[n.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_channel: notifications.reduce((acc, n) => {
          acc[n.channel] = (acc[n.channel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_status: notifications.reduce((acc, n) => {
          acc[n.status] = (acc[n.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      // Mettre en cache
      await this.cache.setStats(stats);

      console.log('✅ Statistiques des notifications récupérées');
      return stats;

    } catch (error) {
      console.error('❌ Erreur NotificationsService.getStats:', error);
      throw error;
    }
  }
}
