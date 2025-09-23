import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Play, Pause, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertsService } from '@/services/alertsService';
import { AgriRule, AgriRuleFilters } from '@/types';
import SeverityBadge from './SeverityBadge';
import AgriRuleModal from './AgriRuleModal';
import AgriRuleDetailsModal from './AgriRuleDetailsModal';

// Type assertions pour résoudre les conflits de types
const PlusIcon = Plus as any;
const SearchIcon = Search as any;
const FilterIcon = Filter as any;
const MoreHorizontalIcon = MoreHorizontal as any;
const PlayIcon = Play as any;
const PauseIcon = Pause as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const EyeIcon = Eye as any;

interface AgriRulesTabProps {
  onRefresh: () => void;
}

export const AgriRulesTab: React.FC<AgriRulesTabProps> = ({ onRefresh }) => {
  const [allRules, setAllRules] = useState<AgriRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<AgriRule[]>([]);
  const [displayedRules, setDisplayedRules] = useState<AgriRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AgriRuleFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AgriRule | null>(null);

  const pageSize = 10;

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer TOUTES les règles sans filtres
      const response = await AlertsService.getAgriRules({}, 1, 1000);
      setAllRules(response.data);
    } catch (err) {
      console.error('Error loading agri rules:', err);
      setError('Erreur lors du chargement des règles');
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres côté frontend
  const applyFilters = () => {
    let filtered = [...allRules];

    // Filtre par sévérité
    if (filters.severity && filters.severity !== 'all') {
      filtered = filtered.filter(r => r.severity === filters.severity);
    }

    // Filtre par type d'action
    if (filters.action_type && filters.action_type !== 'all') {
      filtered = filtered.filter(r => r.action_type === filters.action_type);
    }

    // Filtre par statut actif
    if (filters.is_active !== undefined && filters.is_active !== null) {
      filtered = filtered.filter(r => r.is_active === filters.is_active);
    }

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.action_message.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRules(filtered);
    setTotalCount(filtered.length);
    setTotalPages(Math.ceil(filtered.length / pageSize));
  };

  // Appliquer la pagination
  const applyPagination = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredRules.slice(startIndex, endIndex);
    setDisplayedRules(paginated);
  };

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRules, filters, searchTerm]);

  useEffect(() => {
    applyPagination();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filteredRules]);

  useEffect(() => {
    applyPagination();
  }, [currentPage, filteredRules]);

  const handleFilterChange = (key: keyof AgriRuleFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setCurrentPage(1);
  };

  const handleToggleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      await AlertsService.toggleAgriRuleStatus(ruleId, !isActive);
      await loadRules();
      onRefresh();
    } catch (err) {
      console.error('Error toggling rule status:', err);
      setError('Erreur lors de la modification du statut');
    }
  };

  const handleTestRule = async (ruleId: string) => {
    try {
      const result = await AlertsService.testAgriRule(ruleId);
      if (result.success) {
        alert(`Règle testée avec succès: ${result.message}`);
      } else {
        alert(`Erreur lors du test: ${result.message}`);
      }
    } catch (err) {
      console.error('Error testing rule:', err);
      alert('Erreur lors du test de la règle');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      try {
        await AlertsService.deleteAgriRule(ruleId);
        await loadRules();
        onRefresh();
      } catch (err) {
        console.error('Error deleting rule:', err);
        setError('Erreur lors de la suppression');
      }
    }
  };

  // Fonctions pour gérer les modals
  const handleCreate = () => {
    setSelectedRule(null);
    setShowCreateModal(true);
  };

  const handleEdit = (rule: AgriRule) => {
    setSelectedRule(rule);
    setShowEditModal(true);
  };

  const handleView = (rule: AgriRule) => {
    setSelectedRule(rule);
    setShowDetailsModal(true);
  };

  const handleModalSuccess = () => {
    loadRules();
    if (onRefresh) onRefresh();
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getActionTypeBadge = (actionType: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'notification': 'default',
      'recommendation': 'secondary',
      'alert': 'destructive',
      'email': 'outline'
    };
    
    const labels: Record<string, string> = {
      'notification': 'Notification',
      'recommendation': 'Recommandation',
      'alert': 'Alerte',
      'email': 'Email'
    };

    return (
      <Badge variant={variants[actionType] || 'outline'}>
        {labels[actionType] || actionType}
      </Badge>
    );
  };

  if (loading && allRules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des règles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une règle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select onValueChange={(value) => handleFilterChange('severity', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sévérité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sévérités</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Attention</SelectItem>
            <SelectItem value="error">Erreur</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleFilterChange('action_type', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type d'action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
            <SelectItem value="recommendation">Recommandation</SelectItem>
            <SelectItem value="alert">Alerte</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="true">Actives</SelectItem>
            <SelectItem value="false">Inactives</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Règles métier ({totalCount})</CardTitle>
            <Button onClick={handleCreate} size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {displayedRules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune règle trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Nom</th>
                    <th className="text-left py-3 px-4 font-medium">Code</th>
                    <th className="text-left py-3 px-4 font-medium">Sévérité</th>
                    <th className="text-left py-3 px-4 font-medium">Action</th>
                    <th className="text-left py-3 px-4 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 font-medium">Créée</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRules.map((rule) => (
                    <tr key={rule.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {rule.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {rule.code}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={rule.severity} />
                      </td>
                      <td className="py-3 px-4">
                        {getActionTypeBadge(rule.action_type)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(rule.is_active)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(rule.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(rule)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(rule)}>
                              <EditIcon className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestRule(rule.id)}>
                              <PlayIcon className="h-4 w-4 mr-2" />
                              Tester
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(rule.id, rule.is_active)}>
                              {rule.is_active ? (
                                <>
                                  <PauseIcon className="h-4 w-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <PlayIcon className="h-4 w-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600"
                            >
                              <Trash2Icon className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages} ({totalCount} règles)
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
        </CardContent>
      </Card>
      {/* Modals */}
      <AgriRuleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
        mode="create"
      />

      <AgriRuleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
        agriRule={selectedRule}
        mode="edit"
      />

      <AgriRuleDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        agriRule={selectedRule}
      />
    </div>
  );
};
