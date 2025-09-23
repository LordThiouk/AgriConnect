import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertsService } from '../../services/alertsService';
import { Recommendation } from '../../types';
import { toast } from 'react-hot-toast';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recommendation?: Recommendation | null;
  mode: 'create' | 'edit';
}

export default function RecommendationModal({
  isOpen,
  onClose,
  onSuccess,
  recommendation,
  mode
}: RecommendationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recommendation_type: 'other' as 'fertilisation' | 'irrigation' | 'pest_control' | 'harvest' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'sent' | 'acknowledged' | 'completed' | 'dismissed',
    plot_id: '',
    rule_code: ''
  });
  const [loading, setLoading] = useState(false);

  // Initialiser les données du formulaire
  useEffect(() => {
    if (mode === 'edit' && recommendation) {
      setFormData({
        title: recommendation.title ?? '',
        message: recommendation.message ?? '',
        recommendation_type: recommendation.recommendation_type ?? 'other',
        priority: recommendation.priority ?? 'medium',
        status: recommendation.status ?? 'pending',
        plot_id: recommendation.plot_id ?? '',
        rule_code: recommendation.rule_code ?? ''
      });
    } else {
      setFormData({
        title: '',
        message: '',
        recommendation_type: 'other',
        priority: 'medium',
        status: 'pending',
        plot_id: '',
        rule_code: ''
      });
    }
  }, [mode, recommendation, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        await AlertsService.createRecommendation(formData);
        toast.success('Recommandation créée avec succès');
      } else if (mode === 'edit' && recommendation) {
        await AlertsService.updateRecommendation(recommendation.id, formData);
        toast.success('Recommandation mise à jour avec succès');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving recommendation:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvelle Recommandation' : 'Modifier la Recommandation'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Créez une nouvelle recommandation pour les producteurs.'
              : 'Modifiez les informations de cette recommandation.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Titre de la recommandation"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Description détaillée de la recommandation"
              rows={4}
              required
            />
          </div>

          {/* Type et Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recommendation_type">Type</Label>
              <Select
                value={formData.recommendation_type}
                onValueChange={(value) => handleChange('recommendation_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fertilisation">Fertilisation</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="pest_control">Lutte contre les ravageurs</SelectItem>
                  <SelectItem value="harvest">Récolte</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="acknowledged">Reconnu</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="dismissed">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parcelle et Code de règle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plot_id">ID Parcelle</Label>
              <Input
                id="plot_id"
                value={formData.plot_id}
                onChange={(e) => handleChange('plot_id', e.target.value)}
                placeholder="UUID de la parcelle (optionnel)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule_code">Code de règle</Label>
              <Input
                id="rule_code"
                value={formData.rule_code}
                onChange={(e) => handleChange('rule_code', e.target.value)}
                placeholder="Code de la règle métier (optionnel)"
              />
            </div>
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
            disabled={loading || !formData.title || !formData.message}
          >
            {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Mettre à jour')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
