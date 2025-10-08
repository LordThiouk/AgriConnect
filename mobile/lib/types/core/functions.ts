/**
 * Types des fonctions RPC de la base de données AgriConnect
 * Générés automatiquement depuis Supabase
 */

import { Database } from './database';

// Types des fonctions RPC principales
export type RpcFunctions = {
  // Agent functions
  get_agent_all_visits_with_filters: Database['public']['Functions']['get_agent_all_visits_with_filters'];
  get_agent_assigned_producers_for_visits: Database['public']['Functions']['get_agent_assigned_producers_for_visits'];
  get_agent_assignments: Database['public']['Functions']['get_agent_assignments'];
  get_agent_assignments_detailed_stats: Database['public']['Functions']['get_agent_assignments_detailed_stats'];
  get_agent_assignments_stats: Database['public']['Functions']['get_agent_assignments_stats'];
  get_agent_cooperatives: Database['public']['Functions']['get_agent_cooperatives'];
  get_agent_dashboard_stats: Database['public']['Functions']['get_agent_dashboard_stats'];
  get_agent_dashboard_unified: Database['public']['Functions']['get_agent_dashboard_unified'];
  get_agent_media: Database['public']['Functions']['get_agent_media'];
  get_agent_media_stats: Database['public']['Functions']['get_agent_media_stats'];
  get_agent_performance: Database['public']['Functions']['get_agent_performance'];
  get_agent_plots: Database['public']['Functions']['get_agent_plots'];
  get_agent_plots_with_geolocation: Database['public']['Functions']['get_agent_plots_with_geolocation'];
  get_agent_producers: Database['public']['Functions']['get_agent_producers'];
  get_agent_producers_unified: Database['public']['Functions']['get_agent_producers_unified'];
  get_agent_terrain_alerts: Database['public']['Functions']['get_agent_terrain_alerts'];
  get_agent_today_visits: Database['public']['Functions']['get_agent_today_visits'];
  get_agents_stats: Database['public']['Functions']['get_agents_stats'];

  // Agri rules functions
  get_agri_rule_by_id: Database['public']['Functions']['get_agri_rule_by_id'];
  get_agri_rules_with_filters: Database['public']['Functions']['get_agri_rules_with_filters'];

  // Assignment functions
  get_assigned_agents_for_producer: Database['public']['Functions']['get_assigned_agents_for_producer'];
  get_assigned_agents_for_producer_unified: Database['public']['Functions']['get_assigned_agents_for_producer_unified'];
  get_available_agents: Database['public']['Functions']['get_available_agents'];
  get_available_agents_for_producer: Database['public']['Functions']['get_available_agents_for_producer'];
  get_available_producers: Database['public']['Functions']['get_available_producers'];
  get_available_producers_for_agent: Database['public']['Functions']['get_available_producers_for_agent'];

  // Cooperative functions
  get_cooperatives_with_producer_count: Database['public']['Functions']['get_cooperatives_with_producer_count'];

  // Crop functions
  get_crop_by_id: Database['public']['Functions']['get_crop_by_id'];
  get_crop_by_id_with_plot_info: Database['public']['Functions']['get_crop_by_id_with_plot_info'];
  get_crops_by_plot_id: Database['public']['Functions']['get_crops_by_plot_id'];
  get_crops_count: Database['public']['Functions']['get_crops_count'];
  get_crops_with_plot_info: Database['public']['Functions']['get_crops_with_plot_info'];

  // Farm file functions
  get_farm_files: Database['public']['Functions']['get_farm_files'];
  get_farm_files_by_producer: Database['public']['Functions']['get_farm_files_by_producer'];
  get_farm_files_with_stats: Database['public']['Functions']['get_farm_files_with_stats'];

  // Media functions
  get_media_by_entity: Database['public']['Functions']['get_media_by_entity'];

  // Notification functions
  get_notification_phone: Database['public']['Functions']['get_notification_phone'];
  get_notification_stats: Database['public']['Functions']['get_notification_stats'];
  get_notifications_test: Database['public']['Functions']['get_notifications_test'];
  get_notifications_with_details: Database['public']['Functions']['get_notifications_with_details'];

  // Observation functions
  get_observations_for_agent: Database['public']['Functions']['get_observations_for_agent'];
  get_observations_for_plot: Database['public']['Functions']['get_observations_for_plot'];
  get_observations_with_details: Database['public']['Functions']['get_observations_with_details'];

  // Operation functions
  get_operations_for_plot: Database['public']['Functions']['get_operations_for_plot'];
  get_operations_with_details: Database['public']['Functions']['get_operations_with_details'];

  // Plot functions
  get_plot_by_id: Database['public']['Functions']['get_plot_by_id'];
  get_plots_by_producer: Database['public']['Functions']['get_plots_by_producer'];
  get_plots_with_geolocation: Database['public']['Functions']['get_plots_with_geolocation'];
  get_plots_with_geolocation_count: Database['public']['Functions']['get_plots_with_geolocation_count'];

  // Producer functions
  get_producer_assigned_agents: Database['public']['Functions']['get_producer_assigned_agents'];
  get_producers_with_phone: Database['public']['Functions']['get_producers_with_phone'];

  // Recommendation functions
  get_recommendation_stats: Database['public']['Functions']['get_recommendation_stats'];
  get_recommendations_with_details: Database['public']['Functions']['get_recommendations_with_details'];

  // Role functions
  get_role_display_name: Database['public']['Functions']['get_role_display_name'];
  get_role_permissions: Database['public']['Functions']['get_role_permissions'];
  get_user_cooperative_id: Database['public']['Functions']['get_user_cooperative_id'];
  get_user_role: Database['public']['Functions']['get_user_role'];

  // Visit functions
  get_visit_details: Database['public']['Functions']['get_visit_details'];
  get_visit_for_edit: Database['public']['Functions']['get_visit_for_edit'];
  get_visit_types: Database['public']['Functions']['get_visit_types'];

  // Utility functions
  is_admin_or_supervisor: Database['public']['Functions']['is_admin_or_supervisor'];
  is_agent_assigned_to_producer: Database['public']['Functions']['is_agent_assigned_to_producer'];
};

