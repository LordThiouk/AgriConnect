import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { ProducersService } from '../../services/producersService';
import { useToast } from '../../context/ToastContext';

// Type assertions for Lucide React icons
const UserPlusIcon = UserPlus as any;
const UserMinusIcon = UserMinus as any;
const XIcon = X as any;

interface Agent {
  id: string;
  display_name: string;
  phone: string;
}

interface AgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerId: string;
  producerName: string;
  assignedAgents: Agent[];
  onAgentAssigned: () => void;
}

const AgentAssignmentModal: React.FC<AgentAssignmentModalProps> = ({
  isOpen,
  onClose,
  producerId,
  producerName,
  assignedAgents,
  onAgentAssigned
}) => {
  const { showToast } = useToast();
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableAgents();
    }
  }, [isOpen]);

  const fetchAvailableAgents = async () => {
    try {
      setLoading(true);
      const agents = await ProducersService.getAvailableAgents();
      setAvailableAgents(agents);
    } catch (error) {
      console.error('Error fetching available agents:', error);
      showToast('Erreur lors du chargement des agents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentId) {
      showToast('Veuillez sélectionner un agent', 'error');
      return;
    }

    try {
      setLoading(true);
      await ProducersService.assignAgentToProducer(producerId, selectedAgentId);
      showToast('Agent attribué avec succès', 'success');
      setSelectedAgentId('');
      onAgentAssigned();
    } catch (error) {
      console.error('Error assigning agent:', error);
      showToast('Erreur lors de l\'attribution de l\'agent', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignAgent = async (agentId: string) => {
    try {
      setLoading(true);
      await ProducersService.unassignAgentFromProducer(producerId, agentId);
      showToast('Agent retiré avec succès', 'success');
      onAgentAssigned();
    } catch (error) {
      console.error('Error unassigning agent:', error);
      showToast('Erreur lors du retrait de l\'agent', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === 'Non disponible') return phone;
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
                      <p className="font-medium">{agent.display_name}</p>
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
                      {agent.display_name} - {formatPhoneNumber(agent.phone)}
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
