import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Eye, 
  Calendar, 
  MapPin, 
  Package, 
  AlertTriangle,
  TrendingUp,
  User
} from 'lucide-react';
import { ObservationsRpcService } from '../../services/observationsRpcService';
import { Observation } from '../../types';

// Type assertions pour résoudre le conflit de types
const EyeIcon = Eye as any;
const CalendarIcon = Calendar as any;
const MapPinIcon = MapPin as any;
const PackageIcon = Package as any;
const AlertTriangleIcon = AlertTriangle as any;
const TrendingUpIcon = TrendingUp as any;
const UserIcon = User as any;

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (observation: Observation) => void;
  observation?: Observation | null;
  producerId?: string;
}

const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  observation,
  producerId
}) => {
  const [formData, setFormData] = useState({
    observation_type: '',
    observation_date: '',
    emergence_percent: '',
    pest_disease_name: '',
    severity: '',
    affected_area_percent: '',
    description: '',
    recommendations: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const observationTypes = [
    { value: 'levée', label: 'Levée' },
    { value: 'maladie', label: 'Maladie' },
    { value: 'ravageur', label: 'Ravageur' },
    { value: 'stress_hydrique', label: 'Stress hydrique' },
    { value: 'stress_nutritionnel', label: 'Stress nutritionnel' },
    { value: 'développement', label: 'Développement' },
    { value: 'other', label: 'Autre' }
  ];

  const severityLevels = [
    { value: '1', label: '1 - Faible' },
    { value: '2', label: '2 - Modéré' },
    { value: '3', label: '3 - Élevé' },
    { value: '4', label: '4 - Critique' },
    { value: '5', label: '5 - Urgent' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (observation) {
        setFormData({
          observation_type: observation.observation_type || '',
          observation_date: observation.observation_date || '',
          emergence_percent: observation.emergence_percent?.toString() || '',
          pest_disease_name: observation.pest_disease_name || '',
          severity: observation.severity?.toString() || '',
          affected_area_percent: observation.affected_area_percent?.toString() || '',
          description: observation.description || '',
          recommendations: observation.recommendations || ''
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, observation]);

  const resetForm = () => {
    setFormData({
      observation_type: '',
      observation_date: '',
      emergence_percent: '',
      pest_disease_name: '',
      severity: '',
      affected_area_percent: '',
      description: '',
      recommendations: ''
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

    if (!formData.observation_type) newErrors.observation_type = 'Le type d\'observation est requis';
    if (!formData.observation_date) newErrors.observation_date = 'La date est requise';

    // Validate emergence_percent if provided
    if (formData.emergence_percent) {
      const percent = parseFloat(formData.emergence_percent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        newErrors.emergence_percent = 'Le pourcentage doit être entre 0 et 100';
      }
    }

    // Validate affected_area_percent if provided
    if (formData.affected_area_percent) {
      const percent = parseFloat(formData.affected_area_percent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        newErrors.affected_area_percent = 'Le pourcentage doit être entre 0 et 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const observationData = {
        ...formData,
        crop_id: 'crop-placeholder', // This should come from the selected crop
        plot_id: 'plot-placeholder', // This should come from the selected plot
        observed_by: 'current-user-id', // This should come from auth context
        emergence_percent: formData.emergence_percent ? parseInt(formData.emergence_percent) : undefined,
        severity: formData.severity ? parseInt(formData.severity) : undefined,
        affected_area_percent: formData.affected_area_percent ? parseFloat(formData.affected_area_percent) : undefined
      };

      let savedObservation: Observation;
      if (observation) {
        savedObservation = await ObservationsRpcService.updateObservation(observation.id, observationData);
      } else {
        savedObservation = await ObservationsRpcService.createObservation(observationData);
      }

      onSave(savedObservation);
      onClose();
    } catch (error) {
      console.error('Error saving observation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getObservationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'levée': 'text-green-600',
      'maladie': 'text-red-600',
      'ravageur': 'text-orange-600',
      'stress_hydrique': 'text-blue-600',
      'stress_nutritionnel': 'text-yellow-600',
      'développement': 'text-purple-600',
      'other': 'text-gray-600'
    };
    return colors[type] || 'text-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeIcon className="h-5 w-5" />
            {observation ? 'Modifier l\'observation' : 'Nouvelle observation'}
          </DialogTitle>
          <DialogDescription>
            {observation ? 'Modifiez les informations de l\'observation' : 'Enregistrez une nouvelle observation terrain'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <EyeIcon className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="observation_type">Type d'observation *</Label>
                    <Select
                      value={formData.observation_type}
                      onValueChange={(value) => handleInputChange('observation_type', value)}
                    >
                      <SelectTrigger className={errors.observation_type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {observationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className={getObservationTypeColor(type.value)}>
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.observation_type && <p className="text-sm text-red-500 mt-1">{errors.observation_type}</p>}
                  </div>

                  <div>
                    <Label htmlFor="observation_date">Date *</Label>
                    <Input
                      id="observation_date"
                      type="date"
                      value={formData.observation_date}
                      onChange={(e) => handleInputChange('observation_date', e.target.value)}
                      className={errors.observation_date ? 'border-red-500' : ''}
                    />
                    {errors.observation_date && <p className="text-sm text-red-500 mt-1">{errors.observation_date}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Décrivez ce que vous avez observé..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Levée */}
            {formData.observation_type === 'levée' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5" />
                    Informations sur la levée
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="emergence_percent">Pourcentage de levée (%)</Label>
                    <Input
                      id="emergence_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.emergence_percent}
                      onChange={(e) => handleInputChange('emergence_percent', e.target.value)}
                      placeholder="Ex: 85"
                      className={errors.emergence_percent ? 'border-red-500' : ''}
                    />
                    {errors.emergence_percent && <p className="text-sm text-red-500 mt-1">{errors.emergence_percent}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Maladie ou Ravageur */}
            {(formData.observation_type === 'maladie' || formData.observation_type === 'ravageur') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangleIcon className="h-5 w-5" />
                    Détails de la {formData.observation_type === 'maladie' ? 'maladie' : 'ravageur'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="pest_disease_name">
                      Nom de la {formData.observation_type === 'maladie' ? 'maladie' : 'ravageur'}
                    </Label>
                    <Input
                      id="pest_disease_name"
                      value={formData.pest_disease_name}
                      onChange={(e) => handleInputChange('pest_disease_name', e.target.value)}
                      placeholder={`Ex: ${formData.observation_type === 'maladie' ? 'Rouille du maïs' : 'Criquet pèlerin'}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="severity">Gravité</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) => handleInputChange('severity', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la gravité" />
                        </SelectTrigger>
                        <SelectContent>
                          {severityLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="affected_area_percent">Zone affectée (%)</Label>
                      <Input
                        id="affected_area_percent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.affected_area_percent}
                        onChange={(e) => handleInputChange('affected_area_percent', e.target.value)}
                        placeholder="Ex: 15.5"
                        className={errors.affected_area_percent ? 'border-red-500' : ''}
                      />
                      {errors.affected_area_percent && <p className="text-sm text-red-500 mt-1">{errors.affected_area_percent}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommandations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="recommendations">Recommandations</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => handleInputChange('recommendations', e.target.value)}
                    placeholder="Ajoutez vos recommandations pour traiter cette observation..."
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
            {loading ? 'Enregistrement...' : (observation ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ObservationModal;
