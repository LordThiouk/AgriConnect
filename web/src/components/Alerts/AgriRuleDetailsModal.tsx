import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import SeverityBadge from './SeverityBadge';
import { AgriRule } from '../../types';
import { Calendar, Code, Database, X } from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';
import { IconWrapper } from '../ui/IconWrapper';

interface AgriRuleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agriRule: AgriRule | null;
}

export default function AgriRuleDetailsModal({
  isOpen,
  onClose,
  agriRule
}: AgriRuleDetailsModalProps) {
  useModalFocus(isOpen);
  
  if (!agriRule) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'notification': 'Notification',
      'alert': 'Alerte',
      'recommendation': 'Recommandation',
      'blocking': 'Blocage'
    };
    return types[type] || type;
  };

  const renderArray = (arr: any, fallback: string = 'Aucun') => {
    if (!arr || (Array.isArray(arr) && arr.length === 0)) {
      return <span className="text-gray-500">{fallback}</span>;
    }
    
    const items = Array.isArray(arr) ? arr : [arr];
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <IconWrapper icon={Code} className="h-5 w-5" />
                Détails de la Règle Métier
              </DialogTitle>
              <DialogDescription>
                Informations complètes sur cette règle métier, incluant ses conditions et actions.
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
          {/* En-tête avec nom et badges */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">{agriRule.name}</h2>
              <div className="flex items-center gap-2 mb-2">
                <SeverityBadge severity={agriRule.severity} />
                <Badge variant={agriRule.is_active ? "default" : "secondary"}>
                  {agriRule.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{getActionTypeLabel(agriRule.action_type)}</Badge>
              </div>
              <p className="text-sm text-gray-600 font-mono">{agriRule.code}</p>
            </div>
          </div>

          {/* Description */}
          {agriRule.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{agriRule.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Condition SQL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconWrapper icon={Database} className="h-5 w-5" />
                Condition SQL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {agriRule.condition_sql}
              </pre>
            </CardContent>
          </Card>

          {/* Message d'action */}
          {agriRule.action_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconWrapper icon={Database} className="h-5 w-5" />
                  Message d'Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{agriRule.action_message}</p>
              </CardContent>
            </Card>
          )}

          {/* Portée d'application */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cultures applicables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconWrapper icon={Calendar} className="h-4 w-4" />
                  Cultures Applicables
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderArray(agriRule.applicable_crops, 'Toutes les cultures')}
              </CardContent>
            </Card>

            {/* Régions applicables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconWrapper icon={Calendar} className="h-4 w-4" />
                  Régions Applicables
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderArray(agriRule.applicable_regions, 'Toutes les régions')}
              </CardContent>
            </Card>
          </div>

          {/* Informations techniques */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconWrapper icon={Calendar} className="h-4 w-4" />
                Informations Techniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Créée le</p>
                  <p className="font-medium">{formatDate(agriRule.created_at)}</p>
                </div>
                {agriRule.updated_at && (
                  <div>
                    <p className="text-gray-500">Modifiée le</p>
                    <p className="font-medium">{formatDate(agriRule.updated_at)}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <p className="text-gray-500">ID de la Règle</p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                  {agriRule.id}
                </p>
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
