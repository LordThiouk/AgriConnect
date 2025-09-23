import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertsService } from '../../services/alertsService';
import { toast } from 'react-hot-toast';

interface NotificationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification: any;
}

export default function NotificationEditModal({ isOpen, onClose, onSuccess, notification }: NotificationEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    channel: 'sms',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notification) {
      setFormData({
        title: notification.title || '',
        content: notification.message || '',
        channel: notification.channel || 'sms',
        status: notification.status || 'pending'
      });
    }
  }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Note: Il n'y a pas de fonction update_notification dans AlertsService
      // On peut seulement mettre à jour le statut via updateNotificationStatus
      if (formData.status !== notification.status) {
        await AlertsService.updateNotificationStatus(notification.id, formData.status);
      }
      
      toast.success('Notification mise à jour avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Erreur lors de la mise à jour de la notification');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la notification</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la notification. Seul le statut peut être mis à jour actuellement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Titre de la notification"
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Contenu *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Contenu de la notification"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="channel">Canal</Label>
            <Select value={formData.channel} onValueChange={(value) => handleInputChange('channel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push Notification</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="failed">Échouée</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
