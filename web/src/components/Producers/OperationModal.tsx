import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Activity, 
  Calendar, 
  MapPin, 
  Package, 
  DollarSign,
  User
} from 'lucide-react';
import { OperationsRpcService } from '../../services/operationsRpcService';
import { Operation } from '../../types';

// Type assertions pour résoudre le conflit de types
const ActivityIcon = Activity as any;
const CalendarIcon = Calendar as any;
const MapPinIcon = MapPin as any;
const PackageIcon = Package as any;
const DollarSignIcon = DollarSign as any;
const UserIcon = User as any;

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (operation: Operation) => void;
  operation?: Operation | null;
  producerId?: string;
}

const OperationModal: React.FC<OperationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  operation,
  producerId
}) => {
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const operationTypes = [
    { value: 'semis', label: 'Semis' },
    { value: 'fertilisation', label: 'Fertilisation' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'desherbage', label: 'Désherbage' },
    { value: 'phytosanitaire', label: 'Phytosanitaire' },
    { value: 'recolte', label: 'Récolte' },
    { value: 'labour', label: 'Labour' },
    { value: 'reconnaissance', label: 'Reconnaissance' }
  ];

  const units = [
    { value: 'kg', label: 'Kilogrammes (kg)' },
    { value: 'l', label: 'Litres (l)' },
    { value: 'pieces', label: 'Pièces' },
    { value: 'other', label: 'Autre' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (operation) {
        setFormData({
          operation_type: operation.operation_type || '',
          operation_date: operation.operation_date || '',
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
        resetForm();
      }
    }
  }, [isOpen, operation]);

  const resetForm = () => {
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
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.operation_type) newErrors.operation_type = 'Le type d\'opération est requis';
    if (!formData.operation_date) newErrors.operation_date = 'La date est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const operationData = {
        ...formData,
        crop_id: 'crop-placeholder', // This should come from the selected crop
        plot_id: 'plot-placeholder', // This should come from the selected plot
        performer_id: 'current-user-id', // This should come from auth context
        dose_per_hectare: formData.dose_per_hectare ? parseFloat(formData.dose_per_hectare) : undefined,
        total_dose: formData.total_dose ? parseFloat(formData.total_dose) : undefined,
        cost_per_hectare: formData.cost_per_hectare ? parseFloat(formData.cost_per_hectare) : undefined,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : undefined
      };

      let savedOperation: Operation;
      if (operation) {
        savedOperation = await OperationsRpcService.updateOperation(operation.id, operationData);
      } else {
        savedOperation = await OperationsRpcService.createOperation(operationData);
      }

      onSave(savedOperation);
      onClose();
    } catch (error) {
      console.error('Error saving operation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            {operation ? 'Modifier l\'opération' : 'Nouvelle opération'}
          </DialogTitle>
          <DialogDescription>
            {operation ? 'Modifiez les informations de l\'opération' : 'Enregistrez une nouvelle opération agricole'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="operation_type">Type d'opération *</Label>
                    <Select
                      value={formData.operation_type}
                      onValueChange={(value) => handleInputChange('operation_type', value)}
                    >
                      <SelectTrigger className={errors.operation_type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {operationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.operation_type && <p className="text-sm text-red-500 mt-1">{errors.operation_type}</p>}
                  </div>

                  <div>
                    <Label htmlFor="operation_date">Date *</Label>
                    <Input
                      id="operation_date"
                      type="date"
                      value={formData.operation_date}
                      onChange={(e) => handleInputChange('operation_date', e.target.value)}
                      className={errors.operation_date ? 'border-red-500' : ''}
                    />
                    {errors.operation_date && <p className="text-sm text-red-500 mt-1">{errors.operation_date}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Décrivez l'opération effectuée..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Produit et doses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PackageIcon className="h-5 w-5" />
                  Produit et doses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product_used">Produit utilisé</Label>
                  <Input
                    id="product_used"
                    value={formData.product_used}
                    onChange={(e) => handleInputChange('product_used', e.target.value)}
                    placeholder="Ex: Graines de maïs, Engrais NPK..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dose_per_hectare">Dose par hectare</Label>
                    <Input
                      id="dose_per_hectare"
                      type="number"
                      step="0.01"
                      value={formData.dose_per_hectare}
                      onChange={(e) => handleInputChange('dose_per_hectare', e.target.value)}
                      placeholder="Ex: 25"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_dose">Dose totale</Label>
                    <Input
                      id="total_dose"
                      type="number"
                      step="0.01"
                      value={formData.total_dose}
                      onChange={(e) => handleInputChange('total_dose', e.target.value)}
                      placeholder="Ex: 75"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unité</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => handleInputChange('unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coûts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSignIcon className="h-5 w-5" />
                  Coûts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_per_hectare">Coût par hectare (FCFA)</Label>
                    <Input
                      id="cost_per_hectare"
                      type="number"
                      step="0.01"
                      value={formData.cost_per_hectare}
                      onChange={(e) => handleInputChange('cost_per_hectare', e.target.value)}
                      placeholder="Ex: 15000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_cost">Coût total (FCFA)</Label>
                    <Input
                      id="total_cost"
                      type="number"
                      step="0.01"
                      value={formData.total_cost}
                      onChange={(e) => handleInputChange('total_cost', e.target.value)}
                      placeholder="Ex: 45000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Notes et observations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Ajoutez des notes ou observations sur l'opération..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement...' : (operation ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OperationModal;
