import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../context/ToastContext';
import { Operation } from '../../types';
import { OperationsService } from '../../services/operationsService';

// Type assertions pour les composants
const SelectComponent = Select as any;
const SelectContentComponent = SelectContent as any;
const SelectItemComponent = SelectItem as any;
const SelectTriggerComponent = SelectTrigger as any;
const SelectValueComponent = SelectValue as any;

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation?: Operation | null;
  plotId?: string;
  cropId?: string;
  onSave: (operation: Operation) => void;
}

const OperationModal: React.FC<OperationModalProps> = ({
  isOpen,
  onClose,
  operation,
  plotId,
  cropId,
  onSave
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    operation_type: '',
    operation_date: '',
    description: '',
    product_used: '',
    dose_per_hectare: '',
    total_dose: '',
    unit: '',
    cost_per_hectare: '',
    total_cost: '',
    notes: ''
  });

  useEffect(() => {
    if (operation) {
      setFormData({
        operation_type: operation.operation_type || '',
        operation_date: operation.operation_date ? operation.operation_date.split('T')[0] : '',
        description: operation.description || '',
        product_used: operation.product_used || '',
        dose_per_hectare: operation.dose_per_hectare?.toString() || '',
        total_dose: operation.total_dose?.toString() || '',
        unit: operation.unit || '',
        cost_per_hectare: operation.cost_per_hectare?.toString() || '',
        total_cost: operation.total_cost?.toString() || '',
        notes: operation.notes || ''
      });
    } else {
      setFormData({
        operation_type: '',
        operation_date: '',
        description: '',
        product_used: '',
        dose_per_hectare: '',
        total_dose: '',
        unit: '',
        cost_per_hectare: '',
        total_cost: '',
        notes: ''
      });
    }
  }, [operation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation des IDs requis
      if (!plotId) {
        throw new Error('ID de parcelle manquant');
      }

      const operationData = {
        ...formData,
        plot_id: plotId,
        crop_id: cropId || null, // crop_id peut être null pour certaines opérations
        operation_type: formData.operation_type as 'semis' | 'fertilisation' | 'irrigation' | 'desherbage' | 'phytosanitaire' | 'recolte' | 'labour' | 'reconnaissance',
        unit: formData.unit as 'l' | 'kg' | 'pieces' | 'other' || undefined,
        dose_per_hectare: formData.dose_per_hectare ? parseFloat(formData.dose_per_hectare) : undefined,
        total_dose: formData.total_dose ? parseFloat(formData.total_dose) : undefined,
        cost_per_hectare: formData.cost_per_hectare ? parseFloat(formData.cost_per_hectare) : undefined,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : undefined,
        operation_date: formData.operation_date || undefined,
      };

      let savedOperation: Operation;
      if (operation) {
        savedOperation = await OperationsService.updateOperation(operation.id, operationData);
      } else {
        savedOperation = await OperationsService.createOperation(operationData);
      }

      onSave(savedOperation);
      showToast({
        type: 'success',
        title: operation ? 'Opération mise à jour avec succès' : 'Opération créée avec succès'
      });
      onClose();
    } catch (error) {
      console.error('Error saving operation:', error);
      showToast({
        type: 'error',
        title: 'Erreur lors de la sauvegarde'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{operation ? 'Modifier l\'opération' : 'Ajouter une opération'}</DialogTitle>
          <DialogDescription>
            {operation ? 'Modifiez les informations de l\'opération' : 'Ajoutez une nouvelle opération à cette parcelle'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operation_type">Type d'opération *</Label>
              <SelectComponent value={formData.operation_type} onValueChange={(value: string) => handleChange('operation_type', value)}>
                <SelectTriggerComponent>
                  <SelectValueComponent placeholder="Sélectionner un type" />
                </SelectTriggerComponent>
                <SelectContentComponent>
                  <SelectItemComponent value="sowing">Semis</SelectItemComponent>
                  <SelectItemComponent value="fertilization">Fertilisation</SelectItemComponent>
                  <SelectItemComponent value="irrigation">Irrigation</SelectItemComponent>
                  <SelectItemComponent value="weeding">Désherbage</SelectItemComponent>
                  <SelectItemComponent value="pest_control">Lutte contre les ravageurs</SelectItemComponent>
                  <SelectItemComponent value="disease_control">Lutte contre les maladies</SelectItemComponent>
                  <SelectItemComponent value="harvesting">Récolte</SelectItemComponent>
                  <SelectItemComponent value="other">Autre</SelectItemComponent>
                </SelectContentComponent>
              </SelectComponent>
            </div>

            <div>
              <Label htmlFor="operation_date">Date d'opération</Label>
              <Input
                id="operation_date"
                type="date"
                value={formData.operation_date}
                onChange={(e) => handleChange('operation_date', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description de l'opération..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_used">Produit utilisé</Label>
              <Input
                id="product_used"
                value={formData.product_used}
                onChange={(e) => handleChange('product_used', e.target.value)}
                placeholder="Nom du produit"
              />
            </div>

            <div>
              <Label htmlFor="unit">Unité</Label>
              <SelectComponent value={formData.unit} onValueChange={(value: string) => handleChange('unit', value)}>
                <SelectTriggerComponent>
                  <SelectValueComponent placeholder="Sélectionner une unité" />
                </SelectTriggerComponent>
                <SelectContentComponent>
                  <SelectItemComponent value="kg">kg</SelectItemComponent>
                  <SelectItemComponent value="L">L</SelectItemComponent>
                  <SelectItemComponent value="mL">mL</SelectItemComponent>
                  <SelectItemComponent value="g">g</SelectItemComponent>
                  <SelectItemComponent value="ha">ha</SelectItemComponent>
                  <SelectItemComponent value="pieces">Pièces</SelectItemComponent>
                </SelectContentComponent>
              </SelectComponent>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dose_per_hectare">Dose par hectare</Label>
              <Input
                id="dose_per_hectare"
                type="number"
                step="0.01"
                value={formData.dose_per_hectare}
                onChange={(e) => handleChange('dose_per_hectare', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="total_dose">Dose totale</Label>
              <Input
                id="total_dose"
                type="number"
                step="0.01"
                value={formData.total_dose}
                onChange={(e) => handleChange('total_dose', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost_per_hectare">Coût par hectare (XOF)</Label>
              <Input
                id="cost_per_hectare"
                type="number"
                step="0.01"
                value={formData.cost_per_hectare}
                onChange={(e) => handleChange('cost_per_hectare', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="total_cost">Coût total (XOF)</Label>
              <Input
                id="total_cost"
                type="number"
                step="0.01"
                value={formData.total_cost}
                onChange={(e) => handleChange('total_cost', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.operation_type}>
              {loading ? 'Sauvegarde...' : (operation ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OperationModal;
