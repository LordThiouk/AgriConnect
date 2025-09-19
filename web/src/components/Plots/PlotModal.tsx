import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../context/ToastContext';
import { Plot, Producer } from '../../types';
import { PlotsService } from '../../services/plotsService';
import { ProducersService } from '../../services/producersService';

interface PlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plot?: Plot | null;
  mode: 'create' | 'edit';
}

const PlotModal: React.FC<PlotModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  plot,
  mode
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [formData, setFormData] = useState({
    producer_id: '',
    name: '',
    area_hectares: '',
    soil_type: '',
    soil_ph: '',
    water_source: '',
    irrigation_type: '',
    slope_percent: '',
    elevation_meters: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducers();
      if (mode === 'edit' && plot) {
        setFormData({
          producer_id: plot.producer_id || '',
          name: plot.name || '',
          area_hectares: plot.area_hectares?.toString() || '',
          soil_type: plot.soil_type || '',
          soil_ph: plot.soil_ph?.toString() || '',
          water_source: plot.water_source || '',
          irrigation_type: plot.irrigation_type || '',
          slope_percent: plot.slope_percent?.toString() || '',
          elevation_meters: plot.elevation_meters?.toString() || '',
          status: plot.status || 'active',
          notes: plot.notes || ''
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, plot]);

  const fetchProducers = async () => {
    try {
      const response = await ProducersService.getProducers({}, { page: 1, limit: 1000 });
      setProducers(response.data);
    } catch (error) {
      console.error('Error fetching producers:', error);
      showToast({ type: 'error', title: 'Erreur lors du chargement des producteurs' });
    }
  };

  const resetForm = () => {
    setFormData({
      producer_id: '',
      name: '',
      area_hectares: '',
      soil_type: '',
      soil_ph: '',
      water_source: '',
      irrigation_type: '',
      slope_percent: '',
      elevation_meters: '',
      status: 'active',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.producer_id || !formData.name) {
      showToast({ type: 'error', title: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    setLoading(true);
    try {
      const plotData = {
        producer_id: formData.producer_id,
        name: formData.name,
        area_hectares: formData.area_hectares ? parseFloat(formData.area_hectares) : undefined,
        soil_type: formData.soil_type || undefined,
        soil_ph: formData.soil_ph ? parseFloat(formData.soil_ph) : undefined,
        water_source: formData.water_source || undefined,
        irrigation_type: formData.irrigation_type || undefined,
        slope_percent: formData.slope_percent ? parseFloat(formData.slope_percent) : undefined,
        elevation_meters: formData.elevation_meters ? parseFloat(formData.elevation_meters) : undefined,
        status: formData.status as 'active' | 'inactive' | 'abandoned',
        notes: formData.notes || undefined
      };

      if (mode === 'create') {
        await PlotsService.createPlot(plotData);
        showToast({ type: 'success', title: 'Parcelle créée avec succès' });
      } else if (mode === 'edit' && plot) {
        await PlotsService.updatePlot(plot.id, plotData);
        showToast({ type: 'success', title: 'Parcelle mise à jour avec succès' });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving plot:', error);
      showToast({ type: 'error', title: 'Erreur lors de la sauvegarde de la parcelle' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvelle Parcelle' : 'Modifier la Parcelle'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Ajoutez une nouvelle parcelle à l\'exploitation' 
              : 'Modifiez les informations de la parcelle'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Producteur */}
          <div className="space-y-2">
            <Label htmlFor="producer_id">
              Producteur <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.producer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, producer_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un producteur" />
              </SelectTrigger>
              <SelectContent>
                {producers.map((producer) => (
                  <SelectItem key={producer.id} value={producer.id}>
                    {producer.first_name} {producer.last_name} - {producer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nom de la parcelle */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de la parcelle <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Parcelle Nord, Parcelle Sud..."
              required
            />
          </div>

          {/* Surface et caractéristiques du sol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area_hectares">Surface (hectares)</Label>
              <Input
                id="area_hectares"
                type="number"
                step="0.01"
                min="0"
                value={formData.area_hectares}
                onChange={(e) => setFormData(prev => ({ ...prev, area_hectares: e.target.value }))}
                placeholder="Ex: 2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soil_type">Type de sol</Label>
              <Select
                value={formData.soil_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, soil_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type de sol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandy">Sableux</SelectItem>
                  <SelectItem value="clay">Argileux</SelectItem>
                  <SelectItem value="loam">Limon</SelectItem>
                  <SelectItem value="silt">Limoneux</SelectItem>
                  <SelectItem value="organic">Organique</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* pH et eau */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="soil_ph">pH du sol</Label>
              <Input
                id="soil_ph"
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={formData.soil_ph}
                onChange={(e) => setFormData(prev => ({ ...prev, soil_ph: e.target.value }))}
                placeholder="Ex: 6.8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="water_source">Source d'eau</Label>
              <Select
                value={formData.water_source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, water_source: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la source d'eau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rain">Pluie</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="well">Puits</SelectItem>
                  <SelectItem value="river">Rivière</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Irrigation et topographie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="irrigation_type">Type d'irrigation</Label>
              <Select
                value={formData.irrigation_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, irrigation_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type d'irrigation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="drip">Goutte à goutte</SelectItem>
                  <SelectItem value="sprinkler">Aspersion</SelectItem>
                  <SelectItem value="flood">Inondation</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slope_percent">Pente (%)</Label>
              <Input
                id="slope_percent"
                type="number"
                step="0.1"
                min="0"
                value={formData.slope_percent}
                onChange={(e) => setFormData(prev => ({ ...prev, slope_percent: e.target.value }))}
                placeholder="Ex: 2.5"
              />
            </div>
          </div>

          {/* Élévation et statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="elevation_meters">Altitude (mètres)</Label>
              <Input
                id="elevation_meters"
                type="number"
                step="0.1"
                min="0"
                value={formData.elevation_meters}
                onChange={(e) => setFormData(prev => ({ ...prev, elevation_meters: e.target.value }))}
                placeholder="Ex: 45"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="abandoned">Abandonné</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Informations supplémentaires sur la parcelle..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Mettre à jour')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlotModal;
