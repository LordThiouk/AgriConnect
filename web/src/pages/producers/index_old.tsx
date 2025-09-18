import React, { useState, useEffect } from 'react';
import { producersService, authService } from '../../../../lib/services/api';
import { Database } from '../../../../lib/supabase/types/database';
import ProducerForm from '../../components/Producers/ProducerForm';

type Producer = Database['public']['Tables']['producers']['Row'];
type ProducerCreate = Omit<Producer, 'id' | 'created_at' | 'updated_at'>;

const ProducersPage: React.FC = () => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Check authentication on component mount
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setError('Veuillez vous connecter pour accéder à cette page');
      setLoading(false);
      return;
    }
    loadProducers();
  }, []);

  const loadProducers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await producersService.getAll({
        page,
        limit: pagination.limit
      });
      
      setProducers(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du chargement des producteurs');
      console.error('Error loading producers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProducer = async (data: Partial<Producer>) => {
    try {
      setFormLoading(true);
      // Ensure required fields are present for creation
      const createData: ProducerCreate = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        cooperative_id: data.cooperative_id || '',
        region: data.region || '',
        department: data.department || '',
        commune: data.commune || '',
        village: data.village || '',
        gender: data.gender || 'M',
        birth_date: data.birth_date || null,
        education_level: data.education_level || null,
        household_size: data.household_size || 1,
        farming_experience_years: data.farming_experience_years || 0,
        primary_language: data.primary_language || null,
        address: data.address || null,
        email: data.email || null,
        is_active: data.is_active ?? true,
        profile_id: data.profile_id || null
      };
      
      await producersService.create(createData);
      setShowForm(false);
      loadProducers(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la création du producteur');
      console.error('Error creating producer:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProducer = async (data: Partial<Producer>) => {
    if (!editingProducer) return;
    
    try {
      setFormLoading(true);
      await producersService.update(editingProducer.id, data);
      setEditingProducer(null);
      loadProducers(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la mise à jour du producteur');
      console.error('Error updating producer:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProducer = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce producteur ?')) return;
    
    try {
      await producersService.delete(id);
      loadProducers(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la suppression du producteur');
      console.error('Error deleting producer:', err);
    }
  };

  const handleEditProducer = (producer: Producer) => {
    setEditingProducer(producer);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProducer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des producteurs...</p>
        </div>
      </div>
    );
  }

  if (error && !producers.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
            <h3 className="text-lg font-medium mb-2">Erreur</h3>
            <p>{error}</p>
            {error.includes('connecter') && (
              <button
                onClick={() => window.location.href = '/login'}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Aller à la Connexion
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Gestion des Producteurs
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les producteurs agricoles et leurs informations
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setShowForm(true)}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Ajouter un Producteur
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingProducer ? 'Modifier le Producteur' : 'Ajouter un Nouveau Producteur'}
                </h3>
                <ProducerForm
                  producer={editingProducer || undefined}
                  onSubmit={editingProducer ? handleUpdateProducer : handleCreateProducer}
                  onCancel={handleCancelForm}
                  isLoading={formLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Producers List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {producers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Aucun producteur trouvé</h3>
              <p className="text-sm text-gray-500 mb-6">
                Commencez par ajouter votre premier producteur.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Ajouter un Producteur
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {producers.map((producer) => (
                <li key={producer.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-800">
                            {producer.first_name?.[0]}{producer.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {producer.first_name} {producer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {producer.phone} • {producer.village}, {producer.commune}
                        </div>
                        <div className="text-xs text-gray-400">
                          Coopérative: {producer.cooperative_id} • Région: {producer.region}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditProducer(producer)}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteProducer(producer.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => loadProducers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => loadProducers(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}à{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}sur{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => loadProducers(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => loadProducers(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => loadProducers(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducersPage;
