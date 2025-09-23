import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Cooperative } from '../../types';
import { Building2, MapPin, Phone, Mail, User, Calendar } from 'lucide-react';
import { CooperativesService } from '../../services/cooperativesService';
import { IconWrapper } from '../ui/IconWrapper';

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
  const [producerCount, setProducerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cooperative) {
      fetchProducerCount();
    }
  }, [isOpen, cooperative]);

  const fetchProducerCount = async () => {
    if (!cooperative) return;
    
    setLoading(true);
    try {
      const result = await CooperativesService.getCooperativeProducers(cooperative.id, 1, 1);
      setProducerCount(result.total);
    } catch (error) {
      console.error('Error fetching producer count:', error);
      setProducerCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (!cooperative) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconWrapper icon={Building2} className="h-5 w-5 text-blue-600" />
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
                <IconWrapper icon={MapPin} className="h-4 w-4 text-gray-500" />
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
                <IconWrapper icon={Phone} className="h-4 w-4 text-gray-500" />
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
                <IconWrapper icon={User} className="h-4 w-4 text-gray-500" />
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
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-blue-200 rounded mb-1"></div>
                  <div className="h-4 bg-blue-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-blue-600">{producerCount}</p>
                  <p className="text-xs text-blue-600">Producteurs</p>
                </>
              )}
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-green-200 rounded mb-1"></div>
                  <div className="h-4 bg-green-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-green-600">{producerCount}</p>
                  <p className="text-xs text-green-600">Membres</p>
                </>
              )}
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <IconWrapper icon={Calendar} className="h-6 w-6 text-orange-600 mx-auto" />
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