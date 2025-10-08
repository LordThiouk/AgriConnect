import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout/Layout';
import { Plot, PlotFilters, PlotStats } from '../../types';
import { PlotsService } from '../../services/plotsService';
import { 
  MapPin, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Activity,
  Droplets,
  Thermometer
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
import PlotModal from '../../components/Plots/PlotModal';
import PlotDetailsModal from '../../components/Plots/PlotDetailsModal';
import PlotsLeafletMap from '../../components/Plots/PlotsLeafletMap';

// Type assertions pour résoudre le conflit de types
const MapPinIcon = MapPin as any;
const PlusIcon = Plus as any;
const RefreshCwIcon = RefreshCw as any;
const SearchIcon = Search as any;
const FilterIcon = Filter as any;
const BarChart3Icon = BarChart3 as any;
const EyeIcon = Eye as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const TrendingUpIcon = TrendingUp as any;
const ActivityIcon = Activity as any;
const DropletsIcon = Droplets as any;
const ThermometerIcon = Thermometer as any;

// Type assertions pour les composants Tabs
const TabsComponent = Tabs as any;
const TabsListComponent = TabsList as any;
const TabsTriggerComponent = TabsTrigger as any;
const TabsContentComponent = TabsContent as any;

const Plots: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [plotModalOpen, setPlotModalOpen] = useState(false);
  const [plotDetailsModalOpen, setPlotDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deletingPlot, setDeletingPlot] = useState<string | null>(null);
  
  // Stats state
  const [stats, setStats] = useState<PlotStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<PlotFilters>({
    search: '',
    status: undefined,
    soil_type: '',
    water_source: '',
    region: '',
    cooperative_id: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  
  // Filter options
  const [soilTypes, setSoilTypes] = useState<string[]>([]);
  const [waterSources, setWaterSources] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [cooperatives, setCooperatives] = useState<{ id: string; name: string }[]>([]);
  

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  useEffect(() => {
    fetchPlots();
    fetchFilterOptions();
    fetchStats();
  }, [filters, currentPage]);

  const fetchPlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await PlotsService.getPlots(filters, { page: currentPage, limit: itemsPerPage });
      setPlots(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch (err) {
      console.error('Error fetching plots:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des parcelles');
      showToast({ type: 'error', title: 'Erreur lors du chargement des parcelles' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await PlotsService.getFilterOptions();
      setSoilTypes(options.soilTypes);
      setWaterSources(options.waterSources);
      setRegions(options.regions);
      setCooperatives(options.cooperatives);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await PlotsService.getPlotsStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };


  const handleCreatePlot = () => {
    setSelectedPlot(null);
    setModalMode('create');
    setPlotModalOpen(true);
  };

  const handleEditPlot = (plot: Plot) => {
    setSelectedPlot(plot);
    setModalMode('edit');
    setPlotModalOpen(true);
  };

  const handleViewPlot = (plot: Plot) => {
    setSelectedPlot(plot);
    setPlotDetailsModalOpen(true);
  };

  const handleDeletePlot = (plot: Plot) => {
    setSelectedPlot(plot);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlot) return;

    try {
      setDeletingPlot(selectedPlot.id);
      await PlotsService.deletePlot(selectedPlot.id);
      setDeleteModalOpen(false);
      setSelectedPlot(null);
      fetchPlots();
      showToast({ type: 'success', title: 'Parcelle supprimée avec succès' });
    } catch (err) {
      console.error('Error deleting plot:', err);
      showToast({ type: 'error', title: 'Erreur lors de la suppression de la parcelle' });
    } finally {
      setDeletingPlot(null);
    }
  };

  const handleModalSuccess = () => {
    fetchPlots();
  };

  const handleModalClose = () => {
    setPlotModalOpen(false);
    setPlotDetailsModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedPlot(null);
  };

  const handleFilterChange = (key: keyof PlotFilters, value: string | undefined) => {
    // Convert "all" to undefined to clear the filter
    const filterValue = value === "all" ? undefined : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: undefined,
      soil_type: '',
      water_source: '',
      region: '',
      cooperative_id: ''
    });
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSoilTypeLabel = (soilType: string) => {
    const labels: Record<string, string> = {
      sandy: 'Sableux',
      clay: 'Argileux',
      loam: 'Limon',
      silt: 'Limoneux',
      organic: 'Organique',
      other: 'Autre'
    };
    return labels[soilType] || soilType;
  };

  const getWaterSourceLabel = (waterSource: string) => {
    const labels: Record<string, string> = {
      rain: 'Pluie',
      irrigation: 'Irrigation',
      well: 'Puits',
      river: 'Rivière',
      other: 'Autre'
    };
    return labels[waterSource] || waterSource;
  };

  if (loading && plots.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Chargement des parcelles...</p>
          </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Parcelles</h1>
            <p className="text-gray-600">Gérez les parcelles agricoles et leurs cultures</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchPlots} disabled={loading}>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={handleCreatePlot}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouvelle Parcelle
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Parcelles</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPlots}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <MapPinIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Parcelles Actives</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activePlots}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <ActivityIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Superficie Totale</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalArea} ha</p>
                  </div>
                  <div className="flex-shrink-0">
                    <TrendingUpIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Superficie Moyenne</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageArea} ha</p>
                  </div>
                  <div className="flex-shrink-0">
                    <BarChart3Icon className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilterIcon className="h-5 w-5 mr-2" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Recherche</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nom de la parcelle..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="abandoned">Abandonné</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="soil_type">Type de sol</Label>
                <Select
                  value={filters.soil_type || 'all'}
                  onValueChange={(value) => handleFilterChange('soil_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {soilTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getSoilTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="water_source">Source d'eau</Label>
                <Select
                  value={filters.water_source || 'all'}
                  onValueChange={(value) => handleFilterChange('water_source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sources</SelectItem>
                    {waterSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {getWaterSourceLabel(source)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <TabsComponent value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'map')}>
          <TabsListComponent>
            <TabsTriggerComponent value="table">Liste des Parcelles</TabsTriggerComponent>
            <TabsTriggerComponent value="map">Carte</TabsTriggerComponent>
          </TabsListComponent>

          <TabsContentComponent value="table" className="space-y-4">
            {/* Plots Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parcelle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producteur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Surface
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type de sol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source d'eau
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plots.map((plot) => (
                        <tr key={plot.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <MapPinIcon className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {plot.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {plot.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {plot.producer?.first_name} {plot.producer?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {plot.producer?.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {plot.area_hectares ? `${plot.area_hectares} ha` : 'Non définie'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {plot.soil_type ? getSoilTypeLabel(plot.soil_type) : 'Non défini'}
                            </div>
                            {plot.soil_ph && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <ThermometerIcon className="h-3 w-3 mr-1" />
                                pH: {plot.soil_ph}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <DropletsIcon className="h-3 w-3 mr-1" />
                              {plot.water_source ? getWaterSourceLabel(plot.water_source) : 'Non définie'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(plot.status)}>
                              {plot.status === 'active' ? 'Actif' : 
                               plot.status === 'inactive' ? 'Inactif' : 'Abandonné'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPlot(plot)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPlot(plot)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePlot(plot)}
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

          <TabsContentComponent value="map" className="space-y-4">
            <PlotsLeafletMap 
              plots={plots} 
              loading={loading}
              onPlotSelect={handleViewPlot}
              selectedPlot={selectedPlot}
            />
          </TabsContentComponent>

        </TabsComponent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} parcelles
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

        {/* Empty state */}
        {plots.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune parcelle trouvée</h3>
              <p className="text-gray-600 mb-4">
                {Object.values(filters).some(f => f) 
                  ? 'Aucune parcelle ne correspond aux filtres appliqués.'
                  : 'Commencez par créer votre première parcelle.'
                }
              </p>
              <Button onClick={handleCreatePlot}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Créer une parcelle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <PlotModal
        isOpen={plotModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        plot={selectedPlot}
        mode={modalMode}
      />

      <PlotDetailsModal
        isOpen={plotDetailsModalOpen}
        onClose={handleModalClose}
        plot={selectedPlot}
        onEdit={handleEditPlot}
        onDelete={handleDeletePlot}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la parcelle "{selectedPlot?.name}" ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deletingPlot === selectedPlot?.id}
            >
              {deletingPlot === selectedPlot?.id ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Plots;
