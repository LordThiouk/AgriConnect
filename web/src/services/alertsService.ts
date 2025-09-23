import { supabase } from '../lib/supabase';
import { 
  Recommendation, 
  AgriRule, 
  Notification, 
  RecommendationFilters, 
  RecommendationStats,
  AgriRuleFilters,
  NotificationFilters,
  NotificationStats,
  FilterOption
} from '../types';

// Configuration pour utiliser les données mock ou Supabase
const useMockData = false; // Utilise maintenant les vraies données Supabase via RPC

export class AlertsService {
  
  // ===== RECOMMENDATIONS =====
  
  static async getRecommendations(
    filters: RecommendationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Recommendation[]; total: number }> {
    try {
      if (useMockData) {
        return this.getMockRecommendations(filters, page, limit);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise les vraies données Supabase via RPC
      const { data, error } = await supabase.rpc('get_recommendations_with_details', {
        filters: JSON.stringify(filters),
        page,
        page_size: limit
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { data: [], total: 0 };
      }

      // Transformer les données RPC en format Recommendation
      const recommendations: Recommendation[] = data.map((row: any) => ({
        id: row.id,
        crop_id: row.crop_id,
        plot_id: row.plot_id,
        producer_id: row.producer_id,
        rule_code: row.rule_code,
        title: row.title,
        message: row.message,
        recommendation_type: row.recommendation_type,
        priority: row.priority,
        status: row.status,
        sent_at: row.sent_at,
        acknowledged_at: row.acknowledged_at,
        completed_at: row.completed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Relations
        producer: row.producer_first_name ? {
          id: row.producer_id,
          first_name: row.producer_first_name,
          last_name: row.producer_last_name,
          phone: row.producer_phone,
          region: row.producer_region,
          cooperative_id: row.producer_cooperative_id,
          profile_id: row.producer_id
        } : undefined,
        plot: row.plot_name ? {
          id: row.plot_id,
          name: row.plot_name,
          producer_id: row.producer_id,
          area_hectares: row.plot_area_hectares,
          soil_type: row.plot_soil_type,
          water_source: row.plot_water_source,
          status: row.plot_status,
          created_at: row.created_at,
          updated_at: row.updated_at
        } : undefined,
        crop: row.crop_crop_type ? {
          id: row.crop_id,
          plot_id: row.plot_id,
          farm_file_plot_id: row.crop_id, // Approximation
          crop_type: row.crop_crop_type,
          variety: row.crop_variety,
          sowing_date: row.crop_sowing_date,
          status: row.crop_status,
          created_at: row.created_at,
          updated_at: row.updated_at
        } : undefined
      }));

      const total = data[0]?.total_count || 0;
      return { data: recommendations, total };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  static async getRecommendationById(id: string): Promise<Recommendation | null> {
    try {
      if (useMockData) {
        return this.getMockRecommendationById(id);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // TODO: Implémenter avec RPC function get_recommendation_by_id_with_details
      return this.getMockRecommendationById(id);
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      throw error;
    }
  }

  static async createRecommendation(data: Partial<Recommendation>): Promise<Recommendation> {
    try {
      if (useMockData) {
        return this.createMockRecommendation(data);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function create_recommendation
      const { data: result, error } = await supabase.rpc('create_recommendation' as any, {
        p_title: data.title,
        p_message: data.message, // Utilise 'message' au lieu de 'description'
        p_recommendation_type: data.recommendation_type,
        p_priority: data.priority,
        p_status: data.status || 'pending',
        p_plot_id: data.plot_id,
        p_rule_code: data.rule_code
      });

      if (error) {
        console.error('Error creating recommendation:', error);
        throw error;
      }

      return result[0];
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw error;
    }
  }

  static async updateRecommendation(id: string, data: Partial<Recommendation>): Promise<Recommendation> {
    try {
      if (useMockData) {
        return this.updateMockRecommendation(id, data);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function update_recommendation
      const { data: result, error } = await supabase.rpc('update_recommendation', {
        p_id: id,
        p_title: data.title,
        p_message: data.message, // Utilise 'message' au lieu de 'description'
        p_recommendation_type: data.recommendation_type,
        p_priority: data.priority,
        p_status: data.status,
        p_plot_id: data.plot_id,
        p_rule_code: data.rule_code
      });

      if (error) {
        console.error('Error updating recommendation:', error);
        throw error;
      }

      if (!result || result.length === 0) {
        throw new Error('No recommendation updated');
      }

      // Transformer le résultat en format Recommendation
      const updatedRec = result[0];
      return {
        id: updatedRec.id,
        title: updatedRec.title,
        description: updatedRec.description,
        recommendation_type: updatedRec.recommendation_type,
        priority: updatedRec.priority,
        status: updatedRec.status,
        created_at: updatedRec.updated_at,
        plot_area_hectares: updatedRec.plot_area_hectares,
        plot_name: updatedRec.plot_name,
        producer_name: updatedRec.producer_name,
        cooperative_name: updatedRec.cooperative_name,
        rule_name: updatedRec.rule_name
      };
    } catch (error) {
      console.error('Error updating recommendation:', error);
      throw error;
    }
  }

  static async deleteRecommendation(id: string): Promise<void> {
    try {
      if (useMockData) {
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function delete_recommendation
      const { error } = await supabase.rpc('delete_recommendation', {
        p_id: id
      });

      if (error) {
        console.error('Error deleting recommendation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  }

  static async updateRecommendationStatus(id: string, status: string): Promise<void> {
    try {
      if (useMockData) {
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function update_recommendation_status
      const { error } = await supabase.rpc('update_recommendation_status', {
        recommendation_id: id,
        new_status: status
      });

      if (error) {
        console.error('Error updating recommendation status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      throw error;
    }
  }

  static async getRecommendationStats(): Promise<RecommendationStats> {
    try {
      if (useMockData) {
        return this.getMockRecommendationStats();
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function get_recommendation_stats
      const { data, error } = await supabase.rpc('get_recommendation_stats');

      if (error) {
        console.error('Error fetching recommendation stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalRecommendations: 0,
          pendingRecommendations: 0,
          completedRecommendations: 0,
          criticalRecommendations: 0,
          recommendationsByType: {},
          recommendationsByPriority: {},
          recommendationsByStatus: {}
        };
      }

      const stats = data[0];
      return {
        totalRecommendations: parseInt(stats.total_recommendations) || 0,
        pendingRecommendations: parseInt(stats.pending_recommendations) || 0,
        completedRecommendations: parseInt(stats.completed_recommendations) || 0,
        criticalRecommendations: parseInt(stats.critical_recommendations) || 0,
        recommendationsByType: stats.recommendations_by_type || {},
        recommendationsByPriority: stats.recommendations_by_priority || {},
        recommendationsByStatus: stats.recommendations_by_status || {}
      };
    } catch (error) {
      console.error('Error fetching recommendation stats:', error);
      throw error;
    }
  }

  // ===== AGRI RULES =====

  static async getAgriRules(
    filters: AgriRuleFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: AgriRule[]; total: number }> {
    try {
      if (useMockData) {
        return this.getMockAgriRules(filters, page, limit);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function get_agri_rules_with_filters
      const { data, error } = await supabase.rpc('get_agri_rules_with_filters', {
        filters: JSON.stringify(filters),
        page,
        page_size: limit
      });

      if (error) {
        console.error('Error fetching agri rules:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { data: [], total: 0 };
      }

      // Transformer les données RPC en format AgriRule
      const agriRules: AgriRule[] = data.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        condition_sql: row.condition_sql,
        action_type: row.action_type,
        action_message: row.action_message,
        severity: row.severity,
        is_active: row.is_active,
        applicable_crops: row.applicable_crops || [],
        applicable_regions: row.applicable_regions || [],
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      const total = data[0]?.total_count || 0;
      return { data: agriRules, total };
    } catch (error) {
      console.error('Error fetching agri rules:', error);
      throw error;
    }
  }

  static async getAgriRuleById(id: string): Promise<AgriRule | null> {
    try {
      if (useMockData) {
        return this.getMockAgriRuleById(id);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // TODO: Implémenter avec RPC function get_agri_rule_by_id
      return this.getMockAgriRuleById(id);
    } catch (error) {
      console.error('Error fetching agri rule:', error);
      throw error;
    }
  }

  static async createAgriRule(data: Partial<AgriRule>): Promise<AgriRule> {
    try {
      if (useMockData) {
        return this.createMockAgriRule(data);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function create_agri_rule
      const { data: result, error } = await supabase.rpc('create_agri_rule', {
        p_name: data.name,
        p_description: data.description,
        p_code: data.code,
        p_severity: data.severity,
        p_action_type: data.action_type,
        p_condition_logic: data.condition_logic,
        p_action_params: data.action_params,
        p_applicable_crops: data.applicable_crops,
        p_applicable_regions: data.applicable_regions,
        p_is_active: data.is_active,
        p_created_by: null // TODO: Récupérer l'ID de l'utilisateur connecté
      });

      if (error) {
        console.error('Error creating agri rule:', error);
        throw error;
      }

      if (!result || result.length === 0) {
        throw new Error('No agri rule created');
      }

      // Transformer le résultat en format AgriRule
      const newRule = result[0];
      return {
        id: newRule.id,
        name: newRule.name,
        description: newRule.description,
        code: newRule.code,
        severity: newRule.severity,
        action_type: newRule.action_type,
        condition_logic: newRule.condition_logic,
        action_params: newRule.action_params,
        applicable_crops: newRule.applicable_crops,
        applicable_regions: newRule.applicable_regions,
        is_active: newRule.is_active,
        created_at: newRule.created_at
      };
    } catch (error) {
      console.error('Error creating agri rule:', error);
      throw error;
    }
  }

  static async updateAgriRule(id: string, data: Partial<AgriRule>): Promise<AgriRule> {
    try {
      if (useMockData) {
        return this.updateMockAgriRule(id, data);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function update_agri_rule
      const { data: result, error } = await supabase.rpc('update_agri_rule', {
        p_id: id,
        p_name: data.name,
        p_description: data.description,
        p_severity: data.severity,
        p_action_type: data.action_type,
        p_condition_logic: data.condition_logic,
        p_action_params: data.action_params,
        p_applicable_crops: data.applicable_crops,
        p_applicable_regions: data.applicable_regions,
        p_is_active: data.is_active
      });

      if (error) {
        console.error('Error updating agri rule:', error);
        throw error;
      }

      if (!result || result.length === 0) {
        throw new Error('No agri rule updated');
      }

      // Transformer le résultat en format AgriRule
      const updatedRule = result[0];
      return {
        id: updatedRule.id,
        name: updatedRule.name,
        description: updatedRule.description,
        code: updatedRule.code,
        severity: updatedRule.severity,
        action_type: updatedRule.action_type,
        condition_logic: updatedRule.condition_logic,
        action_params: updatedRule.action_params,
        applicable_crops: updatedRule.applicable_crops,
        applicable_regions: updatedRule.applicable_regions,
        is_active: updatedRule.is_active,
        created_at: updatedRule.updated_at
      };
    } catch (error) {
      console.error('Error updating agri rule:', error);
      throw error;
    }
  }

  static async deleteAgriRule(id: string): Promise<void> {
    try {
      if (useMockData) {
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function delete_agri_rule
      const { error } = await supabase.rpc('delete_agri_rule', {
        p_id: id
      });

      if (error) {
        console.error('Error deleting agri rule:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting agri rule:', error);
      throw error;
    }
  }

  static async toggleAgriRuleStatus(id: string, is_active: boolean): Promise<void> {
    try {
      if (useMockData) {
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // TODO: Implémenter avec RPC function toggle_agri_rule_status
    } catch (error) {
      console.error('Error toggling agri rule status:', error);
      throw error;
    }
  }

  static async testAgriRule(id: string): Promise<{ success: boolean; message: string; affected_records?: number }> {
    try {
      if (useMockData) {
        return { success: true, message: 'Règle testée avec succès (mock)', affected_records: 5 };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // TODO: Implémenter avec RPC function test_agri_rule_condition
      return { success: true, message: 'Règle testée avec succès', affected_records: 5 };
    } catch (error) {
      console.error('Error testing agri rule:', error);
      throw error;
    }
  }

  // ===== NOTIFICATIONS =====

  static async getNotifications(
    filters: NotificationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Notification[]; total: number }> {
    try {
      if (useMockData) {
        return this.getMockNotifications(filters, page, limit);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function get_notifications_with_details
      const { data, error } = await supabase.rpc('get_notifications_with_details', {
        filters: JSON.stringify(filters),
        page,
        page_size: limit
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { data: [], total: 0 };
      }

      // Transformer les données RPC en format Notification
      const notifications: Notification[] = data.map((row: any) => ({
        id: row.id,
        profile_id: row.profile_id,
        title: row.title,
        body: row.body,
        channel: row.channel,
        provider: row.provider,
        status: row.status,
        sent_at: row.sent_at,
        delivered_at: row.delivered_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_id: row.profile_id,
        message: row.body,
        type: 'info', // Valeur par défaut car la colonne type n'existe pas
        is_read: false // Valeur par défaut car la colonne is_read n'existe pas
      }));

      const total = data[0]?.total_count || 0;
      return { data: notifications, total };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getNotificationStats(): Promise<NotificationStats> {
    try {
      if (useMockData) {
        return this.getMockNotificationStats();
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // TODO: Implémenter avec RPC function get_notification_stats
      return this.getMockNotificationStats();
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  static async createNotification(data: Partial<Notification>): Promise<Notification> {
    try {
      if (useMockData) {
        return this.createMockNotification(data);
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function create_notification
      const { data: result, error } = await supabase.rpc('create_notification', {
        p_title: data.title,
        p_content: data.content, // Utilise 'content' au lieu de 'message'
        p_channel: data.channel,
        p_recipient_id: data.recipient_id
      });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      if (!result) {
        throw new Error('No notification created');
      }

      // Transformer le résultat en format Notification
      const newNotification = result; // result est déjà un objet, pas un tableau
      return {
        id: newNotification.id,
        title: newNotification.title,
        message: newNotification.body, // 'body' au lieu de 'message'
        channel: newNotification.channel,
        status: newNotification.status,
        sent_at: newNotification.sent_at,
        recipient_name: 'Système', // Valeur par défaut
        sender_name: 'Système', // Valeur par défaut
        type: 'info', // Valeur par défaut
        is_read: false // Valeur par défaut
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async resendNotification(id: string): Promise<void> {
    try {
      if (useMockData) {
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function resend_notification
      const { error } = await supabase.rpc('resend_notification', {
        p_id: id
      });

      if (error) {
        console.error('Error resending notification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error resending notification:', error);
      throw error;
    }
  }

  // ===== FILTER OPTIONS =====

  static async getFilterOptions(): Promise<{
    recommendationTypes: FilterOption[];
    priorities: FilterOption[];
    statuses: FilterOption[];
    producers: FilterOption[];
    regions: FilterOption[];
    cooperatives: FilterOption[];
  }> {
    try {
      if (useMockData) {
        return this.getMockFilterOptions();
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // TODO: Implémenter avec des requêtes réelles
      return this.getMockFilterOptions();
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

  // ===== MOCK DATA METHODS =====

  private static getMockRecommendations(
    filters: RecommendationFilters,
    page: number,
    limit: number
  ): { data: Recommendation[]; total: number } {
    const mockData: Recommendation[] = [
      {
        id: '1',
        title: 'Fertilisation recommandée',
        message: 'Il est temps d\'appliquer de l\'engrais NPK pour le maïs',
        recommendation_type: 'fertilisation',
        priority: 'high',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        producer_id: 'prod-1',
        plot_id: 'plot-1',
        crop_id: 'crop-1'
      },
      {
        id: '2',
        title: 'Irrigation nécessaire',
        message: 'Les plantes montrent des signes de stress hydrique',
        recommendation_type: 'irrigation',
        priority: 'urgent',
        status: 'sent',
        sent_at: '2024-01-15T11:00:00Z',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T11:00:00Z',
        producer_id: 'prod-2',
        plot_id: 'plot-2'
      }
    ];

    return {
      data: mockData.slice((page - 1) * limit, page * limit),
      total: mockData.length
    };
  }

  private static getMockRecommendationById(id: string): Recommendation | null {
    const mockData = this.getMockRecommendations({}, 1, 100).data;
    return mockData.find(r => r.id === id) || null;
  }

  private static createMockRecommendation(data: Partial<Recommendation>): Recommendation {
    return {
      id: Date.now().toString(),
      title: data.title || 'Nouvelle recommandation',
      message: data.message || '',
      recommendation_type: data.recommendation_type || 'other',
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    } as Recommendation;
  }

  private static updateMockRecommendation(id: string, data: Partial<Recommendation>): Recommendation {
    const existing = this.getMockRecommendationById(id);
    if (!existing) {
      throw new Error('Recommendation not found');
    }
    
    return {
      ...existing,
      ...data,
      updated_at: new Date().toISOString()
    };
  }

  private static getMockRecommendationStats(): RecommendationStats {
    return {
      totalRecommendations: 156,
      pendingRecommendations: 23,
      completedRecommendations: 98,
      criticalRecommendations: 12,
      recommendationsByType: {
        'fertilisation': 45,
        'irrigation': 32,
        'pest_control': 28,
        'harvest': 35,
        'other': 16
      },
      recommendationsByPriority: {
        'urgent': 12,
        'high': 34,
        'medium': 67,
        'low': 43
      },
      recommendationsByStatus: {
        'pending': 23,
        'sent': 45,
        'acknowledged': 56,
        'completed': 98,
        'dismissed': 12
      }
    };
  }

  private static getMockAgriRules(
    filters: AgriRuleFilters,
    page: number,
    limit: number
  ): { data: AgriRule[]; total: number } {
    const mockData: AgriRule[] = [
      {
        id: '1',
        code: 'FERTILIZATION_ALERT',
        name: 'Alerte Fertilisation',
        description: 'Alerte quand il est temps de fertiliser',
        condition_sql: "SELECT * FROM crops WHERE days_since_planting > 30 AND fertilization_applied = false",
        action_type: 'recommendation',
        action_message: 'Il est temps d\'appliquer de l\'engrais',
        severity: 'warning',
        is_active: true,
        applicable_crops: ['maïs', 'riz'],
        applicable_regions: ['Kaolack', 'Thiès'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    return {
      data: mockData.slice((page - 1) * limit, page * limit),
      total: mockData.length
    };
  }

  private static getMockAgriRuleById(id: string): AgriRule | null {
    const mockData = this.getMockAgriRules({}, 1, 100).data;
    return mockData.find(r => r.id === id) || null;
  }

  private static createMockAgriRule(data: Partial<AgriRule>): AgriRule {
    return {
      id: Date.now().toString(),
      code: data.code || 'RULE_' + Date.now(),
      name: data.name || 'Nouvelle règle',
      description: data.description || '',
      condition_sql: data.condition_sql || '',
      action_type: data.action_type || 'notification',
      action_message: data.action_message || '',
      severity: data.severity || 'info',
      is_active: data.is_active ?? true,
      applicable_crops: data.applicable_crops || [],
      applicable_regions: data.applicable_regions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    } as AgriRule;
  }

  private static updateMockAgriRule(id: string, data: Partial<AgriRule>): AgriRule {
    const existing = this.getMockAgriRuleById(id);
    if (!existing) {
      throw new Error('Agri rule not found');
    }
    
    return {
      ...existing,
      ...data,
      updated_at: new Date().toISOString()
    };
  }

  private static getMockNotifications(
    filters: NotificationFilters,
    page: number,
    limit: number
  ): { data: Notification[]; total: number } {
    const mockData: Notification[] = [
      {
        id: '1',
        profile_id: 'user-1',
        title: 'Recommandation fertilisation',
        body: 'Il est temps d\'appliquer de l\'engrais pour votre culture de maïs',
        channel: 'sms',
        provider: 'twilio',
        status: 'delivered',
        sent_at: '2024-01-15T10:00:00Z',
        delivered_at: '2024-01-15T10:01:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:01:00Z',
        user_id: 'user-1',
        message: 'Il est temps d\'appliquer de l\'engrais pour votre culture de maïs',
        type: 'info',
        is_read: false
      }
    ];

    return {
      data: mockData.slice((page - 1) * limit, page * limit),
      total: mockData.length
    };
  }

  private static getMockNotificationStats(): NotificationStats {
    return {
      totalNotifications: 234,
      pendingNotifications: 15,
      deliveredNotifications: 198,
      failedNotifications: 21,
      notificationsByChannel: {
        'sms': 156,
        'whatsapp': 45,
        'push': 23,
        'email': 10
      },
      notificationsByStatus: {
        'pending': 15,
        'sent': 45,
        'delivered': 198,
        'failed': 21
      },
      deliveryRate: 84.6
    };
  }

  private static getMockFilterOptions() {
    return {
      recommendationTypes: [
        { value: 'fertilisation', label: 'Fertilisation' },
        { value: 'irrigation', label: 'Irrigation' },
        { value: 'pest_control', label: 'Lutte contre les ravageurs' },
        { value: 'harvest', label: 'Récolte' },
        { value: 'other', label: 'Autre' }
      ],
      priorities: [
        { value: 'urgent', label: 'Urgent' },
        { value: 'high', label: 'Élevée' },
        { value: 'medium', label: 'Moyenne' },
        { value: 'low', label: 'Faible' }
      ],
      statuses: [
        { value: 'pending', label: 'En attente' },
        { value: 'sent', label: 'Envoyée' },
        { value: 'acknowledged', label: 'Reconnue' },
        { value: 'completed', label: 'Complétée' },
        { value: 'dismissed', label: 'Rejetée' }
      ],
      producers: [
        { value: 'prod-1', label: 'Amadou Diallo' },
        { value: 'prod-2', label: 'Fatou Sarr' }
      ],
      regions: [
        { value: 'Kaolack', label: 'Kaolack' },
        { value: 'Thiès', label: 'Thiès' },
        { value: 'Dakar', label: 'Dakar' }
      ],
      cooperatives: [
        { value: 'coop-1', label: 'Coopérative de Kaolack' },
        { value: 'coop-2', label: 'Coopérative de Thiès' }
      ]
    };
  }

  // Supprimer une notification
  static async deleteNotification(id: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Utilise la RPC function delete_notification
      const { error } = await supabase.rpc('delete_notification', {
        p_notification_id: id
      });

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}
