import React from 'react';
import { Eye, Download, Edit, Trash2, Users, FileText, MapPin, UserPlus } from 'lucide-react';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Producer } from '../../services/producersService';

// Type assertions pour résoudre le conflit de types
const EyeIcon = Eye as any;
const DownloadIcon = Download as any;
const EditIcon = Edit as any;
const TrashIcon = Trash2 as any;
const UsersIcon = Users as any;
const FileTextIcon = FileText as any;
const MapPinIcon = MapPin as any;
const UserPlusIcon = UserPlus as any;

interface ProducersTableProps {
  producers: Producer[];
  loading?: boolean;
  onView?: (producer: Producer) => void;
  onEdit?: (producer: Producer) => void;
  onDownload?: (producer: Producer) => void;
  onDelete?: (producer: Producer) => void;
  onManageAgents?: (producer: Producer) => void;
}

const ProducersTable: React.FC<ProducersTableProps> = ({
  producers,
  loading = false,
  onView,
  onEdit,
  onDownload,
  onDelete,
  onManageAgents
}) => {
  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    return phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5');
  };

  const formatLastVisit = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Il y a 1 jour';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 14) return 'Il y a 1 semaine';
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactif</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producteur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localisation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  Parcelles
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <UsersIcon className="h-4 w-4" />
                  Agents
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <FileTextIcon className="h-4 w-4" />
                  Fiches
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière visite
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : producers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  Aucun producteur trouvé
                </td>
              </tr>
            ) : (
              producers.map((producer) => (
                <tr key={producer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar
                        alt={`${producer.first_name} ${producer.last_name}`}
                        size="md"
                        className="mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {producer.first_name} {producer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {producer.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{formatPhoneNumber(producer.phone)}</div>
                      <div className="text-gray-500">{producer.email || 'Pas d\'email'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span>{producer.commune}, {producer.department}</span>
                    </div>
                    {producer.village && (
                      <div className="text-xs text-gray-500 mt-1">
                        {producer.village}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span>{producer.plots_count || 0}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {producer.total_area?.toFixed(1) || '0.0'} ha
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4 text-gray-400" />
                      <span>{producer.assigned_agents?.length || 0}</span>
                    </div>
                    {producer.assigned_agents && producer.assigned_agents.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {producer.assigned_agents[0].display_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <FileTextIcon className="h-4 w-4 text-gray-400" />
                      <span>{producer.farm_files_count || 0}</span>
                    </div>
                    {producer.farm_files && producer.farm_files.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {producer.farm_files[0].name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producer.last_visit ? formatLastVisit(producer.last_visit) : 'Jamais'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(producer.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(producer)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload?.(producer)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Télécharger"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(producer)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Modifier"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(producer)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageAgents?.(producer)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Gérer les agents"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Chargement...
          </div>
        ) : producers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucun producteur trouvé
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {producers.map((producer) => (
              <div key={producer.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* Header with Avatar and Name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Avatar
                      alt={`${producer.first_name} ${producer.last_name}`}
                      size="lg"
                      className="mr-3"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {producer.first_name} {producer.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {producer.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusBadge(producer.status)}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    {formatPhoneNumber(producer.phone)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {producer.email || 'Pas d\'email'}
                  </p>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span>{producer.commune}, {producer.department}</span>
                  </div>
                  {producer.village && (
                    <div className="text-xs text-gray-500 mt-1 ml-5">
                      {producer.village}
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center mb-1">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-xs text-gray-500">Parcelles</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {producer.plots_count || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {producer.total_area?.toFixed(1) || '0.0'} ha
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center mb-1">
                      <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-xs text-gray-500">Agents</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {producer.assigned_agents?.length || 0}
                    </p>
                    {producer.assigned_agents && producer.assigned_agents.length > 0 && (
                      <p className="text-xs text-gray-500 truncate">
                        {producer.assigned_agents[0].display_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center mb-1">
                      <FileTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-xs text-gray-500">Fiches</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {producer.farm_files_count || 0}
                    </p>
                    {producer.farm_files && producer.farm_files.length > 0 && (
                      <p className="text-xs text-gray-500 truncate">
                        {producer.farm_files[0].name}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-gray-500">Dernière visite</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {producer.last_visit ? formatLastVisit(producer.last_visit) : 'Jamais'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(producer)}
                    className="flex-1 min-w-0"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Voir</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(producer)}
                    className="flex-1 min-w-0"
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageAgents?.(producer)}
                    className="flex-1 min-w-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Agents</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload?.(producer)}
                    className="flex-1 min-w-0"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(producer)}
                    className="flex-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducersTable;