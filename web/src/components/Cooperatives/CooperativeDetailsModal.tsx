import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Cooperative } from '../../types';
import { Building2Icon, MapPinIcon, PhoneIcon, MailIcon, UserIcon, CalendarIcon } from 'lucide-react';

interface CooperativeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cooperative: Cooperative | null;
}

export default function CooperativeDetailsModal({
  isOpen,
  onClose,
  cooperative
}: CooperativeDetailsModalProps) {
  if (!cooperative) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2Icon className="h-5 w-5 text-blue-600" />
            {cooperative.name}
          </DialogTitle>
          <DialogDescription>
            Détails complets de la coopérative {cooperative.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Localisation</span>
              </div>
              <p className="text-sm text-gray-700">
                {cooperative.commune}, {cooperative.department}, {cooperative.region}
              </p>
              {cooperative.address && (
                <p className="text-sm text-gray-600">{cooperative.address}</p>
              )}
              {cooperative.latitude && cooperative.longitude && (
                <p className="text-xs text-gray-500">
                  Coordonnées: {cooperative.latitude.toFixed(4)}, {cooperative.longitude.toFixed(4)}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Contact</span>
              </div>
              {cooperative.phone && (
                <p className="text-sm text-gray-700">{cooperative.phone}</p>
              )}
              {cooperative.email && (
                <p className="text-sm text-gray-700">{cooperative.email}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {cooperative.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-700">{cooperative.description}</p>
            </div>
          )}

          {/* Président */}
          {cooperative.president_name && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Président</span>
              </div>
              <p className="text-sm text-gray-700">{cooperative.president_name}</p>
              {cooperative.president_phone && (
                <p className="text-sm text-gray-600">{cooperative.president_phone}</p>
              )}
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{cooperative.producer_count || 0}</p>
              <p className="text-xs text-blue-600">Producteurs</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{cooperative.member_count || 0}</p>
              <p className="text-xs text-green-600">Membres</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Badge variant={cooperative.is_active ? "default" : "secondary"}>
                {cooperative.is_active ? "Active" : "Inactive"}
              </Badge>
              <p className="text-xs text-purple-600 mt-1">Statut</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-orange-600 mx-auto" />
              <p className="text-xs text-orange-600 mt-1">Créée</p>
              <p className="text-xs text-orange-600">
                {new Date(cooperative.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}