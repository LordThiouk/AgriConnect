import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { AgentsService } from '../../services/agentsService';
import { useToast } from '../../context/ToastContext';
import { Agent } from '../../types';

// Type assertions for Lucide React icons
const UserPlusIcon = UserPlus as any;
const UserMinusIcon = UserMinus as any;
const XIcon = X as any;

interface AgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerId: string;
  producerName: string;
  onAgentAssigned: () => void;
}

const AgentAssignmentModal: React.FC<AgentAssignmentModalProps> = ({
  isOpen,
  onClose,
  producerId,
  producerName,
  onAgentAssigned
}) => {
  const { showToast } = useToast();
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [assignedAgents, setAssignedAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssignedAgents().then(() => {
        fetchAvailableAgents();
      });
    }
  }, [isOpen, producerId]);

  const fetchAvailableAgents = async () => {
    try {
      setLoading(true);
      // Récupérer tous les agents actifs et approuvés
      const agentsResponse = await AgentsService.getAgents({ is_active: true }, 1, 1000);
      
      if (!agentsResponse || !agentsResponse.data) {
        console.warn('No agents data received');
        setAvailableAgents([]);
        return;
      }
      
      // Filtrer les agents qui ne sont pas déjà assignés à ce producteur
      const assignedAgentIds = new Set((assignedAgents || []).map(agent => agent.id));
      const availableAgentsList = agentsResponse.data.filter(agent => !assignedAgentIds.has(agent.id));
      
      setAvailableAgents(availableAgentsList);
    } catch (error) {
      console.error('Error fetching available agents:', error);
      showToast({
        type: 'error',
        title: 'Erreur lors du chargement des agents'
      });
      setAvailableAgents([]); // S'assurer que le state est défini même en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedAgents = async () => {
    try {
      const agents = await AgentsService.getAssignedAgentsForProducer(producerId);
      setAssignedAgents(agents || []); // S'assurer qu'on a toujours un tableau
    } catch (error) {
      console.error('Error fetching assigned agents:', error);
      showToast({
        type: 'error',
        title: 'Erreur lors du chargement des agents assignés'
      });
      setAssignedAgents([]); // S'assurer que le state est défini même en cas d'erreur
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentId) {
      showToast({
        type: 'error',
        title: 'Veuillez sélectionner un agent'
      });
      return;
    }

    try {
      setLoading(true);
      await AgentsService.assignAgentToProducer(selectedAgentId, producerId);
      showToast({
        type: 'success',
        title: 'Agent attribué avec succès'
      });
      setSelectedAgentId('');
      await fetchAssignedAgents(); // Recharger les agents assignés
      await fetchAvailableAgents(); // Recharger les agents disponibles
      onAgentAssigned();
    } catch (error) {
      console.error('Error assigning agent:', error);
      showToast({
        type: 'error',
        title: 'Erreur lors de l\'attribution de l\'agent'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignAgent = async (agentId: string) => {
    try {
      setLoading(true);
      await AgentsService.unassignProducerFromAgent(producerId, agentId);
      showToast({
        type: 'success',
        title: 'Agent retiré avec succès'
      });
      await fetchAssignedAgents(); // Recharger les agents assignés
      await fetchAvailableAgents(); // Recharger les agents disponibles
      onAgentAssigned();
    } catch (error) {
      console.error('Error unassigning agent:', error);
      showToast({
        type: 'error',
        title: 'Erreur lors du retrait de l\'agent'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone || phone === 'Non disponible') return phone || 'Non disponible';
    return phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5');
  };

  const unassignedAgents = availableAgents.filter(
    agent => !assignedAgents.some(assigned => assigned.id === agent.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestion des Agents - {producerName}</DialogTitle>
          <DialogDescription>
            Attribuez ou retirez des agents pour ce producteur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agents Assignés */}
          <div>
            <h3 className="text-lg font-medium mb-3">Agents Assignés</h3>
            {assignedAgents.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun agent assigné</p>
            ) : (
              <div className="space-y-2">
                {assignedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{agent.display_name || 'Nom non disponible'}</p>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(agent.phone)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnassignAgent(agent.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinusIcon className="h-4 w-4 mr-1" />
                      Retirer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attribution d'un nouvel agent */}
          <div>
            <h3 className="text-lg font-medium mb-3">Attribuer un Agent</h3>
            <div className="flex gap-2">
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.display_name || 'Nom non disponible'} - {formatPhoneNumber(agent.phone)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignAgent}
                disabled={!selectedAgentId || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlusIcon className="h-4 w-4 mr-1" />
                Attribuer
              </Button>
            </div>
            {unassignedAgents.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Tous les agents disponibles sont déjà assignés à ce producteur
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentAssignmentModal;
