import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Cooperative } from '../../types';
import { useToast } from '../../context/ToastContext';
import { CooperativesService } from '../../services/cooperativesService';

interface CooperativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  cooperative?: Cooperative | null;
  regions?: string[];
  departments?: string[];
  communes?: string[];
}

export default function CooperativeModal({
  isOpen,
  onClose,
  onSave,
  cooperative,
  regions = [],
  departments = [],
  communes = []
}: CooperativeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    department: '',
    commune: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (cooperative) {
      setFormData({
        name: cooperative.name || '',
        description: cooperative.description || '',
        region: cooperative.region || '',
        department: cooperative.department || '',
        commune: cooperative.commune || '',
        address: cooperative.address || '',
        phone: cooperative.phone || '',
        email: cooperative.email || '',
        contact_person: cooperative.contact_person || '',
        latitude: cooperative.latitude?.toString() || '',
        longitude: cooperative.longitude?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        region: '',
        department: '',
        commune: '',
        address: '',
        phone: '',
        email: '',
        contact_person: '',
        latitude: '',
        longitude: ''
      });
    }
  }, [cooperative]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      if (cooperative) {
        await CooperativesService.updateCooperative({ id: cooperative.id, ...data });
        showToast({ type: 'success', title: 'Coopérative mise à jour avec succès' });
      } else {
        await CooperativesService.createCooperative(data);
        showToast({ type: 'success', title: 'Coopérative créée avec succès' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving cooperative:', error);
      showToast({ type: 'error', title: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cooperative ? 'Modifier la coopérative' : 'Nouvelle coopérative'}
          </DialogTitle>
          <DialogDescription>
            {cooperative 
              ? `Modifier les informations de la coopérative ${cooperative.name}` 
              : 'Créer une nouvelle coopérative avec ses informations de base'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nom de la coopérative *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="region">Région *</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="department">Département *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="commune">Commune *</Label>
              <Input
                id="commune"
                value={formData.commune}
                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="contact_person">Personne de contact</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Nom du président ou responsable"
              />
            </div>

            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="Ex: 14.7167"
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="Ex: -17.4677"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : (cooperative ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}