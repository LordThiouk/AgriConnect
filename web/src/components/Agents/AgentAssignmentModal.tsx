import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AgentsService } from '../../services/agentsService';
import { Agent, Producer, Cooperative } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Users, UserPlus, UserMinus, Search, Building2 } from 'lucide-react';

// Type assertions for Lucide React icons
const UsersIcon = Users as any;
const UserPlusIcon = UserPlus as any;
const UserMinusIcon = UserMinus as any;
const SearchIcon = Search as any;
const BuildingIcon = Building2 as any;

interface AgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onSuccess: () => void;
}

const AgentAssignmentModal: React.FC<AgentAssignmentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentType, setAssignmentType] = useState<'producer' | 'cooperative'>('producer');
  const [selectedId, setSelectedId] = useState('');
  const [availableProducers, setAvailableProducers] = useState<Producer[]>([]);
  const [availableCooperatives, setAvailableCooperatives] = useState<Cooperative[]>([]);
  const [assignedItems, setAssignedItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && agent) {
      fetchAssignments();
    }
  }, [isOpen, agent]);

  const fetchAssignments = async () => {
    if (!agent) return;
    
    setLoading(true);
    try {
      // Récupérer les assignations actuelles
      const assignmentsResponse = await AgentsService.getAgentAssignments(agent.id);
      setAssignedItems(assignmentsResponse || []);

      // Récupérer les producteurs disponibles
      const producersResponse = await AgentsService.getAvailableProducers(agent.id);
      setAvailableProducers(producersResponse);

      // Récupérer les coopératives disponibles
      const cooperativesResponse = await AgentsService.getAvailableCooperatives(agent.id);
      setAvailableCooperatives(cooperativesResponse);
      
    } catch (error) {
      console.error('Erreur lors du chargement des assignations:', error);
      showToast({ type: 'error', title: 'Erreur lors du chargement des assignations' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedId || !agent) return;
    
    setLoading(true);
    try {
      if (assignmentType === 'producer') {
        await AgentsService.assignAgentToProducer(agent.id, selectedId);
        showToast({ type: 'success', title: 'Producteur assigné avec succès' });
      } else {
        await AgentsService.assignAgentToCooperative(agent.id, selectedId);
        showToast({ type: 'success', title: 'Coopérative assignée avec succès' });
      }
      
      await fetchAssignments();
      setSelectedId('');
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      showToast({ type: 'error', title: 'Erreur lors de l\'assignation' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!agent) return;
    
    setLoading(true);
    try {
      await AgentsService.removeAgentAssignment(assignmentId);
      showToast({ type: 'success', title: 'Assignation supprimée avec succès' });
      
      await fetchAssignments();
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showToast({ type: 'error', title: 'Erreur lors de la suppression de l\'assignation' });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = () => {
    if (assignmentType === 'producer') {
      const assignedIds = new Set(assignedItems.filter(item => item.assigned_to_type === 'producer').map(item => item.assigned_to_id));
      return availableProducers.filter(producer => 
        !assignedIds.has(producer.id) &&
        ((producer.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (producer.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (producer.phone || '').includes(searchTerm))
      );
    } else {
      const assignedIds = new Set(assignedItems.filter(item => item.assigned_to_type === 'cooperative').map(item => item.assigned_to_id));
      return availableCooperatives.filter(cooperative => 
        !assignedIds.has(cooperative.id) &&
        ((cooperative.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (cooperative.region || '').toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <UsersIcon className="h-6 w-6 text-blue-600" />
            <span>Assignations - {agent.display_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nouvelle assignation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlusIcon className="h-5 w-5 text-green-600" />
                <span>Nouvelle assignation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Type d'assignation */}
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={assignmentType} onValueChange={(value) => setAssignmentType(value as 'producer' | 'cooperative')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="producer">
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="h-4 w-4" />
                          <span>Producteur</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cooperative">
                        <div className="flex items-center space-x-2">
                          <BuildingIcon className="h-4 w-4" />
                          <span>Coopérative</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recherche */}
                <div className="md:col-span-2">
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={`Rechercher un ${assignmentType === 'producer' ? 'producteur' : 'coopérative'}...`}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sélection */}
                <div>
                  <Label htmlFor="selection">Sélectionner</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choisir un ${assignmentType === 'producer' ? 'producteur' : 'coopérative'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredItems().map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {assignmentType === 'producer' ? (
                            `${(item.first_name || '')} ${(item.last_name || '')} - ${item.phone || 'Pas de téléphone'}`
                          ) : (
                            (item as any).name || 'Coopérative sans nom'
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleAssign}
                  disabled={!selectedId || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Assigner
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assignations actuelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5 text-blue-600" />
                <span>Assignations actuelles ({(assignedItems || []).length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (assignedItems || []).length > 0 ? (
                <div className="space-y-3">
                  {(assignedItems || []).map((item, index) => (
                    <div 
                      key={`${item.assigned_to_type}-${item.assigned_to_id}-${index}`}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.name || item.display_name || `${(item.first_name || '')} ${(item.last_name || '')}`.trim() || 'Nom non disponible'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.phone || 'Pas de téléphone'}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              item.assigned_to_type === 'producer' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {item.assigned_to_type === 'producer' ? 'Producteur' : 'Coopérative'}
                          </Badge>
                          {item.region && (
                            <Badge variant="outline" className="text-xs">
                              {item.region}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassign(item.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinusIcon className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune assignation pour cet agent</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentAssignmentModal;