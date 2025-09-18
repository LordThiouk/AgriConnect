import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardService, DashboardStats } from '../services/dashboardService';
import Layout from '../components/Layout/Layout';
import KPICard from '../components/dashboard/KPICard';
import EvolutionChart from '../components/dashboard/EvolutionChart';
import CultureDistributionChart from '../components/dashboard/CultureDistributionChart';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import MapPanel from '../components/dashboard/MapPanel';
import { Users, MapPin, Wheat, UserCheck, BarChart3, Building2, AlertTriangle, RefreshCw, Map, Navigation, Download, Megaphone } from 'lucide-react';

// Type assertions pour résoudre le conflit de types
const UsersIcon = Users as any;
const MapPinIcon = MapPin as any;
const WheatIcon = Wheat as any;
const UserCheckIcon = UserCheck as any;
const BarChart3Icon = BarChart3 as any;
const Building2Icon = Building2 as any;
const AlertTriangleIcon = AlertTriangle as any;
const RefreshCwIcon = RefreshCw as any;
const MapIcon = Map as any;
const NavigationIcon = Navigation as any;
const DownloadIcon = Download as any;
const MegaphoneIcon = Megaphone as any;

const Dashboard: React.FC = () => {
  console.log('🔍 Dashboard component loaded');
  
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('🔍 Dashboard: Starting to fetch stats...');
      setLoading(true);
      setError(null);

      const stats = await DashboardService.getDashboardStats();
      console.log('🔍 Dashboard: Stats received:', stats);
      setStats(stats);
    } catch (err) {
      console.error('🔍 Dashboard: Error loading stats:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      console.log('🔍 Dashboard: Loading finished');
      setLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAlertResolve = (alertId: string) => {
    console.log('Résoudre alerte:', alertId);
    // TODO: Implémenter la logique de résolution d'alerte
    // Pour l'instant, on peut simuler la résolution
    if (stats) {
      const updatedAlerts = stats.recentAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
      );
      setStats({ ...stats, recentAlerts: updatedAlerts });
    }
  };

  const handleAlertDismiss = (alertId: string) => {
    console.log('Ignorer alerte:', alertId);
    // TODO: Implémenter la logique d'ignorer alerte
    // Pour l'instant, on peut simuler le dismiss
    if (stats) {
      const updatedAlerts = stats.recentAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'dismissed' as const } : alert
      );
      setStats({ ...stats, recentAlerts: updatedAlerts });
    }
  };

  const handleViewMap = () => {
    console.log('Ouvrir la carte');
    // TODO: Implémenter l'ouverture de la carte
    // Redirection vers une page de carte ou ouverture d'un modal
    window.open('/map', '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-600 border-t-transparent mx-auto absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-xl text-gray-700 font-semibold flex items-center justify-center">
            <WheatIcon className="h-6 w-6 mr-2" />
            Chargement du dashboard AgriConnect...
          </p>
          <p className="mt-2 text-sm text-gray-500">Récupération des données en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-red-200">
          <div className="h-20 w-20 text-red-500 mx-auto mb-6">
            <AlertTriangleIcon className="h-20 w-20" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6 text-lg">{error}</p>
          <button 
            onClick={fetchDashboardStats} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    console.log('🔍 Dashboard: stats is null, showing debug message');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Debug</h1>
          <p className="text-gray-600">Stats non chargées</p>
          <p className="text-sm text-gray-500 mt-2">Vérifiez la console pour les logs</p>
          <button 
            onClick={fetchDashboardStats} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Recharger les stats
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Critical Alert Banner */}
      <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between mb-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangleIcon className="h-5 w-5" />
          <span className="font-medium">Alerte sanitaire critique: Maladie du maïs détectée dans la région Nord</span>
        </div>
        <button className="bg-red-700 hover:bg-red-800 px-4 py-1 rounded text-sm font-medium">
          Voir détails
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <Header
            userName={user?.user_metadata?.full_name || user?.email || 'Admin National'}
            userRole={user?.user_metadata?.role || 'admin'}
            onMenuToggle={handleToggleSidebar}
            pageTitle="Dashboard National"
            pageDescription="Vue d'ensemble de l'écosystème agricole"
            showAddButton={false}
            showExportButton={true}
            onExportClick={() => console.log('Export data')}
          />
          
          {/* Dashboard content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* KPI Cards - Primary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard
                  title="Producteurs suivis"
                  value="12,847"
                  subtitle="+8.2% ce mois"
                  icon={UsersIcon}
                  color="blue"
                  trend={{ value: 8.2, isPositive: true }}
                />
                <KPICard
                  title="Superficie totale"
                  value="45,290 ha"
                  subtitle="Surface cultivée"
                  icon={MapPinIcon}
                  color="green"
                  trend={{ value: 5.1, isPositive: true }}
                />
                <KPICard
                  title="Agents actifs"
                  value="342"
                  subtitle="+12 ce mois"
                  icon={UserCheckIcon}
                  color="purple"
                  trend={{ value: 12, isPositive: true }}
                />
                <KPICard
                  title="Coopératives"
                  value="156"
                  subtitle="enregistrées"
                  icon={Building2Icon}
                  color="orange"
                  trend={{ value: 3, isPositive: true }}
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Carte Nationale */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Carte Nationale</h2>
                      <div className="flex space-x-2">
                        <select className="text-sm border border-gray-300 rounded px-3 py-1" aria-label="Sélectionner une région">
                          <option>Toutes les régions</option>
                        </select>
                        <select className="text-sm border border-gray-300 rounded px-3 py-1" aria-label="Sélectionner une culture">
                          <option>Toutes les cultures</option>
                        </select>
                      </div>
                    </div>
                    <div className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                      <div className="text-center">
                        <MapIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Carte Interactive</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {stats.totalPlots} parcelle{stats.totalPlots > 1 ? 's' : ''} enregistrée{stats.totalPlots > 1 ? 's' : ''}
                        </p>
                        <div className="flex space-x-2">
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                            <NavigationIcon className="h-4 w-4 mr-2 inline" />
                            Ouvrir la carte
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 flex space-x-2">
                        <button className="bg-white shadow-md rounded px-3 py-1 text-sm">+</button>
                        <button className="bg-white shadow-md rounded px-3 py-1 text-sm">-</button>
                      </div>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                        Leaflet
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alertes Critiques */}
                <div className="lg:col-span-1">
                  <AlertsPanel 
                    alerts={stats.recentAlerts}
                    onResolve={handleAlertResolve}
                    onDismiss={handleAlertDismiss}
                  />
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <EvolutionChart data={stats.evolutionData} />
                <CultureDistributionChart data={stats.cultureDistribution} />
              </div>

              {/* Rapports & Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Rapports & Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Exporter rapport national (PDF)
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Exporter données (Excel)
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg flex items-center">
                    <MegaphoneIcon className="h-4 w-4 mr-2" />
                    Campagne nationale SMS
                  </button>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;