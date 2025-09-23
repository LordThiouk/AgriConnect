import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../context/ToastContext';
import { Crop } from '../../types';
import { PlotsService } from '../../services/plotsService';

// Type assertions pour les composants
const SelectComponent = Select as any;
const SelectContentComponent = SelectContent as any;
const SelectItemComponent = SelectItem as any;
const SelectTriggerComponent = SelectTrigger as any;
const SelectValueComponent = SelectValue as any;

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop?: Crop | null;
  plotId?: string;
  farmFilePlotId?: string;
  onSave: (crop: Crop) => void;
}

const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  crop,
  plotId,
  farmFilePlotId,
  onSave
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    crop_type: '',
    variety: '',
    sowing_date: '',
    expected_harvest_date: '',
    actual_harvest_date: '',
    expected_yield_kg: '',
    actual_yield_kg: '',
    area_hectares: '',
    status: 'planted',
    notes: ''
  });

  useEffect(() => {
    if (crop) {
      setFormData({
        crop_type: crop.crop_type || '',
        variety: crop.variety || '',
        sowing_date: crop.sowing_date ? crop.sowing_date.split('T')[0] : '',
        expected_harvest_date: crop.expected_harvest_date ? crop.expected_harvest_date.split('T')[0] : '',
        actual_harvest_date: crop.actual_harvest_date ? crop.actual_harvest_date.split('T')[0] : '',
        expected_yield_kg: crop.estimated_yield_kg_ha?.toString() || '',
        actual_yield_kg: crop.actual_yield_kg_ha?.toString() || '',
        area_hectares: crop.area_hectares?.toString() || '',
        status: crop.status || 'planted',
        notes: crop.notes || ''
      });
    } else {
      setFormData({
        crop_type: '',
        variety: '',
        sowing_date: '',
        expected_harvest_date: '',
        actual_harvest_date: '',
        expected_yield_kg: '',
        actual_yield_kg: '',
        area_hectares: '',
        status: 'planted',
        notes: ''
      });
    }
  }, [crop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation des IDs requis
      const plotIdToUse = farmFilePlotId || plotId;
      if (!plotIdToUse) {
        throw new Error('ID de parcelle manquant');
      }

      const cropData = {
        ...formData,
        plot_id: plotIdToUse,
        crop_type: formData.crop_type as string,
        status: formData.status as 'planted' | 'growing' | 'harvested' | 'failed',
        estimated_yield_kg_ha: formData.expected_yield_kg ? parseFloat(formData.expected_yield_kg) : undefined,
        actual_yield_kg_ha: formData.actual_yield_kg ? parseFloat(formData.actual_yield_kg) : undefined,
        area_hectares: formData.area_hectares ? parseFloat(formData.area_hectares) : undefined,
        sowing_date: formData.sowing_date || undefined,
        expected_harvest_date: formData.expected_harvest_date || undefined,
        actual_harvest_date: formData.actual_harvest_date || undefined,
      };

      let savedCrop: Crop;
      if (crop) {
        savedCrop = await PlotsService.updateCrop(crop.id, cropData);
      } else {
        savedCrop = await PlotsService.createCrop(cropData);
      }

      onSave(savedCrop);
      showToast({
        type: 'success',
        title: crop ? 'Culture mise à jour avec succès' : 'Culture créée avec succès'
      });
      onClose();
    } catch (error) {
      console.error('Error saving crop:', error);
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
          <DialogTitle>{crop ? 'Modifier la culture' : 'Ajouter une culture'}</DialogTitle>
          <DialogDescription>
            {crop ? 'Modifiez les informations de la culture' : 'Ajoutez une nouvelle culture à cette parcelle'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crop_type">Type de culture *</Label>
              <SelectComponent value={formData.crop_type} onValueChange={(value: string) => handleChange('crop_type', value)}>
                <SelectTriggerComponent>
                  <SelectValueComponent placeholder="Sélectionner un type" />
                </SelectTriggerComponent>
                <SelectContentComponent>
                  <SelectItemComponent value="Maize">Maïs</SelectItemComponent>
                  <SelectItemComponent value="Rice">Riz</SelectItemComponent>
                  <SelectItemComponent value="Sorghum">Sorgho</SelectItemComponent>
                  <SelectItemComponent value="Millet">Millet</SelectItemComponent>
                  <SelectItemComponent value="Groundnut">Arachide</SelectItemComponent>
                  <SelectItemComponent value="Cotton">Coton</SelectItemComponent>
                  <SelectItemComponent value="Other">Autre</SelectItemComponent>
                </SelectContentComponent>
              </SelectComponent>
            </div>

            <div>
              <Label htmlFor="variety">Variété</Label>
              <Input
                id="variety"
                value={formData.variety}
                onChange={(e) => handleChange('variety', e.target.value)}
                placeholder="Nom de la variété"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sowing_date">Date de semis</Label>
              <Input
                id="sowing_date"
                type="date"
                value={formData.sowing_date}
                onChange={(e) => handleChange('sowing_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="expected_harvest_date">Récolte prévue</Label>
              <Input
                id="expected_harvest_date"
                type="date"
                value={formData.expected_harvest_date}
                onChange={(e) => handleChange('expected_harvest_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="actual_harvest_date">Récolte effective</Label>
              <Input
                id="actual_harvest_date"
                type="date"
                value={formData.actual_harvest_date}
                onChange={(e) => handleChange('actual_harvest_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="area_hectares">Superficie (ha)</Label>
              <Input
                id="area_hectares"
                type="number"
                step="0.01"
                value={formData.area_hectares}
                onChange={(e) => handleChange('area_hectares', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="expected_yield_kg">Rendement prévu (kg/ha)</Label>
              <Input
                id="expected_yield_kg"
                type="number"
                value={formData.expected_yield_kg}
                onChange={(e) => handleChange('expected_yield_kg', e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="actual_yield_kg">Rendement réel (kg/ha)</Label>
              <Input
                id="actual_yield_kg"
                type="number"
                value={formData.actual_yield_kg}
                onChange={(e) => handleChange('actual_yield_kg', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <SelectComponent value={formData.status} onValueChange={(value: string) => handleChange('status', value)}>
              <SelectTriggerComponent>
                <SelectValueComponent placeholder="Sélectionner un statut" />
              </SelectTriggerComponent>
              <SelectContentComponent>
                <SelectItemComponent value="planted">Planté</SelectItemComponent>
                <SelectItemComponent value="growing">En croissance</SelectItemComponent>
                <SelectItemComponent value="harvested">Récolté</SelectItemComponent>
                <SelectItemComponent value="failed">Échec</SelectItemComponent>
              </SelectContentComponent>
            </SelectComponent>
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
            <Button type="submit" disabled={loading || !formData.crop_type}>
              {loading ? 'Sauvegarde...' : (crop ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CropModal;
