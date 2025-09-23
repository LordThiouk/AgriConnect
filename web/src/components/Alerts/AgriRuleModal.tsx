import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { AlertsService } from '../../services/alertsService';
import { AgriRule } from '../../types';
import { toast } from 'react-hot-toast';

interface AgriRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agriRule?: AgriRule | null;
  mode: 'create' | 'edit';
}

export default function AgriRuleModal({
  isOpen,
  onClose,
  onSuccess,
  agriRule,
  mode
}: AgriRuleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    severity: '',
    action_type: '',
    condition_sql: '',
    action_message: '',
    applicable_crops: [] as string[],
    applicable_regions: [] as string[],
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [cropsInput, setCropsInput] = useState('');
  const [regionsInput, setRegionsInput] = useState('');

  // Initialiser les données du formulaire
  useEffect(() => {
    if (mode === 'edit' && agriRule) {
      setFormData({
        name: agriRule.name || '',
        description: agriRule.description || '',
        code: agriRule.code || '',
        severity: agriRule.severity || '',
        action_type: agriRule.action_type || '',
        condition_sql: agriRule.condition_sql || '',
        action_message: agriRule.action_message || '',
        applicable_crops: agriRule.applicable_crops || [],
        applicable_regions: agriRule.applicable_regions || [],
        is_active: agriRule.is_active ?? true
      });
      setCropsInput(Array.isArray(agriRule.applicable_crops) ? agriRule.applicable_crops.join(', ') : '');
      setRegionsInput(Array.isArray(agriRule.applicable_regions) ? agriRule.applicable_regions.join(', ') : '');
    } else {
      setFormData({
        name: '',
        description: '',
        code: '',
        severity: '',
        action_type: '',
        condition_sql: '',
        action_message: '',
        applicable_crops: [],
        applicable_regions: [],
        is_active: true
      });
      setCropsInput('');
      setRegionsInput('');
    }
  }, [mode, agriRule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertir les chaînes en tableaux
      const crops = cropsInput.split(',').map(crop => crop.trim()).filter(crop => crop);
      const regions = regionsInput.split(',').map(region => region.trim()).filter(region => region);

      const dataToSubmit = {
        ...formData,
        applicable_crops: crops,
        applicable_regions: regions
      };

      if (mode === 'create') {
        await AlertsService.createAgriRule(dataToSubmit);
        toast.success('Règle métier créée avec succès');
      } else if (mode === 'edit' && agriRule) {
        await AlertsService.updateAgriRule(agriRule.id, dataToSubmit);
        toast.success('Règle métier mise à jour avec succès');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving agri rule:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvelle Règle Métier' : 'Modifier la Règle Métier'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Créez une nouvelle règle métier pour automatiser les recommandations.'
              : 'Modifiez les paramètres de cette règle métier.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom et Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom de la règle métier"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Code unique de la règle"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description de la règle métier"
              rows={3}
            />
          </div>

          {/* Sévérité et Type d'action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Sévérité</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleChange('severity', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_type">Type d'action</Label>
              <Select
                value={formData.action_type}
                onValueChange={(value) => handleChange('action_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="alert">Alerte</SelectItem>
                  <SelectItem value="recommendation">Recommandation</SelectItem>
                  <SelectItem value="blocking">Blocage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Condition SQL */}
          <div className="space-y-2">
            <Label htmlFor="condition_sql">Condition SQL *</Label>
            <Textarea
              id="condition_sql"
              value={formData.condition_sql}
              onChange={(e) => handleChange('condition_sql', e.target.value)}
              placeholder="Ex: SELECT * FROM crops WHERE status = 'active'"
              rows={3}
              required
            />
            <p className="text-sm text-gray-500">
              Requête SQL qui définit quand cette règle doit être appliquée
            </p>
          </div>

          {/* Message d'action */}
          <div className="space-y-2">
            <Label htmlFor="action_message">Message d'action</Label>
            <Textarea
              id="action_message"
              value={formData.action_message}
              onChange={(e) => handleChange('action_message', e.target.value)}
              placeholder="Message à afficher quand la règle est déclenchée"
              rows={2}
            />
          </div>

          {/* Cultures applicables */}
          <div className="space-y-2">
            <Label htmlFor="applicable_crops">Cultures applicables</Label>
            <Input
              id="applicable_crops"
              value={cropsInput}
              onChange={(e) => setCropsInput(e.target.value)}
              placeholder="Riz, Maïs, Mil (séparés par des virgules)"
            />
            <p className="text-sm text-gray-500">
              Liste des cultures concernées par cette règle (séparées par des virgules)
            </p>
          </div>

          {/* Régions applicables */}
          <div className="space-y-2">
            <Label htmlFor="applicable_regions">Régions applicables</Label>
            <Input
              id="applicable_regions"
              value={regionsInput}
              onChange={(e) => setRegionsInput(e.target.value)}
              placeholder="Kaolack, Thiès, Dakar (séparées par des virgules)"
            />
            <p className="text-sm text-gray-500">
              Liste des régions concernées par cette règle (séparées par des virgules)
            </p>
          </div>

          {/* Statut actif */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Règle active</Label>
          </div>

          {/* Boutons */}
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.code || !formData.condition_sql}
          >
            {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Mettre à jour')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
