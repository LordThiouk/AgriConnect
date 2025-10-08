import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AgentsService } from '../../services/agentsService';
import { Agent, CreateAgentData, UpdateAgentData } from '../../types';
import { useToast } from '../../context/ToastContext';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agent?: Agent | null;
  mode: 'create' | 'edit';
}

const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  agent,
  mode
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAgentData>({
    user_id: '',
    display_name: '',
    phone: '',
    region: '',
    department: '',
    commune: '',
    is_active: true,
    approval_status: 'pending'
  });

  const [regions] = useState([
    'Dakar', 'Thiès', 'Diourbel', 'Kaolack', 'Fatick', 'Kolda', 
    'Ziguinchor', 'Tambacounda', 'Saint-Louis', 'Matam', 'Louga', 'Sédhiou'
  ]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && agent) {
        setFormData({
          user_id: agent.user_id || '',
          display_name: agent.display_name || '',
          phone: agent.phone || '',
          region: agent.region || '',
          department: agent.department || '',
          commune: agent.commune || '',
          is_active: agent.is_active,
          approval_status: agent.approval_status
        });
      } else {
        setFormData({
          user_id: '',
          display_name: '',
          phone: '',
          region: '',
          department: '',
          commune: '',
          is_active: true,
          approval_status: 'pending'
        });
      }
    }
  }, [isOpen, mode, agent]);

  // Note: Les coopératives sont maintenant gérées via les assignations séparées

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        // Générer un user_id temporaire pour la création
        const createData = {
          ...formData,
          user_id: formData.user_id || crypto.randomUUID()
        };
        await AgentsService.createAgent(createData);
        showToast({ type: 'success', title: 'Agent créé avec succès' });
      } else if (mode === 'edit' && agent) {
        const updateData: UpdateAgentData = {
          ...formData,
          id: agent.id
        };
        await AgentsService.updateAgent(updateData);
        showToast({ type: 'success', title: 'Agent mis à jour avec succès' });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast({ type: 'error', title: 'Erreur lors de la sauvegarde de l\'agent' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateAgentData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Créer un nouvel agent' : 'Modifier l\'agent'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Nom complet *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Ex: Amadou Diop"
                required
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ex: +221701234567"
                required
              />
            </div>

            {/* Région */}
            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Département */}
            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Ex: Pikine"
              />
            </div>

            {/* Commune */}
            <div className="space-y-2">
              <Label htmlFor="commune">Commune</Label>
              <Input
                id="commune"
                value={formData.commune}
                onChange={(e) => handleInputChange('commune', e.target.value)}
                placeholder="Ex: Guédiawaye"
              />
            </div>

            {/* User ID (pour création) */}
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="user_id">ID Utilisateur *</Label>
                <Input
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  placeholder="Ex: uuid-v4-format"
                  required
                />
              </div>
            )}

            {/* Statut actif */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Statut</Label>
              <Select 
                value={formData.is_active ? 'active' : 'inactive'} 
                onValueChange={(value) => handleInputChange('is_active', value === 'active')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statut d'approbation */}
            <div className="space-y-2">
              <Label htmlFor="approval_status">Statut d'approbation</Label>
              <Select 
                value={formData.approval_status} 
                onValueChange={(value) => handleInputChange('approval_status', value as 'pending' | 'approved' | 'rejected')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Mettre à jour')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgentModal;
