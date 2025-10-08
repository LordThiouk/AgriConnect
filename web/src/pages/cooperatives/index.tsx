import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout/Layout';
import SearchBar from '../../components/Cooperatives/SearchBar';
import FilterDropdown from '../../components/Cooperatives/FilterDropdown';
import AdvancedFilters from '../../components/Cooperatives/AdvancedFilters';
import CooperativesTable from '../../components/Cooperatives/CooperativesTable';
import StandardPagination from '../../components/ui/StandardPagination';
import CooperativeModal from '../../components/Cooperatives/CooperativeModal';
import CooperativeDetailsModal from '../../components/Cooperatives/CooperativeDetailsModal';
import CooperativeProducersModal from '../../components/Cooperatives/CooperativeProducersModal';
import DeleteConfirmationModal from '../../components/Cooperatives/DeleteConfirmationModal';
import CooperativesMap from '../../components/Cooperatives/CooperativesMap';
import { CooperativesService } from '../../services/cooperativesService';
import { Cooperative, CooperativeFilters } from '../../types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { MapPin, Building2, Users, BarChart3, Plus, RefreshCw } from 'lucide-react';

// Type assertions pour résoudre le conflit de types
const MapPinIcon = MapPin as any;
const Building2Icon = Building2 as any;

// Type assertions pour les composants Tabs
const TabsComponent = Tabs as any;
const TabsListComponent = TabsList as any;
const TabsTriggerComponent = TabsTrigger as any;
const TabsContentComponent = TabsContent as any;
const UsersIcon = Users as any;
const BarChart3Icon = BarChart3 as any;
const PlusIcon = Plus as any;
const RefreshCwIcon = RefreshCw as any;

