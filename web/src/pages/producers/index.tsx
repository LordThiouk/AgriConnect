import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout/Layout';
import SearchBar from '../../components/Producers/SearchBar';
import FilterDropdown from '../../components/Producers/FilterDropdown';
import AdvancedFilters from '../../components/Producers/AdvancedFilters';
import ProducersTable from '../../components/Producers/ProducersTable';
import StandardPagination from '../../components/ui/StandardPagination';
import ProducerModal from '../../components/Producers/ProducerModal';
import ProducerDetailsModal from '../../components/Producers/ProducerDetailsModal';
import AgentAssignmentModal from '../../components/Producers/AgentAssignmentModal';
import DeleteConfirmationModal from '../../components/Producers/DeleteConfirmationModal';
import { ProducersService, Producer, ProducerFilters } from '../../services/producersService';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, RefreshCw, Users, BarChart3, MapPin, Building2 } from 'lucide-react';

// Type assertions pour résoudre le conflit de types
const PlusIcon = Plus as any;
const RefreshCwIcon = RefreshCw as any;
const UsersIcon = Users as any;
const BarChart3Icon = BarChart3 as any;
const MapPinIcon = MapPin as any;
const Building2Icon = Building2 as any;

const Producers: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<ProducerFilters>({
    search: '',
    region: ''
    // status: 'active' as 'active' | 'inactive' // Utilise is_active directement
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  
  // Filter options
  const [regions, setRegions] = useState<string[]>([]);
  const [cooperatives, setCooperatives] = useState<Array<{id: string, name: string}>>([]);
  const [cooperativesCount, setCooperativesCount] = useState<number>(0);
  // const statusOptions = ['active', 'inactive']; // Utilise is_active directement

  useEffect(() => {
    fetchProducers();
    fetchFilterOptions();
    fetchCooperativesCount();
  }, [filters, currentPage]);

  const fetchProducers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ProducersService.getProducers(filters, { page: currentPage, limit: itemsPerPage });
      setProducers(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch (err) {
      console.error('Error fetching producers:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des producteurs');
      showToast({
        type: 'error',
        title: 'Erreur lors du chargement des producteurs'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await ProducersService.getFilterOptions();
      setRegions(options.regions);
      
      // Récupérer les coopératives pour les filtres
      const { CooperativesService } = await import('../../services/cooperativesService');
      const cooperativesResult = await CooperativesService.getCooperatives({}, 1, 1000);
      const cooperativesData = cooperativesResult.data.map(c => ({ id: c.id, name: c.name }));
      setCooperatives(cooperativesData);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchCooperativesCount = async () => {
    try {
      // Import CooperativesService dynamically to avoid circular dependency
      const { CooperativesService } = await import('../../services/cooperativesService');
      const result = await CooperativesService.getCooperatives({}, 1, 1);
      setCooperativesCount(result.total);
    } catch (err) {
      console.error('Error fetching cooperatives count:', err);
      setCooperativesCount(0);
    }
  };

  const handleAddProducer = () => {
    setSelectedProducer(null);
    setIsAddModalOpen(true);
  };

  const handleEditProducer = (producer: Producer) => {
    setSelectedProducer(producer);
    setIsEditModalOpen(true);
  };

  const handleViewProducer = async (producer: Producer) => {
    try {
      setLoading(true);
      const fullProducer = await ProducersService.getProducerById(producer.id);
      setSelectedProducer(fullProducer);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error loading producer details:', error);
      showToast({
        type: 'error',
        title: 'Erreur lors du chargement des détails'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageAgents = (producer: Producer) => {
    setSelectedProducer(producer);
    setIsAgentModalOpen(true);
  };

  const handleAgentAssigned = () => {
    setIsAgentModalOpen(false);
    fetchProducers();
    showToast({
      type: 'success',
      title: 'Agent assigné avec succès'
    });
  };

  const handleSaveProducer = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    fetchProducers();
    fetchFilterOptions(); // Rafraîchir les options de filtre
    showToast({
      type: 'success',
      title: 'Producteur sauvegardé avec succès'
    });
  };

  const handleDeleteProducer = (producer: Producer) => {
    setSelectedProducer(producer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProducer = async () => {
    if (!selectedProducer) return;

    setDeleteLoading(true);
    try {
      await ProducersService.deleteProducer(selectedProducer.id);
      fetchProducers();
      fetchFilterOptions(); // Rafraîchir les options de filtre
      setIsDeleteModalOpen(false);
      setSelectedProducer(null);
      showToast({
        type: 'success',
        title: 'Producteur supprimé avec succès'
      });
    } catch (error) {
      console.error('Error deleting producer:', error);
      showToast({
        type: 'error',
        title: 'Erreur lors de la suppression du producteur'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchProducers();
    fetchFilterOptions(); // Rafraîchir les options de filtre
    showToast({
      type: 'success',
      title: 'Données actualisées'
    });
  };

  const handleFilterChange = (field: keyof ProducerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value === 'all' || value === '' ? undefined : value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
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
              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              Gestion des Producteurs
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Gérez et supervisez vos producteurs membres
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              onClick={handleAddProducer}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau Producteur</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Producteurs</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building2Icon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Coopératives</p>
                <p className="text-2xl font-bold text-gray-900">{cooperativesCount}</p>
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
                <p className="text-sm font-medium text-gray-600">Cultures</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <SearchBar
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Rechercher un producteur..."
          />
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
        cooperatives={cooperatives}
      />

      {/* Producers Table */}
      <Card>
        <CardContent className="p-0">
          <ProducersTable
            producers={producers}
            loading={loading}
            onView={handleViewProducer}
            onEdit={handleEditProducer}
            onDownload={() => {}}
            onDelete={handleDeleteProducer}
            onManageAgents={handleManageAgents}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
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

      {/* Modals */}
      <ProducerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveProducer}
        producer={null}
        title="Ajouter un producteur"
      />

      <ProducerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProducer}
        producer={selectedProducer}
        title="Modifier le producteur"
      />

      <ProducerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        producer={selectedProducer}
        onEdit={handleEditProducer}
        onDelete={handleDeleteProducer}
      />

      <AgentAssignmentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        producerId={selectedProducer?.id || ''}
        producerName={selectedProducer ? `${selectedProducer.first_name} ${selectedProducer.last_name}` : ''}
        onAgentAssigned={handleAgentAssigned}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProducer(null);
        }}
        onConfirm={confirmDeleteProducer}
        producerName={selectedProducer ? `${selectedProducer.first_name} ${selectedProducer.last_name}` : undefined}
        loading={deleteLoading}
      />
    </Layout>
  );
};

export default Producers;