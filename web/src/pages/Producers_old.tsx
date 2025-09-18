import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout/Layout';
import SearchBar from '../components/Producers/SearchBar';
import FilterDropdown from '../components/Producers/FilterDropdown';
import ProducersTable from '../components/Producers/ProducersTable';
import Pagination from '../components/Producers/Pagination';
import ProducerModal from '../components/Producers/ProducerModal';
import ProducerDetailsModal from '../components/Producers/ProducerDetailsModal';
import { ProducersService, Producer, ProducerFilters } from '../services/producersService';

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
  const itemsPerPage = 20; // Increased to 20 for better UX
  
  // Filter options
  const [regions, setRegions] = useState<string[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);
  const statusOptions = ['active', 'inactive'];

  useEffect(() => {
    fetchProducers();
    fetchFilterOptions();
  }, [filters, currentPage]);

  const fetchProducers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ProducersService.getProducers(filters, {
        page: currentPage,
        limit: itemsPerPage
      });

      setProducers(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err) {
      console.error('Error fetching producers:', err);
      setError('Erreur lors du chargement des producteurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [regionsData, culturesData] = await Promise.all([
        ProducersService.getRegions(),
        ProducersService.getCultures()
      ]);
      
      setRegions(regionsData);
      setCultures(culturesData);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType: keyof ProducerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAddProducer = () => {
    setSelectedProducer(null);
    setIsAddModalOpen(true);
  };

  const handleExportProducers = () => {
    console.log('Export producers clicked');
    // TODO: Implement export functionality
  };

  const handleViewProducer = (producer: Producer) => {
    setSelectedProducer(producer);
    setIsDetailsModalOpen(true);
  };

  const handleEditProducer = (producer: Producer) => {
    setSelectedProducer(producer);
    setIsEditModalOpen(true);
  };

  const handleDeleteProducer = (producer: Producer) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le producteur ${producer.first_name} ${producer.last_name} ?`)) {
      ProducersService.deleteProducer(producer.id)
        .then(() => {
          fetchProducers(); // Refresh the list
          setIsDetailsModalOpen(false);
          showToast({
            type: 'success',
            title: 'Producteur supprimé',
            message: `${producer.first_name} ${producer.last_name} a été supprimé avec succès.`
          });
        })
        .catch((error) => {
          console.error('Error deleting producer:', error);
          showToast({
            type: 'error',
            title: 'Erreur de suppression',
            message: 'Une erreur est survenue lors de la suppression du producteur.'
          });
        });
    }
  };

  const handleSaveProducer = async (producerData: Partial<Producer>) => {
    try {
      if (selectedProducer) {
        // Update existing producer
        await ProducersService.updateProducer(selectedProducer.id, producerData);
        setIsEditModalOpen(false);
        showToast({
          type: 'success',
          title: 'Producteur modifié',
          message: `${producerData.first_name} ${producerData.last_name} a été modifié avec succès.`
        });
      } else {
        // Create new producer
        await ProducersService.createProducer(producerData);
        setIsAddModalOpen(false);
        showToast({
          type: 'success',
          title: 'Producteur créé',
          message: `${producerData.first_name} ${producerData.last_name} a été créé avec succès.`
        });
      }
      fetchProducers(); // Refresh the list
    } catch (error) {
      console.error('Error saving producer:', error);
      showToast({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde du producteur.'
      });
    }
  };

  const handleDownloadProducer = (producer: Producer) => {
    console.log('Download producer:', producer);
    // TODO: Implement download producer functionality
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <Header
            userName={user?.user_metadata?.full_name || user?.email || 'Utilisateur'}
            userRole={user?.user_metadata?.role || 'user'}
            onMenuToggle={handleToggleSidebar}
            pageTitle="Gestion Producteurs"
            pageDescription="Gérez et supervisez vos producteurs membres"
            showAddButton={true}
            addButtonText="Ajouter producteur"
            onAddClick={handleAddProducer}
            showExportButton={true}
            onExportClick={handleExportProducers}
          />
        </div>
        
        {/* Scrollable Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={filters.search || ''}
                onChange={handleSearchChange}
                placeholder="Rechercher un producteur..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <FilterDropdown
                label="Régions"
                value={filters.region || ''}
                options={regions}
                onChange={(value) => handleFilterChange('region', value)}
                placeholder="Toutes les régions"
              />
              <FilterDropdown
                label="Cultures"
                value={filters.culture || ''}
                options={cultures}
                onChange={(value) => handleFilterChange('culture', value)}
                placeholder="Toutes les cultures"
              />
              <FilterDropdown
                label="Statuts"
                value={filters.status || ''}
                options={statusOptions}
                onChange={(value) => handleFilterChange('status', value)}
                placeholder="Tous les statuts"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Producers Table */}
        <ProducersTable
          producers={producers}
          loading={loading}
          onView={handleViewProducer}
          onEdit={handleEditProducer}
          onDownload={handleDownloadProducer}
        />

        {/* Pagination */}
        {!loading && producers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
          </div>
        </main>
      </div>

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
    </div>
  );
};

export default Producers;
