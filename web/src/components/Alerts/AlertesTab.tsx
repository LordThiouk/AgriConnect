import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Eye, Filter, Search, Plus, Edit, Trash2, MoreHorizontal, Calendar, User, MapPin } from 'lucide-react';

// Type assertions pour résoudre les conflits de types
const AlertTriangleIcon = AlertTriangle as any;
const ClockIcon = Clock as any;
const CheckCircleIcon = CheckCircle as any;
const XCircleIcon = XCircle as any;
const EyeIcon = Eye as any;
const FilterIcon = Filter as any;
const SearchIcon = Search as any;
const PlusIcon = Plus as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const MoreHorizontalIcon = MoreHorizontal as any;
const CalendarIcon = Calendar as any;
const UserIcon = User as any;
const MapPinIcon = MapPin as any;

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertsService } from '../../services/alertsService';
import { Recommendation, RecommendationFilters } from '../../types';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { useToast } from '../../context/ToastContext';
import RecommendationModal from './RecommendationModal';
import RecommendationDetailsModal from './RecommendationDetailsModal';

interface AlertesTabProps {
  onRefresh: () => void;
}

export const AlertesTab: React.FC<AlertesTabProps> = ({ onRefresh }) => {
  const { showToast } = useToast();
  
  // États principaux
  const [allAlerts, setAllAlerts] = useState<Recommendation[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres avancés
  const [filters, setFilters] = useState<RecommendationFilters>({
    priority: undefined,
    status: 'pending',
    recommendation_type: undefined,
    search: ''
  });
  
  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Recommendation | null>(null);
  
  // États pour la sélection multiple
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger toutes les alertes sans filtres serveur (on applique tout localement)
      const response = await AlertsService.getRecommendations({}, 1, 100);
      setAllAlerts(response.data);
      
      // Appliquer tous les filtres localement
      applyLocalFilters(response.data);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Erreur lors du chargement des alertes');
      showToast({ type: 'error', title: 'Erreur lors du chargement des alertes' });
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilters = (alerts: Recommendation[]) => {
    let filtered = [...alerts];
    console.log('🔍 Applying filters:', filters);
    console.log('📊 Total alerts before filtering:', alerts.length);

    // Filtre par priorité
    if (filters.priority) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(alert => alert.priority === filters.priority);
      console.log(`🎯 Filter by priority "${filters.priority}": ${beforeCount} → ${filtered.length}`);
    }

    // Filtre par statut
    if (filters.status) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(alert => alert.status === filters.status);
      console.log(`📋 Filter by status "${filters.status}": ${beforeCount} → ${filtered.length}`);
    }

    // Filtre par type de recommandation
    if (filters.recommendation_type) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(alert => alert.recommendation_type === filters.recommendation_type);
      console.log(`🏷️ Filter by type "${filters.recommendation_type}": ${beforeCount} → ${filtered.length}`);
    }

    // Filtre de recherche
    if (filters.search) {
      const beforeCount = filtered.length;
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title?.toLowerCase().includes(searchTerm) ||
        alert.message?.toLowerCase().includes(searchTerm) ||
        alert.producer?.first_name?.toLowerCase().includes(searchTerm) ||
        alert.producer?.last_name?.toLowerCase().includes(searchTerm) ||
        alert.plot?.name?.toLowerCase().includes(searchTerm)
      );
      console.log(`🔎 Filter by search "${filters.search}": ${beforeCount} → ${filtered.length}`);
    }

    console.log('✅ Final filtered alerts:', filtered.length);
    setFilteredAlerts(filtered);
  };

  useEffect(() => {
    loadAlerts();
  }, []); // Charger une seule fois au montage

  useEffect(() => {
    applyLocalFilters(allAlerts);
  }, [filters, allAlerts]); // Appliquer les filtres quand les filtres ou les données changent

  // Handlers pour les opérations CRUD
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await AlertsService.updateRecommendationStatus(alertId, 'acknowledged');
      await loadAlerts();
      onRefresh();
      showToast({ type: 'success', title: 'Alerte reconnue avec succès' });
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      showToast({ type: 'error', title: 'Erreur lors de la reconnaissance de l\'alerte' });
    }
  };

  const handleCompleteAlert = async (alertId: string) => {
    try {
      await AlertsService.updateRecommendationStatus(alertId, 'completed');
      await loadAlerts();
      onRefresh();
      showToast({ type: 'success', title: 'Alerte finalisée avec succès' });
    } catch (err) {
      console.error('Error completing alert:', err);
      showToast({ type: 'error', title: 'Erreur lors de la finalisation de l\'alerte' });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await AlertsService.deleteRecommendation(alertId);
      await loadAlerts();
      onRefresh();
      showToast({ type: 'success', title: 'Alerte supprimée avec succès' });
    } catch (err) {
      console.error('Error deleting alert:', err);
      showToast({ type: 'error', title: 'Erreur lors de la suppression de l\'alerte' });
    }
  };

  const handleBulkAcknowledge = async () => {
    try {
      for (const alertId of selectedAlerts) {
        await AlertsService.updateRecommendationStatus(alertId, 'acknowledged');
      }
      setSelectedAlerts([]);
      await loadAlerts();
      onRefresh();
      showToast({ type: 'success', title: `${selectedAlerts.length} alertes reconnues` });
    } catch (err) {
      console.error('Error bulk acknowledging alerts:', err);
      showToast({ type: 'error', title: 'Erreur lors de la reconnaissance en lot' });
    }
  };

  const handleBulkComplete = async () => {
    try {
      for (const alertId of selectedAlerts) {
        await AlertsService.updateRecommendationStatus(alertId, 'completed');
      }
      setSelectedAlerts([]);
      await loadAlerts();
      onRefresh();
      showToast({ type: 'success', title: `${selectedAlerts.length} alertes finalisées` });
    } catch (err) {
      console.error('Error bulk completing alerts:', err);
      showToast({ type: 'error', title: 'Erreur lors de la finalisation en lot' });
    }
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id));
    }
  };

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleCreateAlert = () => {
    setSelectedAlert(null);
    setShowCreateModal(true);
  };

  const handleEditAlert = (alert: Recommendation) => {
    setSelectedAlert(alert);
    setShowEditModal(true);
  };

  const handleViewDetails = (alert: Recommendation) => {
    setSelectedAlert(alert);
    setShowDetailsModal(true);
  };

  // Fonctions utilitaires
  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'high':
        return <ClockIcon className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertStats = () => {
    const critical = filteredAlerts.filter(a => a.priority === 'urgent').length;
    const high = filteredAlerts.filter(a => a.priority === 'high').length;
    const pending = filteredAlerts.filter(a => a.status === 'pending').length;
    const total = filteredAlerts.length;
    
    return { critical, high, pending, total };
  };

  const getRecommendationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'fertilisation': 'Fertilisation',
      'irrigation': 'Irrigation',
      'pest_control': 'Lutte ravageurs',
      'harvest': 'Récolte',
      'other': 'Autre'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  const stats = getAlertStats();

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alertes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Importantes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'actions et filtres */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Recherche */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans les alertes..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-64"
            />
          </div>

          {/* Filtres rapides */}
          <div className="flex gap-2">
            <Select value={filters.priority || 'all'} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, priority: value === 'all' ? undefined : value as any }))
            }>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as any }))
            }>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="sent">Envoyées</SelectItem>
                <SelectItem value="acknowledged">Reconnues</SelectItem>
                <SelectItem value="completed">Finalisées</SelectItem>
                <SelectItem value="dismissed">Rejetées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.recommendation_type || 'all'} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, recommendation_type: value === 'all' ? undefined : value as any }))
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="fertilisation">Fertilisation</SelectItem>
                <SelectItem value="irrigation">Irrigation</SelectItem>
                <SelectItem value="pest_control">Lutte ravageurs</SelectItem>
                <SelectItem value="harvest">Récolte</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {selectedAlerts.length > 0 && (
            <div className="flex gap-2 mr-4">
              <Button size="sm" variant="outline" onClick={handleBulkAcknowledge}>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Reconnaître ({selectedAlerts.length})
              </Button>
              <Button size="sm" onClick={handleBulkComplete}>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Finaliser ({selectedAlerts.length})
              </Button>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilters({
              priority: undefined,
              status: 'pending',
              recommendation_type: undefined,
              search: ''
            })}
            className="mr-2"
          >
            Réinitialiser
          </Button>
          
          <Button onClick={handleCreateAlert} className="bg-green-600 hover:bg-green-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle Alerte
          </Button>
          
          <Button variant="outline" onClick={loadAlerts}>
            <FilterIcon className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Indicateur des filtres actifs */}
      {(filters.priority || filters.recommendation_type || (filters.status && filters.status !== 'pending') || filters.search) && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800 font-medium">Filtres actifs :</span>
          
          {filters.search && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Recherche: "{filters.search}"
              <button 
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </Badge>
          )}
          
          {filters.priority && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Priorité: {filters.priority === 'urgent' ? 'Urgent' : 
                        filters.priority === 'high' ? 'Élevée' :
                        filters.priority === 'medium' ? 'Moyenne' : 'Faible'}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, priority: undefined }))}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </Badge>
          )}
          
          {filters.recommendation_type && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Type: {getRecommendationTypeLabel(filters.recommendation_type)}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, recommendation_type: undefined }))}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </Badge>
          )}
          
          {filters.status && filters.status !== 'pending' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Statut: {filters.status === 'sent' ? 'Envoyées' :
                      filters.status === 'acknowledged' ? 'Reconnues' :
                      filters.status === 'completed' ? 'Finalisées' :
                      filters.status === 'dismissed' ? 'Rejetées' : filters.status}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: 'pending' }))}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilters({
              priority: undefined,
              status: 'pending',
              recommendation_type: undefined,
              search: ''
            })}
            className="text-blue-600 hover:text-blue-800"
          >
            Effacer tout
          </Button>
        </div>
      )}

      {/* Liste des alertes */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte trouvée</h3>
            <p className="text-gray-500">
              Aucune alerte ne correspond aux critères de recherche actuels.
            </p>
            <Button onClick={handleCreateAlert} className="mt-4">
              <PlusIcon className="h-4 w-4 mr-2" />
              Créer une nouvelle alerte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* En-tête avec sélection */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">
              {selectedAlerts.length > 0 
                ? `${selectedAlerts.length} sur ${filteredAlerts.length} sélectionnées`
                : `${filteredAlerts.length} alertes trouvées`
              }
            </span>
          </div>

          {/* Liste des alertes */}
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.priority === 'urgent' ? 'border-l-red-500' : 
              alert.priority === 'high' ? 'border-l-orange-500' : 
              'border-l-yellow-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedAlerts.includes(alert.id)}
                    onCheckedChange={() => handleSelectAlert(alert.id)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getAlertIcon(alert.priority)}
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <PriorityBadge priority={alert.priority} />
                      <StatusBadge status={alert.status} />
                    </div>
                    
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        <strong>Producteur:</strong> {alert.producer?.first_name} {alert.producer?.last_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        <strong>Parcelle:</strong> {alert.plot?.name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <strong>Type:</strong> {getRecommendationTypeLabel(alert.recommendation_type)}
                      </span>
                      <span>
                        <strong>Créée:</strong> {new Date(alert.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(alert)}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAlert(alert)}>
                          <EditIcon className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        {alert.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleAcknowledgeAlert(alert.id)}>
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Reconnaître
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCompleteAlert(alert.id)}>
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Finaliser
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-600"
                        >
                          <Trash2Icon className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <RecommendationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAlerts();
            onRefresh();
          }}
          mode="create"
        />
      )}

      {showEditModal && selectedAlert && (
        <RecommendationModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          recommendation={selectedAlert}
          onSuccess={() => {
            setShowEditModal(false);
            loadAlerts();
            onRefresh();
          }}
          mode="edit"
        />
      )}

      {showDetailsModal && selectedAlert && (
        <RecommendationDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          recommendation={selectedAlert}
        />
      )}
    </div>
  );
};
