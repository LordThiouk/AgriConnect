import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertsService } from '../../services/alertsService';
import { Notification } from '../../types';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create';
}

export default function NotificationModal({
  isOpen,
  onClose,
  onSuccess,
  mode
}: NotificationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    channel: 'sms'
  });
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Réinitialiser le formulaire et gérer le focus quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        content: '',
        channel: 'sms'
      });
      // Focus sur le premier input après un court délai
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await AlertsService.createNotification(formData);
      toast.success('Notification créée avec succès');
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Erreur lors de la création de la notification');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Nouvelle Notification</DialogTitle>
              <DialogDescription>
                Créez une nouvelle notification pour informer les utilisateurs.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              aria-label="Fermer"
            >
              {React.createElement(X, { className: "h-4 w-4" })}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              ref={firstInputRef}
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Titre de la notification"
              required
            />
          </div>

          {/* Contenu */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenu *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Message de la notification"
              rows={4}
              required
            />
          </div>

          {/* Canal */}
          <div className="space-y-2">
            <Label htmlFor="channel">Canal</Label>
            <Select
              value={formData.channel}
              onValueChange={(value) => handleChange('channel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push Notification</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Informations</h4>
            <p className="text-sm text-blue-700">
              Cette notification sera créée avec le statut "pending" et pourra être envoyée 
              ultérieurement via le système de notifications.
            </p>
          </div>

          {/* Boutons */}
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.content}
          >
            {loading ? 'Création...' : 'Créer la notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
