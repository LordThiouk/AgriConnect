import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import StatusBadge from './StatusBadge';
import { X } from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';
import { IconWrapper } from '../ui/IconWrapper';

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: any;
}

export default function NotificationDetailsModal({ isOpen, onClose, notification }: NotificationDetailsModalProps) {
  useModalFocus(isOpen);
  
  if (!notification) return null;

  const getChannelLabel = (channel: string) => {
    const labels: { [key: string]: string } = {
      'sms': 'SMS',
      'email': 'Email',
      'push': 'Push Notification',
      'whatsapp': 'WhatsApp'
    };
    return labels[channel] || channel;
  };

  const getChannelBadgeVariant = (channel: string) => {
    const variants = {
      'sms': 'default' as const,
      'email': 'secondary' as const,
      'push': 'outline' as const,
      'whatsapp': 'default' as const
    };
    return variants[channel as keyof typeof variants] || 'default' as const;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Détails de la notification
                <StatusBadge status={notification.status} />
              </DialogTitle>
              <DialogDescription>
                Informations complètes sur cette notification, incluant son contenu, destinataire et historique.
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
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-sm">{notification.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Canal</label>
                  <div className="mt-1">
                    <Badge variant={getChannelBadgeVariant(notification.channel)}>
                      {getChannelLabel(notification.channel)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">
                    <StatusBadge status={notification.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fournisseur</label>
                  <p className="text-sm">{notification.provider || 'Non défini'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenu */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Titre</label>
                <p className="text-sm font-medium mt-1">{notification.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Message</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{notification.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Destinataire */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Destinataire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom du destinataire</label>
                  <p className="text-sm">{notification.recipient_name || 'Non défini'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom de l'expéditeur</label>
                  <p className="text-sm">{notification.sender_name || 'Système'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates et métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dates et métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Créée le</label>
                  <p className="text-sm">{new Date(notification.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Envoyée le</label>
                  <p className="text-sm">
                    {notification.sent_at 
                      ? new Date(notification.sent_at).toLocaleString('fr-FR')
                      : 'Non envoyée'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Livrée le</label>
                  <p className="text-sm">
                    {notification.delivered_at 
                      ? new Date(notification.delivered_at).toLocaleString('fr-FR')
                      : 'Non livrée'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mise à jour le</label>
                  <p className="text-sm">{new Date(notification.updated_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
              
              {notification.error_message && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Message d'erreur</label>
                  <p className="text-sm text-red-600 mt-1">{notification.error_message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