// Types des arguments des fonctions RPC les plus utilisées
export type GetAgentDashboardUnifiedArgs = Database['public']['Functions']['get_agent_dashboard_unified']['Args'];
export type GetAgentDashboardUnifiedReturn = Database['public']['Functions']['get_agent_dashboard_unified']['Returns'];

export type GetAgentPlotsWithGeolocationArgs = Database['public']['Functions']['get_agent_plots_with_geolocation']['Args'];
export type GetAgentPlotsWithGeolocationReturn = Database['public']['Functions']['get_agent_plots_with_geolocation']['Returns'];

export type GetCropsByPlotIdArgs = Database['public']['Functions']['get_crops_by_plot_id']['Args'];
export type GetCropsByPlotIdReturn = Database['public']['Functions']['get_crops_by_plot_id']['Returns'];

export type GetObservationsForAgentArgs = Database['public']['Functions']['get_observations_for_agent']['Args'];
export type GetObservationsForAgentReturn = Database['public']['Functions']['get_observations_for_agent']['Returns'];

export type GetObservationsForPlotArgs = Database['public']['Functions']['get_observations_for_plot']['Args'];
export type GetObservationsForPlotReturn = Database['public']['Functions']['get_observations_for_plot']['Returns'];

export type GetOperationsForPlotArgs = Database['public']['Functions']['get_operations_for_plot']['Args'];
export type GetOperationsForPlotReturn = Database['public']['Functions']['get_operations_for_plot']['Returns'];

export type GetPlotByIdArgs = Database['public']['Functions']['get_plot_by_id']['Args'];
export type GetPlotByIdReturn = Database['public']['Functions']['get_plot_by_id']['Returns'];

export type GetMediaByEntityArgs = Database['public']['Functions']['get_media_by_entity']['Args'];
export type GetMediaByEntityReturn = Database['public']['Functions']['get_media_by_entity']['Returns'];

export type GetAgentAllVisitsWithFiltersArgs = Database['public']['Functions']['get_agent_all_visits_with_filters']['Args'];
export type GetAgentAllVisitsWithFiltersReturn = Database['public']['Functions']['get_agent_all_visits_with_filters']['Returns'];

export type GetAgriRulesWithFiltersArgs = Database['public']['Functions']['get_agri_rules_with_filters']['Args'];
export type GetAgriRulesWithFiltersReturn = Database['public']['Functions']['get_agri_rules_with_filters']['Returns'];

export type GetAgriRuleByIdArgs = Database['public']['Functions']['get_agri_rule_by_id']['Args'];
export type GetAgriRuleByIdReturn = Database['public']['Functions']['get_agri_rule_by_id']['Returns'];
