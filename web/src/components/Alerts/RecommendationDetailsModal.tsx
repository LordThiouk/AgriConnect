import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { Recommendation } from '../../types';
import { Calendar, MapPin, User, Building, FileText, X } from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';
import { IconWrapper } from '../ui/IconWrapper';

interface RecommendationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation | null;
}

export default function RecommendationDetailsModal({
  isOpen,
  onClose,
  recommendation
}: RecommendationDetailsModalProps) {
  useModalFocus(isOpen);
  
  if (!recommendation) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'fertilisation': 'Fertilisation',
      'irrigation': 'Irrigation',
      'traitement': 'Traitement',
      'semis': 'Semis',
      'recolte': 'Récolte',
      'info': 'Information'
    };
    return types[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <IconWrapper icon={FileText} className="h-5 w-5" />
                Détails de la Recommandation
              </DialogTitle>
              <DialogDescription>
                Informations complètes sur cette recommandation, incluant son contenu, priorité et contexte.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              aria-label="Fermer"
            >
              <IconWrapper icon={X} className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec titre et badges */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">{recommendation.title}</h2>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={recommendation.priority} />
                <StatusBadge status={recommendation.status} />
                <Badge variant="outline">{getTypeLabel(recommendation.recommendation_type)}</Badge>
              </div>
            </div>
          </div>

          {/* Message principal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{recommendation.message}</p>
            </CardContent>
          </Card>

          {/* Informations contextuelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parcelle */}
            {recommendation.plot_name && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconWrapper icon={MapPin} className="h-4 w-4" />
                    Parcelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{recommendation.plot_name}</p>
                  {recommendation.plot_area_hectares && (
                    <p className="text-sm text-gray-600">
                      {recommendation.plot_area_hectares} hectares
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Producteur */}
            {recommendation.producer_name && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconWrapper icon={User} className="h-4 w-4" />
                    Producteur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{recommendation.producer_name}</p>
                  {recommendation.cooperative_name && (
                    <p className="text-sm text-gray-600">{recommendation.cooperative_name}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informations techniques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Règle métier */}
            {recommendation.rule_code && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Règle Métier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm">{recommendation.rule_code}</p>
                  {recommendation.rule_name && (
                    <p className="text-sm text-gray-600 mt-1">{recommendation.rule_name}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconWrapper icon={Calendar} className="h-4 w-4" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div>
                  <p className="text-xs text-gray-500">Créée le</p>
                  <p className="text-sm font-medium">{formatDate(recommendation.created_at)}</p>
                </div>
                {recommendation.updated_at && recommendation.updated_at !== recommendation.created_at && (
                  <div>
                    <p className="text-xs text-gray-500">Modifiée le</p>
                    <p className="text-sm font-medium">{formatDate(recommendation.updated_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Identifiants techniques */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Identifiants Techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">ID Recommandation:</span>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                    {recommendation.id}
                  </p>
                </div>
                {recommendation.plot_id && (
                  <div>
                    <span className="text-gray-500">ID Parcelle:</span>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                      {recommendation.plot_id}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bouton de fermeture */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
