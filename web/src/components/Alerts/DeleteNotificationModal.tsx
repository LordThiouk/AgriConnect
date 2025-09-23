import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertsService } from '../../services/alertsService';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface DeleteNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification: any;
}

export default function DeleteNotificationModal({ isOpen, onClose, onSuccess, notification }: DeleteNotificationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!notification) return;

    setLoading(true);
    try {
      await AlertsService.deleteNotification(notification.id);
      toast.success('Notification supprimée avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erreur lors de la suppression de la notification');
    } finally {
      setLoading(false);
    }
  };

  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            {React.createElement(AlertTriangle, { className: "h-5 w-5" })}
            Supprimer la notification
          </DialogTitle>
          <DialogDescription>
            Cette action supprimera définitivement la notification de la base de données.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer cette notification ?
          </p>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-gray-500">{notification.channel}</p>
          </div>

          <p className="text-sm text-red-600">
            Cette action est irréversible.
          </p>

        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
