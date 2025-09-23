import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';

// Type assertions pour résoudre les conflits de types
const PlusIcon = Plus as any;
const SearchIcon = Search as any;
const FilterIcon = Filter as any;
const MoreHorizontalIcon = MoreHorizontal as any;
const EyeIcon = Eye as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
// Removed Table import - using HTML table instead
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useToast } from '../../context/ToastContext';
import { Recommendation, RecommendationFilters } from '../../types';
import { AlertsService } from '../../services/alertsService';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import RecommendationModal from './RecommendationModal';
import RecommendationDetailsModal from './RecommendationDetailsModal';

interface RecommendationsTabProps {
  onRefresh?: () => void;
}

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ onRefresh }) => {
  const { showToast } = useToast();
  const [allRecommendations, setAllRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [displayedRecommendations, setDisplayedRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRecommendations, filters, searchTerm]);

  useEffect(() => {
    applyPagination();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filteredRecommendations]);

  useEffect(() => {
    applyPagination();
  }, [currentPage, filteredRecommendations]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Récupérer TOUTES les recommandations sans filtres
      const result = await AlertsService.getRecommendations({}, 1, 1000);
      setAllRecommendations(result.data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      showToast({ type: 'error', title: 'Erreur lors du chargement des recommandations' });
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres côté frontend
  const applyFilters = () => {
    let filtered = [...allRecommendations];

    // Filtre par priorité
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // Filtre par type
    if (filters.recommendation_type && filters.recommendation_type !== 'all') {
      filtered = filtered.filter(r => r.recommendation_type === filters.recommendation_type);
    }

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.message.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRecommendations(filtered);
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));
  };

  // Appliquer la pagination
  const applyPagination = () => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filteredRecommendations.slice(startIndex, endIndex);
    setDisplayedRecommendations(paginated);
  };

  const handleFilterChange = (key: keyof RecommendationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    // La recherche est gérée automatiquement par useEffect
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await AlertsService.updateRecommendationStatus(id, status);
      showToast({ type: 'success', title: 'Statut mis à jour avec succès' });
      loadRecommendations();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      showToast({ type: 'error', title: 'Erreur lors de la mise à jour du statut' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette recommandation ?')) {
      return;
    }

    try {
      await AlertsService.deleteRecommendation(id);
      showToast({ type: 'success', title: 'Recommandation supprimée avec succès' });
      loadRecommendations();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      showToast({ type: 'error', title: 'Erreur lors de la suppression' });
    }
  };

  // Fonctions pour gérer les modals
  const handleCreate = () => {
    setSelectedRecommendation(null);
    setShowCreateModal(true);
  };

  const handleEdit = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowEditModal(true);
  };

  const handleView = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetailsModal(true);
  };

  const handleModalSuccess = () => {
    loadRecommendations();
    if (onRefresh) onRefresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'fertilisation': 'Fertilisation',
      'irrigation': 'Irrigation',
      'pest_control': 'Lutte contre les ravageurs',
      'harvest': 'Récolte',
      'other': 'Autre'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recommandations</h2>
          <p className="text-sm text-gray-600">
            {totalItems} recommandation{totalItems > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Nouvelle recommandation
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="sm">
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <Select
                value={filters.recommendation_type || 'all'}
                onValueChange={(value) => handleFilterChange('recommendation_type', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="fertilisation">Fertilisation</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="pest_control">Lutte contre les ravageurs</SelectItem>
                  <SelectItem value="harvest">Récolte</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les priorités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="acknowledged">Reconnue</SelectItem>
                  <SelectItem value="completed">Complétée</SelectItem>
                  <SelectItem value="dismissed">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des recommandations */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedRecommendations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Aucune recommandation trouvée
                    </td>
                  </tr>
                ) : (
                  displayedRecommendations.map((recommendation) => (
                    <tr key={recommendation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">
                          {getTypeLabel(recommendation.recommendation_type)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {recommendation.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={recommendation.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={recommendation.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recommendation.producer?.first_name || 'N/A'} {recommendation.producer?.last_name || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(recommendation.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(recommendation)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(recommendation)}>
                              <EditIcon className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            {recommendation.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(recommendation.id, 'sent')}>
                                <EditIcon className="h-4 w-4 mr-2" />
                                Marquer comme envoyée
                              </DropdownMenuItem>
                            )}
                            {recommendation.status === 'sent' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(recommendation.id, 'completed')}>
                                <EditIcon className="h-4 w-4 mr-2" />
                                Marquer comme complétée
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(recommendation.id)}
                              className="text-red-600"
                            >
                              <Trash2Icon className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages} ({totalItems} recommandations)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecommendationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
        mode="create"
      />

      <RecommendationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
        recommendation={selectedRecommendation}
        mode="edit"
      />

      <RecommendationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        recommendation={selectedRecommendation}
      />
    </div>
  );
};

export default RecommendationsTab;
