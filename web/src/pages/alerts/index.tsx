import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Settings, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import Layout from '../../components/Layout/Layout';

// Type assertions pour résoudre les conflits de types
const BellIcon = Bell as any;
const AlertTriangleIcon = AlertTriangle as any;
const SettingsIcon = Settings as any;
const MessageSquareIcon = MessageSquare as any;
const TabsComponent = Tabs as any;
const TabsListComponent = TabsList as any;
const TabsTriggerComponent = TabsTrigger as any;
const TabsContentComponent = TabsContent as any;
import { useToast } from '../../context/ToastContext';
import { Recommendation, AgriRule, Notification, RecommendationStats, NotificationStats } from '../../types';

// Import des composants d'onglets
import RecommendationsTab from '../../components/Alerts/RecommendationsTab';
import { AlertesTab } from '../../components/Alerts/AlertesTab';
import { AgriRulesTab } from '../../components/Alerts/AgriRulesTab';
import { NotificationsTab } from '../../components/Alerts/NotificationsTab';

// Import du service
import { AlertsService } from '../../services/alertsService';

const AlertsPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [stats, setStats] = useState<{
    recommendations: RecommendationStats | null;
    notifications: NotificationStats | null;
  }>({
    recommendations: null,
    notifications: null
  });
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Utilise les vraies données via AlertsService
      const [recommendationStats, notificationStats] = await Promise.all([
        AlertsService.getRecommendationStats(),
        AlertsService.getNotificationStats()
      ]);
      
      setStats({
        recommendations: recommendationStats,
        notifications: notificationStats
      });
    } catch (error) {
      console.error('Error loading alerts stats:', error);
      showToast({ type: 'error', title: 'Erreur lors du chargement des statistiques' });
      
      // Pas de fallback mock - laisser les stats à null pour afficher un message d'erreur
      setStats({
        recommendations: null,
        notifications: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertes & Recommandations</h1>
          <p className="text-gray-600 mt-1">
            Gestion des alertes, recommandations, règles métier et notifications
          </p>
        </div>
        <Button 
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <BellIcon className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      {stats.recommendations && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Recommandations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recommendations.totalRecommendations}</p>
                </div>
                <div className="flex-shrink-0">
                  <BellIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">En Attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recommendations.pendingRecommendations}</p>
                </div>
                <div className="flex-shrink-0">
                  <AlertTriangleIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Complétées</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recommendations.completedRecommendations}</p>
                </div>
                <div className="flex-shrink-0">
                  <MessageSquareIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Critiques</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recommendations.criticalRecommendations}</p>
                </div>
                <div className="flex-shrink-0">
                  <AlertTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets principaux */}
      <Card>
        <CardContent className="p-0">
          <TabsComponent value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="border-b border-gray-200">
              <TabsListComponent className="h-auto bg-transparent p-0 w-full justify-start">
                <TabsTriggerComponent 
                  value="recommendations" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <BellIcon className="h-4 w-4" />
                  Recommandations
                </TabsTriggerComponent>
                <TabsTriggerComponent 
                  value="alerts" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <AlertTriangleIcon className="h-4 w-4" />
                  Alertes
                </TabsTriggerComponent>
                <TabsTriggerComponent 
                  value="rules" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Règles métier
                </TabsTriggerComponent>
                <TabsTriggerComponent 
                  value="notifications" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <MessageSquareIcon className="h-4 w-4" />
                  Notifications
                </TabsTriggerComponent>
              </TabsListComponent>
            </div>

            <div className="p-6">
              <TabsContentComponent value="recommendations" className="mt-0">
                <RecommendationsTab onRefresh={loadStats} />
              </TabsContentComponent>

              <TabsContentComponent value="alerts" className="mt-0">
                <AlertesTab onRefresh={loadStats} />
              </TabsContentComponent>

              <TabsContentComponent value="rules" className="mt-0">
                <AgriRulesTab onRefresh={loadStats} />
              </TabsContentComponent>

              <TabsContentComponent value="notifications" className="mt-0">
                <NotificationsTab onRefresh={loadStats} />
              </TabsContentComponent>
            </div>
          </TabsComponent>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
};

export default AlertsPage;
