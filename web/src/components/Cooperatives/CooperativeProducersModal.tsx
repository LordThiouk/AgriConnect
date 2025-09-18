import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Cooperative } from '../../types';
import { UsersIcon, PhoneIcon, MapPinIcon, MailIcon, CalendarIcon } from 'lucide-react';
import { CooperativesService } from '../../services/cooperativesService';

interface Producer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  region?: string;
  department?: string;
  commune?: string;
  created_at: string;
}

interface CooperativeProducersModalProps {
  isOpen: boolean;
  onClose: () => void;
  cooperative: Cooperative | null;
}

export default function CooperativeProducersModal({
  isOpen,
  onClose,
  cooperative
}: CooperativeProducersModalProps) {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cooperative) {
      fetchProducers();
    }
  }, [isOpen, cooperative]);

  const fetchProducers = async () => {
    if (!cooperative) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await CooperativesService.getCooperativeProducers(cooperative.id, 1, 100);
      setProducers(result.data);
    } catch (error) {
      console.error('Error fetching producers:', error);
      setError('Erreur lors du chargement des producteurs');
    } finally {
      setLoading(false);
    }
  };

  if (!cooperative) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-green-600" />
            Producteurs de {cooperative.name}
            {!loading && !error && (
              <Badge variant="secondary" className="ml-2">
                {producers.length} producteur{producers.length > 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Liste des producteurs affiliés à cette coopérative
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement des producteurs...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Erreur de chargement</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchProducers}>
                Réessayer
              </Button>
            </div>
          ) : producers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun producteur</h3>
              <p className="text-gray-600">
                Cette coopérative n'a pas encore de producteurs affiliés.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {producers.map((producer) => (
                <Card key={producer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {producer.first_name} {producer.last_name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          ID: {producer.id.slice(0, 8)}...
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {producer.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{producer.phone}</span>
                        </div>
                      )}
                      
                      {producer.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MailIcon className="h-4 w-4" />
                          <span className="truncate">{producer.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{producer.commune}, {producer.department}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Inscrit le {new Date(producer.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}