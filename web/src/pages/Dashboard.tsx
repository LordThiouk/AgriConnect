import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardService, DashboardStats } from '../services/dashboardService';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import KPICard from '../components/dashboard/KPICard';
import EvolutionChart from '../components/dashboard/EvolutionChart';
import CultureDistributionChart from '../components/dashboard/CultureDistributionChart';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import MapPanel from '../components/dashboard/MapPanel';
import { 
  Users, 
  MapPin, 
  Wheat, 
  UserCheck
} from 'lucide-react';

const Dashboard: React.FC = () => {
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
      setLoading(true);
      setError(null);

      const stats = await DashboardService.getDashboardStats();
      setStats(stats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAlertResolve = (alertId: string) => {
    console.log('Résoudre alerte:', alertId);
    // TODO: Implémenter la logique de résolution d'alerte
  };

  const handleAlertDismiss = (alertId: string) => {
    console.log('Ignorer alerte:', alertId);
    // TODO: Implémenter la logique d'ignorer alerte
  };

  const handleViewMap = () => {
    console.log('Ouvrir la carte');
    // TODO: Implémenter l'ouverture de la carte
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-600 border-t-transparent mx-auto absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-xl text-gray-700 font-semibold">🌾 Chargement du dashboard AgriConnect...</p>
          <p className="mt-2 text-sm text-gray-500">Récupération des données en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-red-200">
          <div className="h-20 w-20 text-red-500 mx-auto mb-6">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6 text-lg">{error}</p>
          <button 
            onClick={fetchDashboardStats} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          userName={user?.user_metadata?.full_name || user?.email || 'Utilisateur'}
          userRole={user?.user_metadata?.role || 'user'}
          onMenuToggle={handleToggleSidebar}
          pageTitle="Tableau de bord"
          pageDescription="Vue d'ensemble de votre plateforme AgriConnect"
        />
        
        {/* Dashboard content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard
                title="Producteurs"
                value={stats.totalProducers}
                subtitle="Producteurs actifs"
                icon={Users}
                color="blue"
                trend={{ value: 12, isPositive: true }}
              />
              <KPICard
                title="Superficie"
                value={`${stats.totalArea} ha`}
                subtitle="Superficie totale"
                icon={MapPin}
                color="green"
                trend={{ value: 8, isPositive: true }}
              />
              <KPICard
                title="Cultures actives"
                value={stats.totalCrops}
                subtitle="Cultures en cours"
                icon={Wheat}
                color="orange"
                trend={{ value: 15, isPositive: true }}
              />
              <KPICard
                title="Agents actifs"
                value={stats.activeAgents}
                subtitle="Agents de terrain"
                icon={UserCheck}
                color="purple"
                trend={{ value: 5, isPositive: true }}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <EvolutionChart data={stats.evolutionData} />
              <CultureDistributionChart data={stats.cultureDistribution} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsPanel 
                alerts={stats.recentAlerts}
                onResolve={handleAlertResolve}
                onDismiss={handleAlertDismiss}
              />
              <MapPanel 
                plotCount={stats.totalPlots}
                onViewMap={handleViewMap}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;