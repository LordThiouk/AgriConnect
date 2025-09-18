import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout/Layout';
import SearchBar from '../../components/Cooperatives/SearchBar';
import FilterDropdown from '../../components/Cooperatives/FilterDropdown';
import CooperativesTable from '../../components/Cooperatives/CooperativesTable';
import Pagination from '../../components/Cooperatives/Pagination';
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
    commune: ''
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
    showToast({ type: 'success', title: 'Coopérative supprimée avec succès' });
  };

  const handleRefresh = () => {
    fetchCooperatives();
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2Icon className="h-6 w-6" />
                  Gestion des Coopératives
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez les coopératives agricoles et leurs informations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Button
                  onClick={handleAddCooperative}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nouvelle Coopérative
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Building2Icon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Coopératives</p>
                    <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Producteurs</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProducers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <MapPinIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Régions</p>
                    <p className="text-2xl font-bold text-gray-900">{regions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BarChart3Icon className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Départements</p>
                    <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar
                    value={filters.search || ''}
                    onChange={(value) => handleFilterChange({ search: value })}
                    placeholder="Rechercher une coopérative..."
                  />
                </div>
                <FilterDropdown
                  filters={filters}
                  onFiltersChange={setFilters}
                  regions={regions}
                  departments={departments}
                  communes={communes}
                />
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'map')}>
            <TabsList className="mb-4">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4" />
                Liste
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                Carte
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table">
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
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="map">
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
            </TabsContent>
          </Tabs>

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
