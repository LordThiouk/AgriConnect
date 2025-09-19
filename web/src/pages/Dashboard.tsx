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

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching dashboard stats...');
      
      const dashboardStats = await DashboardService.getDashboardStats();
      console.log('📊 Dashboard stats received:', dashboardStats);
      setStats(dashboardStats);
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDashboard = () => {
    console.log('📤 Exporting dashboard data...');
    // TODO: Implement export functionality
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-200 mx-auto"></div>
              <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-600 border-t-transparent mx-auto absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-xl text-gray-700 font-semibold flex items-center justify-center">
              <WheatIcon className="h-6 w-6 mr-2" />
              Chargement du dashboard AgriConnect...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
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
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Debug</h1>
            <p className="text-gray-600">Stats non chargées</p>
            <p className="text-sm text-gray-500 mt-2">Vérifiez la console pour les logs</p>
            <button 
              onClick={fetchDashboardStats} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Recharger
            </button>
          </div>
        </div>
      </Layout>
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

      <div className="space-y-6">
        {/* KPI Cards - Primary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Producteurs"
            value={stats.totalProducers}
            icon={UsersIcon}
            color="blue"
          />
          <KPICard
            title="Coopératives Actives"
            value={stats.cooperatives.length}
            icon={Building2Icon}
            color="green"
          />
          <KPICard
            title="Parcelles Enregistrées"
            value={stats.totalPlots}
            icon={MapPinIcon}
            color="purple"
          />
          <KPICard
            title="Agents de Terrain"
            value={stats.totalAgents}
            icon={UserCheckIcon}
            color="orange"
          />
        </div>

        {/* KPI Cards - Secondary Row - Agent Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Agents Actifs"
            value={stats.activeAgents}
            subtitle={`sur ${stats.totalAgents} agents`}
            icon={UserCheckIcon}
            color="green"
          />
          <KPICard
            title="Total Visites"
            value={stats.totalVisits}
            subtitle="visites effectuées"
            icon={MapIcon}
            color="blue"
          />
          <KPICard
            title="Visites/Agent"
            value={stats.avgVisitsPerAgent.toFixed(1)}
            subtitle="moyenne par agent"
            icon={BarChart3Icon}
            color="purple"
          />
          <KPICard
            title="Qualité Données"
            value={`${stats.dataQualityRate.toFixed(1)}%`}
            subtitle="taux de complétude"
            icon={WheatIcon}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EvolutionChart data={stats.evolutionData} />
          <CultureDistributionChart data={stats.cultureDistribution} />
        </div>

        {/* Map and Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MapPanel plotCount={stats.totalPlots} />
          <AlertsPanel alerts={stats.recentAlerts} />
        </div>

        {/* Action Buttons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rapports & Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleExportDashboard}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center"
            >
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
    </Layout>
  );
};

export default Dashboard;
