import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AgentsService } from '../../services/agentsService';
import { Agent, Producer } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Users, UserPlus, UserMinus, Search } from 'lucide-react';

interface AgentProducerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onSuccess: () => void;
}

const AgentProducerAssignmentModal: React.FC<AgentProducerAssignmentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducers, setAvailableProducers] = useState<Producer[]>([]);
  const [assignedProducers, setAssignedProducers] = useState<Producer[]>([]);
  const [selectedProducerId, setSelectedProducerId] = useState('');

  useEffect(() => {
    if (isOpen && agent) {
      fetchProducers();
    }
  }, [isOpen, agent]);

  const fetchProducers = async () => {
    if (!agent) return;
    
    setLoading(true);
    try {
      const producersResponse = await AgentsService.getAgentProducers(agent.id);
      setAssignedProducers(producersResponse.data || []);
      
      // Récupérer tous les producteurs disponibles
      const allProducers = await AgentsService.getAvailableProducers();
      setAvailableProducers(allProducers);
    } catch (error) {
      console.error('Erreur lors du chargement des producteurs:', error);
      showToast({ type: 'error', title: 'Erreur lors du chargement des producteurs' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProducer = async () => {
    if (!selectedProducerId || !agent) return;
    
    setLoading(true);
    try {
      await AgentsService.assignProducerToAgent(selectedProducerId, agent.id);
      showToast({ type: 'success', title: 'Producteur assigné avec succès' });
      
      // Rafraîchir la liste
      await fetchProducers();
      setSelectedProducerId('');
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      showToast({ type: 'error', title: 'Erreur lors de l\'assignation du producteur' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignProducer = async (producerId: string) => {
    if (!agent) return;
    
    setLoading(true);
    try {
      await AgentsService.unassignProducerFromAgent(producerId, agent.id);
      showToast({ type: 'success', title: 'Producteur désassigné avec succès' });
      
      // Rafraîchir la liste
      await fetchProducers();
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la désassignation:', error);
      showToast({ type: 'error', title: 'Erreur lors de la désassignation du producteur' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableProducers = availableProducers.filter(producer => {
    const isNotAssigned = !(assignedProducers || []).some(assigned => assigned.id === producer.id);
    const matchesSearch = producer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.phone.includes(searchTerm);
    return isNotAssigned && matchesSearch;
  });

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Assignation des producteurs - {agent.display_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assigner un nouveau producteur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-green-600" />
                <span>Assigner un producteur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="search">Rechercher un producteur</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nom, téléphone..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="producer">Sélectionner un producteur</Label>
                  <Select value={selectedProducerId} onValueChange={setSelectedProducerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un producteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAvailableProducers.map(producer => (
                        <SelectItem key={producer.id} value={producer.id}>
                          {producer.first_name} {producer.last_name} - {producer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAssignProducer}
                    disabled={!selectedProducerId || loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assigner
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Producteurs assignés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Producteurs assignés ({(assignedProducers || []).length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (assignedProducers || []).length > 0 ? (
                <div className="space-y-3">
                  {(assignedProducers || []).map(producer => (
                    <div 
                      key={producer.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {producer.first_name} {producer.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{producer.phone}</p>
                          </div>
                          {producer.region && (
                            <Badge variant="outline" className="text-xs">
                              {producer.region}
                            </Badge>
                          )}
                          <Badge 
                            className={`text-xs ${
                              producer.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {producer.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignProducer(producer.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Désassigner
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun producteur assigné à cet agent</p>
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

export default AgentProducerAssignmentModal;
