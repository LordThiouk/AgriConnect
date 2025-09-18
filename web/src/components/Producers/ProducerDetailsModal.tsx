import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Users, 
  Building2, 
  FileText, 
  Map, 
  Activity, 
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Clock
} from 'lucide-react';
import { Producer } from '../../services/producersService';
import FarmFilesSection from './FarmFilesSection';
import OperationsSection from './OperationsSection';
import ObservationsSection from './ObservationsSection';

// Type assertions pour résoudre le conflit de types
const UserIcon = User as any;
const PhoneIcon = Phone as any;
const MailIcon = Mail as any;
const MapPinIcon = MapPin as any;
const CalendarIcon = Calendar as any;
const GraduationCapIcon = GraduationCap as any;
const UsersIcon = Users as any;
const Building2Icon = Building2 as any;
const FileTextIcon = FileText as any;
const MapIcon = Map as any;
const ActivityIcon = Activity as any;
const EyeIcon = Eye as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;
const UserCheckIcon = UserCheck as any;
const ClockIcon = Clock as any;

interface ProducerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  producer: Producer | null;
  onEdit: (producer: Producer) => void;
  onDelete: () => void;
}

const ProducerDetailsModal: React.FC<ProducerDetailsModalProps> = ({
  isOpen,
  onClose,
  producer,
  onEdit,
  onDelete
}) => {
  if (!producer) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-100 text-red-800';
    if (severity >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {producer.first_name} {producer.last_name}
          </DialogTitle>
          <DialogDescription>
            Informations détaillées du producteur
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="fiches">Fiches</TabsTrigger>
              <TabsTrigger value="activites">Activités</TabsTrigger>
            </TabsList>

            {/* Informations générales */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informations personnelles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Informations personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{producer.phone}</span>
                    </div>
                    {producer.email && (
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{producer.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {producer.village && `${producer.village}, `}
                        {producer.commune}, {producer.department}, {producer.region}
                      </span>
                    </div>
                    {producer.address && (
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{producer.address}</span>
                      </div>
                    )}
                    {producer.birth_date && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Né le {formatDate(producer.birth_date)}
                        </span>
                      </div>
                    )}
                    {producer.gender && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm capitalize">{producer.gender}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informations agricoles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ActivityIcon className="h-5 w-5" />
                      Informations agricoles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {producer.education_level && (
                      <div className="flex items-center gap-2">
                        <GraduationCapIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{producer.education_level}</span>
                      </div>
                    )}
                    {producer.farming_experience_years && (
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {producer.farming_experience_years} ans d'expérience
                        </span>
                      </div>
                    )}
                    {producer.household_size && (
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {producer.household_size} personnes dans le ménage
                        </span>
                      </div>
                    )}
                    {producer.primary_language && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Langue principale: {producer.primary_language}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(producer.status)}>
                        {producer.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Coopérative */}
                {producer.cooperative && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2Icon className="h-5 w-5" />
                        Coopérative
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-medium">{producer.cooperative.name}</h4>
                        <p className="text-sm text-gray-600">{producer.cooperative.region}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Statistiques */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ActivityIcon className="h-5 w-5" />
                      Statistiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Parcelles:</span>
                      <span className="font-medium">{producer.plots_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Superficie totale:</span>
                      <span className="font-medium">{producer.total_area || 0} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fiches:</span>
                      <span className="font-medium">{producer.farm_files?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dernière visite:</span>
                      <span className="font-medium">
                        {producer.last_visit ? formatDate(producer.last_visit) : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Agents assignés */}
            <TabsContent value="agents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheckIcon className="h-5 w-5" />
                    Agents assignés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {producer.assigned_agents && producer.assigned_agents.length > 0 ? (
                    <div className="space-y-3">
                      {producer.assigned_agents.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{agent.display_name}</h4>
                              <p className="text-sm text-gray-600">{agent.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Assigné le {formatDate(agent.assigned_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucun agent assigné</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fiches */}
            <TabsContent value="fiches" className="space-y-4">
              <FarmFilesSection 
                producerId={producer.id} 
                producerName={`${producer.first_name} ${producer.last_name}`}
              />
            </TabsContent>

            {/* Activités récentes */}
            <TabsContent value="activites" className="space-y-6">
              <OperationsSection 
                producerId={producer.id} 
                producerName={`${producer.first_name} ${producer.last_name}`}
              />
              <ObservationsSection 
                producerId={producer.id} 
                producerName={`${producer.first_name} ${producer.last_name}`}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="outline"
            onClick={() => onEdit(producer)}
            className="flex items-center gap-2"
          >
            <EditIcon className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="flex items-center gap-2"
          >
            <Trash2Icon className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProducerDetailsModal;