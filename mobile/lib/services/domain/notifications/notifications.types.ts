import { Database, CacheTTL } from '../lib/types/core';

type Notifications = Database['public']['Tables']['notifications']['Row'];
type NotificationsInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationsUpdate = Database['public']['Tables']['notifications']['Update'];

/**
 * Types pour le service Notifications
 */

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_id: string;
  recipient_type: 'user' | 'agent' | 'producer' | 'cooperative';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  channel: 'sms' | 'email' | 'push' | 'in_app';
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface NotificationCreate {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_id: string;
  recipient_type: 'user' | 'agent' | 'producer' | 'cooperative';
  channel: 'sms' | 'email' | 'push' | 'in_app';
  scheduled_at?: string;
  metadata?: Record<string, any>;
}

export interface NotificationUpdate {
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'alert';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduled_at?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  recipient_id?: string;
  recipient_type?: 'user' | 'agent' | 'producer' | 'cooperative';
  type?: 'info' | 'warning' | 'error' | 'success' | 'alert';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  channel?: 'sms' | 'email' | 'push' | 'in_app';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface NotificationStats {
  total_notifications: number;
  pending_notifications: number;
  sent_notifications: number;
  delivered_notifications: number;
  read_notifications: number;
  failed_notifications: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  by_channel: Record<string, number>;
  by_status: Record<string, number>;
}

export interface NotificationWithDetails extends Notification {
  recipient_name?: string;
  recipient_phone?: string;
  recipient_email?: string;
  delivery_attempts?: number;
  last_attempt_at?: string;
  error_message?: string;
}

export interface BulkNotificationCreate {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_ids: string[];
  recipient_type: 'user' | 'agent' | 'producer' | 'cooperative';
  channel: 'sms' | 'email' | 'push' | 'in_app';
  scheduled_at?: string;
  metadata?: Record<string, any>;
}
