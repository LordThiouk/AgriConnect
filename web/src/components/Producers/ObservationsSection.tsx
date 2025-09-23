import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  Package,
  AlertTriangle,
  TrendingUp,
  User
} from 'lucide-react';
import { ObservationsRpcService } from '../../services/observationsRpcService';
import { Observation } from '../../types';
import ObservationModal from './ObservationModal';

// Type assertions pour résoudre le conflit de types
const EyeIcon = Eye as any;
const PlusIcon = Plus as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const CalendarIcon = Calendar as any;
const MapPinIcon = MapPin as any;
const PackageIcon = Package as any;
const AlertTriangleIcon = AlertTriangle as any;
const TrendingUpIcon = TrendingUp as any;
const UserIcon = User as any;

interface ObservationsSectionProps {
  producerId: string;
  producerName: string;
}

const ObservationsSection: React.FC<ObservationsSectionProps> = ({ producerId, producerName }) => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  useEffect(() => {
    fetchObservations();
  }, [producerId]);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pour l'instant, on récupère toutes les observations
      // Dans une vraie implémentation, on filtrerait par producer_id via les parcelles
      const result = await ObservationsRpcService.getObservations({}, { page: 1, limit: 50 }, producerId);
      setObservations(result.data);
    } catch (err) {
      console.error('Error fetching observations:', err);
      setError('Erreur lors du chargement des observations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getObservationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'levée': 'Levée',
      'maladie': 'Maladie',
      'ravageur': 'Ravageur',
      'stress_hydrique': 'Stress hydrique',
      'stress_nutritionnel': 'Stress nutritionnel',
      'développement': 'Développement',
      'other': 'Autre'
    };
    return labels[type] || type;
  };

  const getObservationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'levée': 'bg-green-100 text-green-800',
      'maladie': 'bg-red-100 text-red-800',
      'ravageur': 'bg-orange-100 text-orange-800',
      'stress_hydrique': 'bg-blue-100 text-blue-800',
      'stress_nutritionnel': 'bg-yellow-100 text-yellow-800',
      'développement': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-100 text-red-800';
    if (severity >= 3) return 'bg-orange-100 text-orange-800';
    if (severity >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSeverityLabel = (severity: number) => {
    const labels = ['', 'Faible', 'Modéré', 'Élevé', 'Critique', 'Urgent'];
    return labels[severity] || 'Inconnu';
  };

  const handleCreate = () => {
    setSelectedObservation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (observation: Observation) => {
    setSelectedObservation(observation);
    setIsModalOpen(true);
  };

  const handleView = (observation: Observation) => {
    setSelectedObservation(observation);
    setIsModalOpen(true);
  };

  const handleDelete = async (observation: Observation) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette observation ?')) {
      try {
        await ObservationsRpcService.deleteObservation(observation.id);
        await fetchObservations();
      } catch (error) {
        console.error('Error deleting observation:', error);
      }
    }
  };

  const handleSave = async (observation: Observation) => {
    await fetchObservations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Chargement des observations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Observations terrain</h3>
        <Button size="sm" className="flex items-center gap-2" onClick={handleCreate}>
          <PlusIcon className="h-4 w-4" />
          Nouvelle observation
        </Button>
      </div>

      {/* Liste des observations */}
      {observations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <EyeIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 mb-2">Aucune observation enregistrée</p>
            <p className="text-xs text-gray-400">Enregistrez la première observation pour {producerName}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {observations.map((observation) => (
            <Card key={observation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <EyeIcon className="h-4 w-4" />
                      {getObservationTypeLabel(observation.observation_type)}
                      {observation.pest_disease_name && (
                        <span className="text-sm text-gray-500">- {observation.pest_disease_name}</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(observation.observation_date)}
                      </div>
                      {observation.plot && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          {observation.plot.name}
                        </div>
                      )}
                      {observation.crop && (
                        <div className="flex items-center gap-1">
                          <PackageIcon className="h-3 w-3" />
                          {observation.crop.crop_type} - {observation.crop.variety}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getObservationTypeColor(observation.observation_type)}>
                      {getObservationTypeLabel(observation.observation_type)}
                    </Badge>
                    {observation.severity && (
                      <Badge className={getSeverityColor(observation.severity)}>
                        {getSeverityLabel(observation.severity)}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleView(observation)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(observation)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(observation)}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {observation.description && (
                  <p className="text-sm text-gray-600 mb-3">{observation.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {observation.emergence_percent !== undefined && (
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-500">Levée:</span>
                      <span>{observation.emergence_percent}%</span>
                    </div>
                  )}
                  {observation.affected_area_percent !== undefined && (
                    <div className="flex items-center gap-2">
                      <AlertTriangleIcon className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-500">Zone affectée:</span>
                      <span>{observation.affected_area_percent}%</span>
                    </div>
                  )}
                </div>

                {observation.recommendations && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Recommandations:</span> {observation.recommendations}
                    </p>
                  </div>
                )}

                {(observation as any).agent_name && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <UserIcon className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-500">Observé par:</span>
                      <span className="font-medium">{(observation as any).agent_name}</span>
                      {(observation as any).agent_phone && (
                        <span className="text-gray-500">- {(observation as any).agent_phone}</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      <ObservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        observation={selectedObservation}
        producerId={producerId}
      />
    </div>
  );
};

export default ObservationsSection;
