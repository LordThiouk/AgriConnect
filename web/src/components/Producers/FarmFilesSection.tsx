import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MapPin,
  Building2,
  User
} from 'lucide-react';
import { FarmFilesService, FarmFile } from '../../services/farmFilesService';
import FarmFileModal from './FarmFileModal';

// Type assertions pour résoudre le conflit de types
const FileTextIcon = FileText as any;
const PlusIcon = Plus as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const EyeIcon = Eye as any;
const CalendarIcon = Calendar as any;
const MapPinIcon = MapPin as any;
const Building2Icon = Building2 as any;
const UserIcon = User as any;

interface FarmFilesSectionProps {
  producerId: string;
  producerName: string;
}

const FarmFilesSection: React.FC<FarmFilesSectionProps> = ({ producerId, producerName }) => {
  const [farmFiles, setFarmFiles] = useState<FarmFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFarmFile, setSelectedFarmFile] = useState<FarmFile | null>(null);

  useEffect(() => {
    fetchFarmFiles();
  }, [producerId]);

  const fetchFarmFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pour l'instant, on récupère toutes les fiches
      // Dans une vraie implémentation, on filtrerait par producer_id
      const result = await FarmFilesService.getFarmFiles({}, { page: 1, limit: 50 });
      setFarmFiles(result.data);
    } catch (err) {
      console.error('Error fetching farm files:', err);
      setError('Erreur lors du chargement des fiches');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Brouillon</Badge>;
      case 'validated':
        return <Badge variant="default" className="bg-green-100 text-green-800">Validée</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const handleCreate = () => {
    setSelectedFarmFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (farmFile: FarmFile) => {
    setSelectedFarmFile(farmFile);
    setIsModalOpen(true);
  };

  const handleView = (farmFile: FarmFile) => {
    setSelectedFarmFile(farmFile);
    setIsModalOpen(true);
  };

  const handleDelete = async (farmFile: FarmFile) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) {
      try {
        await FarmFilesService.deleteFarmFile(farmFile.id);
        await fetchFarmFiles();
      } catch (error) {
        console.error('Error deleting farm file:', error);
      }
    }
  };

  const handleSave = async (farmFile: FarmFile) => {
    await fetchFarmFiles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Chargement des fiches...</div>
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
        <h3 className="text-lg font-medium">Fiches d'exploitation</h3>
        <Button size="sm" className="flex items-center gap-2" onClick={handleCreate}>
          <PlusIcon className="h-4 w-4" />
          Nouvelle fiche
        </Button>
      </div>

      {/* Liste des fiches */}
      {farmFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileTextIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 mb-2">Aucune fiche d'exploitation</p>
            <p className="text-xs text-gray-400">Créez la première fiche pour {producerName}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {farmFiles.map((farmFile) => (
            <Card key={farmFile.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4" />
                      {farmFile.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {farmFile.village}, {farmFile.commune}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(farmFile.census_date)}
                      </div>
                      {farmFile.cooperative && (
                        <div className="flex items-center gap-1">
                          <Building2Icon className="h-3 w-3" />
                          {farmFile.cooperative.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(farmFile.status)}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleView(farmFile)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(farmFile)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(farmFile)}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Secteur:</span>
                    <span className="ml-2">{farmFile.sector}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">GPC:</span>
                    <span className="ml-2">{farmFile.gpc || 'Non défini'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Parcelles:</span>
                    <span className="ml-2">{farmFile.plots_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Complétion:</span>
                    <span className="ml-2">{farmFile.completion_percentage || 0}%</span>
                  </div>
                </div>
                {farmFile.responsible_producer && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <UserIcon className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-500">Producteur responsable:</span>
                      <span>{farmFile.responsible_producer.first_name} {farmFile.responsible_producer.last_name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      <FarmFileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        farmFile={selectedFarmFile}
        producerId={producerId}
      />
    </div>
  );
};

export default FarmFilesSection;
