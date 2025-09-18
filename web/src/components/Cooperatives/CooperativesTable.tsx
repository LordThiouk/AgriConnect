import React from 'react';
import { Cooperative } from '../../services/cooperativesService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Edit, 
  Eye, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Users,
  Building2,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Type assertions pour résoudre le conflit de types
const EditIcon = Edit as any;
const EyeIcon = Eye as any;
const Trash2Icon = Trash2 as any;
const MapPinIcon = MapPin as any;
const PhoneIcon = Phone as any;
const MailIcon = Mail as any;
const UsersIcon = Users as any;
const Building2Icon = Building2 as any;
const MoreHorizontalIcon = MoreHorizontal as any;

interface CooperativesTableProps {
  cooperatives: Cooperative[];
  loading: boolean;
  error: string | null;
  onEdit: (cooperative: Cooperative) => void;
  onView: (cooperative: Cooperative) => void;
  onViewProducers: (cooperative: Cooperative) => void;
  onDelete: (cooperative: Cooperative) => void;
}

const CooperativesTable: React.FC<CooperativesTableProps> = ({
  cooperatives,
  loading,
  error,
  onEdit,
  onView,
  onViewProducers,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement des coopératives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">
          <Building2Icon className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Erreur de chargement</p>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (cooperatives.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune coopérative trouvée</h3>
        <p className="text-gray-600">Commencez par créer votre première coopérative.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Coopérative
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Localisation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
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
          {cooperatives.map((cooperative) => (
            <tr key={cooperative.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {cooperative.name}
                    </div>
                    {cooperative.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {cooperative.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <div className="font-medium">{cooperative.commune}</div>
                    <div className="text-gray-500">
                      {cooperative.department}, {cooperative.region}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {cooperative.contact_person && (
                    <div className="flex items-center mb-1">
                      <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{cooperative.contact_person}</span>
                    </div>
                  )}
                  {cooperative.phone && (
                    <div className="flex items-center mb-1">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{cooperative.phone}</span>
                    </div>
                  )}
                  {cooperative.email && (
                    <div className="flex items-center">
                      <MailIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="truncate max-w-xs">{cooperative.email}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Actions pour la coopérative">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <DropdownMenuItem onClick={() => onView(cooperative)}>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewProducers(cooperative)}>
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Voir producteurs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(cooperative)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(cooperative)}
                      className="text-red-600"
                    >
                      <Trash2Icon className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {cooperatives.map((cooperative) => (
          <Card key={cooperative.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Building2Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{cooperative.name}</h3>
                  {cooperative.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cooperative.description}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                Active
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span>{cooperative.commune}, {cooperative.department}, {cooperative.region}</span>
              </div>
              
              {cooperative.contact_person && (
                <div className="flex items-center text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{cooperative.contact_person}</span>
                </div>
              )}
              
              {cooperative.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{cooperative.phone}</span>
                </div>
              )}
              
              {cooperative.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <MailIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="truncate">{cooperative.email}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(cooperative)}
                className="flex-1 flex items-center justify-center gap-1"
              >
                <EyeIcon className="h-3 w-3" />
                Voir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProducers(cooperative)}
                className="flex-1 flex items-center justify-center gap-1"
              >
                <UsersIcon className="h-3 w-3" />
                Producteurs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(cooperative)}
                className="flex-1 flex items-center justify-center gap-1"
              >
                <EditIcon className="h-3 w-3" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(cooperative)}
                className="flex-1 flex items-center justify-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2Icon className="h-3 w-3" />
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CooperativesTable;
