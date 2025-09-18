import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MapPin,
  Package,
  DollarSign,
  User
} from 'lucide-react';
import { OperationsRpcService } from '../../services/operationsRpcService';
import { Operation } from '../../types';
import OperationModal from './OperationModal';

// Type assertions pour résoudre le conflit de types
const ActivityIcon = Activity as any;
const PlusIcon = Plus as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const EyeIcon = Eye as any;
const CalendarIcon = Calendar as any;
const MapPinIcon = MapPin as any;
const PackageIcon = Package as any;
const DollarSignIcon = DollarSign as any;
const UserIcon = User as any;

interface OperationsSectionProps {
  producerId: string;
  producerName: string;
}

const OperationsSection: React.FC<OperationsSectionProps> = ({ producerId, producerName }) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);

  useEffect(() => {
    fetchOperations();
  }, [producerId]);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pour l'instant, on récupère toutes les opérations
      // Dans une vraie implémentation, on filtrerait par producer_id via les parcelles
      const result = await OperationsRpcService.getOperations({}, { page: 1, limit: 50 }, producerId);
      setOperations(result.data);
    } catch (err) {
      console.error('Error fetching operations:', err);
      setError('Erreur lors du chargement des opérations');
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

  const getOperationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'semis': 'Semis',
      'fertilisation': 'Fertilisation',
      'irrigation': 'Irrigation',
      'desherbage': 'Désherbage',
      'phytosanitaire': 'Phytosanitaire',
      'recolte': 'Récolte',
      'labour': 'Labour',
      'reconnaissance': 'Reconnaissance'
    };
    return labels[type] || type;
  };

  const getOperationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'semis': 'bg-blue-100 text-blue-800',
      'fertilisation': 'bg-green-100 text-green-800',
      'irrigation': 'bg-cyan-100 text-cyan-800',
      'desherbage': 'bg-yellow-100 text-yellow-800',
      'phytosanitaire': 'bg-red-100 text-red-800',
      'recolte': 'bg-orange-100 text-orange-800',
      'labour': 'bg-purple-100 text-purple-800',
      'reconnaissance': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleCreate = () => {
    setSelectedOperation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (operation: Operation) => {
    setSelectedOperation(operation);
    setIsModalOpen(true);
  };

  const handleView = (operation: Operation) => {
    setSelectedOperation(operation);
    setIsModalOpen(true);
  };

  const handleDelete = async (operation: Operation) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
      try {
        await OperationsRpcService.deleteOperation(operation.id);
        await fetchOperations();
      } catch (error) {
        console.error('Error deleting operation:', error);
      }
    }
  };

  const handleSave = async (operation: Operation) => {
    await fetchOperations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Chargement des opérations...</div>
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
        <h3 className="text-lg font-medium">Opérations agricoles</h3>
        <Button size="sm" className="flex items-center gap-2" onClick={handleCreate}>
          <PlusIcon className="h-4 w-4" />
          Nouvelle opération
        </Button>
      </div>

      {/* Liste des opérations */}
      {operations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ActivityIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 mb-2">Aucune opération enregistrée</p>
            <p className="text-xs text-gray-400">Enregistrez la première opération pour {producerName}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {operations.map((operation) => (
            <Card key={operation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4" />
                      {getOperationTypeLabel(operation.operation_type)}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(operation.operation_date)}
                      </div>
                      {operation.plot && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          {operation.plot.name}
                        </div>
                      )}
                      {operation.crop && (
                        <div className="flex items-center gap-1">
                          <PackageIcon className="h-3 w-3" />
                          {operation.crop.crop_type} - {operation.crop.variety}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getOperationTypeColor(operation.operation_type)}>
                      {getOperationTypeLabel(operation.operation_type)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleView(operation)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(operation)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(operation)}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {operation.description && (
                  <p className="text-sm text-gray-600 mb-3">{operation.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {operation.product_used && (
                    <div>
                      <span className="text-gray-500">Produit utilisé:</span>
                      <span className="ml-2">{operation.product_used}</span>
                    </div>
                  )}
                  {operation.dose_per_hectare && (
                    <div>
                      <span className="text-gray-500">Dose/ha:</span>
                      <span className="ml-2">{operation.dose_per_hectare} {operation.unit}</span>
                    </div>
                  )}
                  {operation.total_dose && (
                    <div>
                      <span className="text-gray-500">Dose totale:</span>
                      <span className="ml-2">{operation.total_dose} {operation.unit}</span>
                    </div>
                  )}
                  {operation.total_cost && (
                    <div>
                      <span className="text-gray-500">Coût total:</span>
                      <span className="ml-2 flex items-center gap-1">
                        <DollarSignIcon className="h-3 w-3" />
                        {operation.total_cost.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>

      {operation.performer_id && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="h-3 w-3 text-gray-500" />
            <span className="text-gray-500">Effectué par:</span>
            <span>Agent ID: {operation.performer_id}</span>
          </div>
        </div>
      )}

                {operation.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {operation.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      <OperationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        operation={selectedOperation}
        producerId={producerId}
      />
    </div>
  );
};

export default OperationsSection;
