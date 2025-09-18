import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout/Layout';
import SearchBar from '../../components/Producers/SearchBar';
import FilterDropdown from '../../components/Producers/FilterDropdown';
import ProducersTable from '../../components/Producers/ProducersTable';
import Pagination from '../../components/Producers/Pagination';
import ProducerModal from '../../components/Producers/ProducerModal';
import ProducerDetailsModal from '../../components/Producers/ProducerDetailsModal';
import AgentAssignmentModal from '../../components/Producers/AgentAssignmentModal';
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
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<ProducerFilters>({
    search: '',
    region: '',
    culture: '',
    status: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  
  // Filter options
  const [regions, setRegions] = useState<string[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);
  const [cooperativesCount, setCooperativesCount] = useState<number>(0);
  const statusOptions = ['active', 'inactive'];

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
      showToast('Erreur lors du chargement des producteurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await ProducersService.getFilterOptions();
      setRegions(options.regions);
      setCultures(options.cultures);
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
      showToast('Erreur lors du chargement des détails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManageAgents = async (producer: Producer) => {
    console.log('Manage agents clicked for producer:', producer);
    console.log('Producer ID:', producer?.id);
    
    if (!producer || !producer.id) {
      console.error('Producer ID is undefined for manage agents:', producer);
      showToast('Erreur: ID du producteur manquant', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const fullProducer = await ProducersService.getProducerById(producer.id);
      setSelectedProducer(fullProducer);
      setIsAgentModalOpen(true);
    } catch (error) {
      console.error('Error loading producer details:', error);
      showToast('Erreur lors du chargement des détails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProducer = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    fetchProducers();
    showToast('Producteur sauvegardé avec succès', 'success');
  };

  const handleDeleteProducer = async (producer: Producer) => {
    console.log('Delete button clicked for producer:', producer);
    console.log('Producer type:', typeof producer);
    console.log('Producer keys:', Object.keys(producer || {}));
    console.log('Producer ID value:', producer?.id);
    
    // Validate producer ID
    if (!producer || !producer.id) {
      console.error('Producer ID is undefined:', producer);
      showToast('Erreur: ID du producteur manquant', 'error');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le producteur ${producer.first_name} ${producer.last_name} ?`)) {
      console.log('User confirmed deletion');
      try {
        setLoading(true);
        
        // Optimistic update: remove producer from list immediately
        setProducers(prevProducers => prevProducers.filter(p => p.id !== producer.id));
        setTotalItems(prevTotal => prevTotal - 1);
        
        console.log('Calling ProducersService.deleteProducer with ID:', producer.id);
        await ProducersService.deleteProducer(producer.id);
        console.log('Producer deleted successfully');
        
        // Refresh the list to ensure consistency
        await fetchProducers();
        showToast('Producteur supprimé avec succès', 'success');
      } catch (error) {
        console.error('Error deleting producer:', error);
        // Revert optimistic update on error
        await fetchProducers();
        showToast(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      console.log('User cancelled deletion');
    }
  };

  const handleRefresh = () => {
    fetchProducers();
    showToast('Données actualisées', 'success');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              Gestion des Producteurs
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez et supervisez vos producteurs membres
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
              onClick={handleAddProducer}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nouveau Producteur
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <p className="text-2xl font-bold text-gray-900">{cultures.length}</p>
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
                onChange={handleSearchChange}
                placeholder="Rechercher un producteur..."
              />
            </div>
            <div className="flex gap-2">
              <FilterDropdown
                label="Région"
                value={filters.region || 'all'}
                options={regions}
                onChange={(value) => handleFilterChange('region', value)}
                placeholder="Toutes les régions"
              />
              <FilterDropdown
                label="Culture"
                value={filters.culture || 'all'}
                options={cultures}
                onChange={(value) => handleFilterChange('culture', value)}
                placeholder="Toutes les cultures"
              />
              <FilterDropdown
                label="Statut"
                value={filters.status || 'all'}
                options={statusOptions}
                onChange={(value) => handleFilterChange('status', value)}
                placeholder="Tous les statuts"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
          <Pagination
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
        assignedAgents={selectedProducer?.assigned_agents || []}
        onAgentAssigned={() => {
          // Refresh the producer details
          if (selectedProducer) {
            handleViewProducer(selectedProducer);
          }
        }}
      />
    </Layout>
  );
};

export default Producers;