const Cooperatives: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProducersModalOpen, setIsProducersModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);
  const [deletingCooperative, setDeletingCooperative] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<CooperativeFilters>({
    search: '',
    region: '',
    department: '',
    commune: '',
    hasGeo: '',
    minProducers: '',
    maxProducers: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalProducers, setTotalProducers] = useState(0);
  const itemsPerPage = 20;
  
  // Filter options
  const [regions, setRegions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  useEffect(() => {
    fetchCooperatives();
    fetchFilterOptions();
    fetchTotalProducers();
  }, [filters, currentPage]);

  // Re-fetch cooperatives when view mode changes to ensure map gets all data
  useEffect(() => {
    fetchCooperatives();
  }, [viewMode]);

  const fetchCooperatives = async () => {
    try {
      setLoading(true);
      setError(null);

      if (viewMode === 'map') {
        // For map view, fetch all cooperatives without pagination
        const allCooperatives = await CooperativesService.getAllCooperativesForMap(filters);
        setCooperatives(allCooperatives);
        setTotalPages(1);
        setTotalItems(allCooperatives.length);
      } else {
        // For table view, use pagination
        const result = await CooperativesService.getCooperatives(filters, currentPage, itemsPerPage);
        setCooperatives(result.data);
        setTotalPages(result.totalPages);
        setTotalItems(result.total);
      }
    } catch (err) {
      console.error('Error fetching cooperatives:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des coopératives');
      showToast({ type: 'error', title: 'Erreur lors du chargement des coopératives' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await CooperativesService.getFilterOptions();
      setRegions(options.regions);
      setDepartments(options.departments);
      setCommunes(options.communes);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchTotalProducers = async () => {
    try {
      const total = await CooperativesService.getTotalProducers();
      setTotalProducers(total);
    } catch (err) {
      console.error('Error fetching total producers:', err);
    }
  };

  const handleAddCooperative = () => {
    setSelectedCooperative(null);
    setIsAddModalOpen(true);
  };

  const handleEditCooperative = (cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
    setIsEditModalOpen(true);
  };

  const handleViewCooperative = (cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
    setIsDetailsModalOpen(true);
  };

  const handleViewProducers = (cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
    setIsProducersModalOpen(true);
  };

  const handleCooperativeSaved = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    fetchCooperatives();
    fetchFilterOptions(); // Rafraîchir les options de filtre
    fetchTotalProducers(); // Rafraîchir le total des producteurs
    showToast({ type: 'success', title: 'Coopérative sauvegardée avec succès' });
  };

  const handleDeleteCooperative = (cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCooperative) return;

    try {
      console.log('Attempting to delete cooperative:', selectedCooperative.id);
      console.log('Current user:', user);
      setDeletingCooperative(selectedCooperative.id);
      
      await CooperativesService.deleteCooperative(selectedCooperative.id);
      
      console.log('Cooperative deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedCooperative(null);
      fetchCooperatives();
      fetchFilterOptions(); // Rafraîchir les options de filtre
      fetchTotalProducers(); // Rafraîchir le total des producteurs
      showToast({ type: 'success', title: 'Coopérative supprimée avec succès' });
    } catch (error) {
      console.error('Error deleting cooperative:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      showToast({ type: 'error', title: 'Erreur lors de la suppression de la coopérative' });
    } finally {
      setDeletingCooperative(null);
    }
  };

  const handleCooperativeDeleted = (id?: string) => {
    fetchCooperatives();
    fetchFilterOptions(); // Rafraîchir les options de filtre
    fetchTotalProducers(); // Rafraîchir le total des producteurs
    showToast({ type: 'success', title: 'Coopérative supprimée avec succès' });
  };

  const handleRefresh = () => {
    fetchCooperatives();
    fetchFilterOptions(); // Rafraîchir les options de filtre
    fetchTotalProducers(); // Rafraîchir le total des producteurs
    showToast({ type: 'success', title: 'Données actualisées' });
  };

  const handleFilterChange = (newFilters: Partial<CooperativeFilters>) => {
    // Convertir "all" en undefined pour les filtres
    const cleanedFilters = Object.fromEntries(
      Object.entries(newFilters).map(([key, value]) => [
        key, 
        value === 'all' || value === '' ? undefined : value
      ])
    );
    setFilters(prev => ({ ...prev, ...cleanedFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Layout>
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  Gestion des Coopératives
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Gérez les coopératives agricoles et leurs informations
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                <Button
                  onClick={handleAddCooperative}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouvelle Coopérative</span>
                  <span className="sm:hidden">Nouvelle</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <Building2Icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Coopératives</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Producteurs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalProducers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <MapPinIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Régions</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{regions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <BarChart3Icon className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Départements</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{departments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <SearchBar
                    value={filters.search || ''}
                    onChange={(value) => handleFilterChange({ search: value })}
                    placeholder="Rechercher une coopérative..."
                  />
                </div>
                <div className="w-full">
                  <FilterDropdown
                    filters={filters}
                    onFiltersChange={setFilters}
                    regions={regions}
                    departments={departments}
                    communes={communes}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Filters */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setCurrentPage(1); // Reset to first page when filters change
            }}
            regions={regions}
            departments={departments}
            communes={communes}
          />

          {/* Main Content */}
          <TabsComponent value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'map')}>
            <TabsListComponent className="mb-4 w-full sm:w-auto">
              <TabsTriggerComponent value="table" className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none">
                <BarChart3Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Liste</span>
                <span className="sm:hidden">Liste</span>
              </TabsTriggerComponent>
              <TabsTriggerComponent value="map" className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none">
                <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Carte</span>
                <span className="sm:hidden">Carte</span>
              </TabsTriggerComponent>
            </TabsListComponent>

            <TabsContentComponent value="table">
              <Card>
                <CardContent className="p-0">
                  <CooperativesTable
                    cooperatives={cooperatives}
                    loading={loading}
                    error={error}
                    onEdit={handleEditCooperative}
                    onView={handleViewCooperative}
                    onViewProducers={handleViewProducers}
                    onDelete={handleDeleteCooperative}
                  />
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <div className="mt-4">
                  <StandardPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </TabsContentComponent>

            <TabsContentComponent value="map">
              <Card>
                <CardContent className="p-4">
                  <CooperativesMap
                    cooperatives={cooperatives}
                    loading={loading}
                    onCooperativeSelect={handleViewCooperative}
                    selectedCooperative={selectedCooperative}
                  />
                </CardContent>
              </Card>
            </TabsContentComponent>
          </TabsComponent>

          {/* Modals */}
          <CooperativeModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleCooperativeSaved}
            cooperative={null}
            regions={regions}
            departments={departments}
            communes={communes}
          />

          <CooperativeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleCooperativeSaved}
            cooperative={selectedCooperative}
            regions={regions}
            departments={departments}
            communes={communes}
          />

          <CooperativeDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            cooperative={selectedCooperative}
            onEdit={handleEditCooperative}
            onDelete={handleCooperativeDeleted}
          />

          <CooperativeProducersModal
            isOpen={isProducersModalOpen}
            onClose={() => setIsProducersModalOpen(false)}
            cooperative={selectedCooperative}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            cooperativeName={selectedCooperative?.name}
            loading={deletingCooperative !== null}
          />
    </Layout>
  );
};

export default Cooperatives;
