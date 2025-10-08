import { useCache } from './useCache';
import { NotificationsService } from '../services/domain/notifications';
import { Notification, NotificationFilters } from '../services/domain/notifications/notifications.types';

const notificationsService = new NotificationsService();

/**
 * Hook pour récupérer les notifications d'un utilisateur.
 * @param userId - L'ID de l'utilisateur.
 * @param filters - Filtres optionnels.
 * @param options - Options de cache.
 */
export function useUserNotifications(
  userId: string | null,
  filters?: NotificationFilters,
  options = {}
) {
  const key = userId ? `notifications:user:${userId}:${JSON.stringify(filters || {})}` : null;

  const fetcher = async () => {
    if (!userId) return [];
    console.log(`🚀 [useUserNotifications] Fetching notifications for user: ${userId}`);
    return notificationsService.getByUserId(userId, filters);
  };

  return useCache<Notification[]>(key, fetcher, options);
}

/**
 * Hook pour récupérer le nombre de notifications non lues d'un utilisateur.
 * @param userId - L'ID de l'utilisateur.
 * @param options - Options de cache.
 */
export function useUnreadNotificationsCount(userId: string | null, options = {}) {
  const key = userId ? `notifications:unread-count:${userId}` : null;

  const fetcher = async () => {
    if (!userId) return 0;
    console.log(`🚀 [useUnreadNotificationsCount] Fetching unread count for user: ${userId}`);
    return notificationsService.getUnreadCount(userId);
  };

  return useCache<number>(key, fetcher, options);
}

/**
 * Hook pour récupérer les statistiques globales des notifications.
 * @param options - Options de cache.
 */
export function useNotificationStats(options = {}) {
  const key = 'notifications:stats';

  const fetcher = async () => {
    console.log(`🚀 [useNotificationStats] Fetching notification stats`);
    return notificationsService.getStats();
  };

  return useCache<NotificationStats>(key, fetcher, options);
}
