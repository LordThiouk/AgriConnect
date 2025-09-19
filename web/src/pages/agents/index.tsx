import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout/Layout';
import { Agent, AgentFilters, AgentStats } from '../../types';
import { AgentsService } from '../../services/agentsService';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import AgentModal from '../../components/Agents/AgentModal';
import AgentDetailsModal from '../../components/Agents/AgentDetailsModal';
import DeleteAgentModal from '../../components/Agents/DeleteAgentModal';
import AgentProducerAssignmentModal from '../../components/Agents/AgentProducerAssignmentModal';

// Type assertions pour résoudre le conflit de types
const UsersIcon = Users as any;
const PlusIcon = Plus as any;
const RefreshCwIcon = RefreshCw as any;
const SearchIcon = Search as any;
const FilterIcon = Filter as any;
const BarChart3Icon = BarChart3 as any;
const MapPinIcon = MapPin as any;
const PhoneIcon = Phone as any;
const MailIcon = Mail as any;
const CalendarIcon = Calendar as any;
const EyeIcon = Eye as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const UserCheckIcon = UserCheck as any;
const TrendingUpIcon = TrendingUp as any;
const ActivityIcon = Activity as any;

// Type assertions pour les composants Tabs
const TabsComponent = Tabs as any;
const TabsListComponent = TabsList as any;
const TabsTriggerComponent = TabsTrigger as any;
const TabsContentComponent = TabsContent as any;

const Agents: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  
  // Modal states
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<AgentFilters>({
    search: '',
    region: '',
    department: '',
    commune: '',
    cooperative_id: '',
    is_active: undefined
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  
  // Filter options
  const [regions, setRegions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);
  
  // Stats
  const [stats, setStats] = useState<AgentStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalProducers: 0,
    totalVisits: 0,
    avgVisitsPerAgent: 0,
    dataQualityRate: 0
  });

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'performance'>('table');

  // Modal states
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentDetailsModalOpen, setAgentDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    fetchAgents();
    fetchFilterOptions();
    fetchStats();
  }, [filters, currentPage]);

  // Charger les performances quand on passe à l'onglet performance
  useEffect(() => {
    if (viewMode === 'performance' && agents.length > 0) {
      fetchAllAgentsPerformance();
    }
  }, [viewMode, agents.length]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await AgentsService.getAgents(filters, currentPage, itemsPerPage);
      setAgents(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des agents');
      showToast({ type: 'error', title: 'Erreur lors du chargement des agents' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await AgentsService.getFilterOptions();
      setRegions(options.regions);
      setDepartments(options.departments);
      setCommunes(options.communes);
      setCooperatives(options.cooperatives);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await AgentsService.getAgentsStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAgentPerformance = async (agentId: string) => {
    try {
      const performance = await AgentsService.getAgentPerformance(agentId);
      return performance;
    } catch (err) {
      console.error(`Error fetching performance for agent ${agentId}:`, err);
      return {
        totalVisits: 0,
        totalProducers: 0,
        totalPlots: 0,
        avgVisitsPerMonth: 0,
        dataQualityRate: 0
      };
    }
  };

  const fetchAllAgentsPerformance = async () => {
    if (agents.length === 0) return;
    
    setPerformanceLoading(true);
    try {
      const performancePromises = agents.map(async (agent) => {
        const performance = await fetchAgentPerformance(agent.id);
        return {
          ...agent,
          totalVisits: performance.totalVisits,
          totalProducers: performance.totalProducers,
          totalPlots: performance.totalPlots,
          avgVisitsPerMonth: performance.avgVisitsPerMonth,
          dataQualityRate: performance.dataQualityRate,
          visitsThisMonth: performance.totalVisits // Approximation pour ce mois
        };
      });

      const agentsWithPerformance = await Promise.all(performancePromises);
      setAgents(agentsWithPerformance);
    } catch (err) {
      console.error('Error fetching all agents performance:', err);
      showToast({ type: 'error', title: 'Erreur lors du chargement des performances' });
    } finally {
      setPerformanceLoading(false);
    }
  };



  const handleApproveAgent = async (agentId: string) => {
    try {
      console.log('Approving agent with ID:', agentId);
      await AgentsService.updateAgentApproval(agentId, 'approved');
      showToast({ type: 'success', title: 'Agent approuvé avec succès' });
      fetchAgents();
    } catch (error) {
      showToast({ type: 'error', title: 'Erreur lors de l\'approbation de l\'agent' });
      console.error('Error approving agent:', error);
    }
  };

  const handleRejectAgent = async (agentId: string) => {
    try {
      await AgentsService.updateAgentApproval(agentId, 'rejected');
      showToast({ type: 'success', title: 'Agent rejeté avec succès' });
      fetchAgents();
    } catch (error) {
      showToast({ type: 'error', title: 'Erreur lors du rejet de l\'agent' });
      console.error('Error rejecting agent:', error);
    }
  };

  const handleDeleteAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteModalOpen(true);
  };

  const handleAgentSaved = () => {
    setAgentModalOpen(false);
    setAgentModalOpen(false);
    fetchAgents();
    fetchStats();
    showToast({ type: 'success', title: 'Agent sauvegardé avec succès' });
  };

  const handleConfirmDelete = async () => {
    if (!selectedAgent) return;

    try {
      setDeletingAgent(selectedAgent.id);
      await AgentsService.deleteAgent(selectedAgent.id);
      setDeleteModalOpen(false);
      setSelectedAgent(null);
      fetchAgents();
      fetchStats();
      showToast({ type: 'success', title: 'Agent supprimé avec succès' });
    } catch (err) {
      console.error('Error deleting agent:', err);
      showToast({ type: 'error', title: 'Erreur lors de la suppression de l\'agent' });
    } finally {
      setDeletingAgent(null);
    }
  };

  const handleFilterChange = (key: keyof AgentFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  // Modal handlers
  const handleCreateAgent = () => {
    setSelectedAgent(null);
    setModalMode('create');
    setAgentModalOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setModalMode('edit');
    setAgentModalOpen(true);
  };

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentDetailsModalOpen(true);
  };

  const handleDeleteAgentNew = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteModalOpen(true);
  };

  const handleAssignProducers = (agent: Agent) => {
    setSelectedAgent(agent);
    setAssignmentModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchAgents();
    fetchStats();
  };

  const handleModalClose = () => {
    setAgentModalOpen(false);
    setAgentDetailsModalOpen(false);
    setDeleteModalOpen(false);
    setAssignmentModalOpen(false);
    setSelectedAgent(null);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: '',
      department: '',
      commune: '',
      cooperative_id: '',
      is_active: undefined
    });
    setCurrentPage(1);
  };

  if (loading && agents.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Agents</h1>
            <p className="text-gray-600">Gérez les agents de terrain et leurs performances</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAgents} disabled={loading}>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={handleCreateAgent}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouvel Agent
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheckIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Agents Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3Icon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Producteurs Suivis</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ActivityIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Visites Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Rechercher un agent..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={filters.region || 'all'} onValueChange={(value) => handleFilterChange('region', value === 'all' ? undefined : value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.department || 'all'} onValueChange={(value) => handleFilterChange('department', value === 'all' ? undefined : value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Département" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.is_active === undefined ? 'all' : filters.is_active ? 'active' : 'inactive'} onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value === 'active')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.approval_status || 'all'} onValueChange={(value) => handleFilterChange('approval_status', value === 'all' ? undefined : value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Approbation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <TabsComponent value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'performance')}>
          <TabsListComponent>
            <TabsTriggerComponent value="table">Liste des Agents</TabsTriggerComponent>
            <TabsTriggerComponent value="performance">Performances</TabsTriggerComponent>
          </TabsListComponent>

          <TabsContentComponent value="table" className="space-y-4">
            {/* Agents Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Localisation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approbation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <UsersIcon className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {agent.display_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {agent.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{agent.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {agent.commune}, {agent.department}
                            </div>
                            <div className="text-sm text-gray-500">{agent.region}</div>
                            {agent.cooperative && (
                              <div className="text-xs text-blue-600">{agent.cooperative}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={agent.is_active ? "default" : "secondary"}>
                              {agent.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={
                                  agent.approval_status === 'approved' ? 'default' :
                                  agent.approval_status === 'rejected' ? 'destructive' : 'secondary'
                                }
                              >
                                {agent.approval_status === 'approved' ? 'Approuvé' :
                                 agent.approval_status === 'rejected' ? 'Rejeté' : 'En attente'}
                              </Badge>
                              {agent.approval_status === 'pending' && (
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApproveAgent(agent.id)}
                                    className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <UserCheckIcon className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRejectAgent(agent.id)}
                                    className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2Icon className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAgent(agent)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAgent(agent)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAssignProducers(agent)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Assigner des producteurs"
                              >
                                <UsersIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAgentNew(agent)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContentComponent>

          <TabsContentComponent value="performance" className="space-y-4">
            {/* Header avec bouton de rafraîchissement */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Performances des Agents</h3>
                <p className="text-sm text-gray-600">Métriques de performance et indicateurs de qualité</p>
              </div>
              <Button
                onClick={fetchAllAgentsPerformance}
                disabled={performanceLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${performanceLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            {/* KPI Cards Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Agents Actifs</p>
                      <p className="text-2xl font-bold text-green-600">{agents.filter(a => a.is_active).length}</p>
                    </div>
                    <UserCheckIcon className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Visites ce Mois</p>
                      <p className="text-2xl font-bold text-blue-600">{agents.reduce((sum, agent) => sum + (agent.visitsThisMonth || 0), 0)}</p>
                    </div>
                    <ActivityIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Moyenne Visites/Agent</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {agents.length > 0 ? (agents.reduce((sum, agent) => sum + (agent.totalVisits || 0), 0) / agents.length).toFixed(1) : '0.0'}
                      </p>
                    </div>
                    <BarChart3Icon className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux Qualité</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {agents.length > 0 ? (agents.reduce((sum, agent) => sum + (agent.dataQualityRate || 0), 0) / agents.length * 100).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                    <TrendingUpIcon className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tableau de Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Classement des Agents par Performance</CardTitle>
                <CardDescription>
                  Métriques de performance individuelles des agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCwIcon className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-600">Chargement des performances...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Agent</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Région</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Producteurs</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Visites</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Visites/Mois</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Qualité</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                      {agents
                        .sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0))
                        .map((agent, index) => (
                          <tr key={agent.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{agent.display_name}</p>
                                  <p className="text-sm text-gray-500">{agent.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{agent.region || 'N/A'}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{agent.totalProducers || 0}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{agent.totalVisits || 0}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{agent.avgVisitsPerMonth?.toFixed(1) || '0.0'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                (agent.dataQualityRate || 0) >= 0.8 
                                  ? 'bg-green-100 text-green-800' 
                                  : (agent.dataQualityRate || 0) >= 0.6 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {((agent.dataQualityRate || 0) * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                agent.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {agent.is_active ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Graphiques de Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Région</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCwIcon className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                      <span className="text-gray-600">Chargement...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                    {Object.entries(
                      agents.reduce((acc, agent) => {
                        const region = agent.region || 'Non définie';
                        if (!acc[region]) acc[region] = { total: 0, active: 0 };
                        acc[region].total++;
                        if (agent.is_active) acc[region].active++;
                        return acc;
                      }, {} as Record<string, { total: number; active: number }>)
                    ).map(([region, stats]) => (
                      <div key={region} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{region}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.max(0, (stats.active / stats.total) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {stats.active}/{stats.total}
                          </span>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Agents par Visites</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCwIcon className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                      <span className="text-gray-600">Chargement...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                    {agents
                      .sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0))
                      .slice(0, 5)
                      .map((agent, index) => (
                        <div key={agent.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{agent.display_name}</span>
                          </div>
                          <span className="text-sm text-gray-600">{agent.totalVisits || 0} visites</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContentComponent>
        </TabsComponent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} agents
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AgentModal
        isOpen={agentModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        agent={selectedAgent}
        mode={modalMode}
      />

      <AgentDetailsModal
        isOpen={agentDetailsModalOpen}
        onClose={handleModalClose}
        agent={selectedAgent}
        onEdit={() => {
          setAgentDetailsModalOpen(false);
          setModalMode('edit');
          setAgentModalOpen(true);
        }}
      />

      <DeleteAgentModal
        isOpen={deleteModalOpen}
        onClose={handleModalClose}
        onConfirm={async () => {
          if (selectedAgent) {
            try {
              await AgentsService.deleteAgent(selectedAgent.id);
              showToast({ type: 'success', title: 'Agent supprimé avec succès' });
              handleModalSuccess();
              handleModalClose();
            } catch (error) {
              showToast({ type: 'error', title: 'Erreur lors de la suppression' });
              console.error('Error deleting agent:', error);
            }
          }
        }}
        agentName={selectedAgent?.display_name || ''}
        loading={false}
      />

      <AgentProducerAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={handleModalClose}
        agent={selectedAgent}
        onSuccess={handleModalSuccess}
      />
    </Layout>
  );
};

export default Agents;
