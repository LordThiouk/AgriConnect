/**
 * ProducerForm Component - Reusable form for adding/editing producers
 * Handles form validation, state management, and submission
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Producer, ProducerInsert, ProducerUpdate } from '../../../../lib/services';

interface ProducerFormProps {
  producer?: Producer;
  cooperatives: Array<{ id: string; name: string }>;
  onSubmit: (data: ProducerInsert | ProducerUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProducerForm({
  producer,
  cooperatives,
  onSubmit,
  onCancel,
  isLoading = false
}: ProducerFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProducerInsert>({
    profile_id: '',
    cooperative_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: 'M',
    birth_date: '',
    address: '',
    village: '',
    commune: '',
    department: '',
    region: '',
    household_size: 1,
    education_level: '',
    farming_experience_years: 0,
    primary_language: 'fr',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with existing producer data
  useEffect(() => {
    if (producer) {
      setFormData({
        profile_id: producer.profile_id || '',
        cooperative_id: producer.cooperative_id || '',
        first_name: producer.first_name || '',
        last_name: producer.last_name || '',
        phone: producer.phone || '',
        email: producer.email || '',
        gender: producer.gender || 'M',
        birth_date: producer.birth_date || '',
        address: producer.address || '',
        village: producer.village || '',
        commune: producer.commune || '',
        department: producer.department || '',
        region: producer.region || '',
        household_size: producer.household_size || 1,
        education_level: producer.education_level || '',
        farming_experience_years: producer.farming_experience_years || 0,
        primary_language: producer.primary_language || 'fr',
        is_active: producer.is_active ?? true
      });
    }
  }, [producer]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom de famille est requis';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!/^\+?[0-9]{8,15}$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    if (!formData.cooperative_id) {
      newErrors.cooperative_id = 'La coopérative est requise';
    }

    if (!formData.village?.trim()) {
      newErrors.village = 'Le village est requis';
    }

    if (!formData.commune?.trim()) {
      newErrors.commune = 'La commune est requise';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'Le département est requis';
    }

    if (!formData.region?.trim()) {
      newErrors.region = 'La région est requise';
    }

    if ((formData.household_size || 0) <= 0) {
      newErrors.household_size = 'La taille du ménage doit être supérieure à 0';
    }

    if ((formData.farming_experience_years || 0) < 0) {
      newErrors.farming_experience_years = "L'expérience agricole ne peut pas être négative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmit(formData);
      toast({
        title: "Succès",
        description: producer ? "Producteur mis à jour avec succès" : "Producteur créé avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{producer ? 'Modifier le Producteur' : 'Ajouter un Producteur'}</CardTitle>
        <CardDescription>
          {producer ? 'Modifiez les informations du producteur' : 'Ajoutez un nouveau producteur à la base de données'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations d'Identité</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="Prénom"
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom de Famille *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="Nom de famille"
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+221 77 123 45 67"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select
                  value={formData.gender || 'M'}
                  onValueChange={(value) => updateField('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de Naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Cooperative Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Coopérative</h3>
            <div className="space-y-2">
              <Label htmlFor="cooperative_id">Coopérative *</Label>
              <Select
                value={formData.cooperative_id}
                onValueChange={(value) => updateField('cooperative_id', value)}
              >
                <SelectTrigger className={errors.cooperative_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner une coopérative" />
                </SelectTrigger>
                <SelectContent>
                  {cooperatives.map((coop) => (
                    <SelectItem key={coop.id} value={coop.id}>
                      {coop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cooperative_id && <p className="text-sm text-red-500">{errors.cooperative_id}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations de Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="village">Village *</Label>
                <Input
                  id="village"
                  value={formData.village || ''}
                  onChange={(e) => updateField('village', e.target.value)}
                  placeholder="Nom du village"
                  className={errors.village ? 'border-red-500' : ''}
                />
                {errors.village && <p className="text-sm text-red-500">{errors.village}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commune">Commune *</Label>
                <Input
                  id="commune"
                  value={formData.commune || ''}
                  onChange={(e) => updateField('commune', e.target.value)}
                  placeholder="Nom de la commune"
                  className={errors.commune ? 'border-red-500' : ''}
                />
                {errors.commune && <p className="text-sm text-red-500">{errors.commune}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Département *</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="Nom du département"
                  className={errors.department ? 'border-red-500' : ''}
                />
                {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Région *</Label>
                <Input
                  id="region"
                  value={formData.region || ''}
                  onChange={(e) => updateField('region', e.target.value)}
                  placeholder="Nom de la région"
                  className={errors.region ? 'border-red-500' : ''}
                />
                {errors.region && <p className="text-sm text-red-500">{errors.region}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Adresse Complète</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Adresse détaillée"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Socio-Economic Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Données Socio-Économiques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="household_size">Taille du Ménage *</Label>
                <Input
                  id="household_size"
                  type="number"
                  min="1"
                  value={formData.household_size || 1}
                  onChange={(e) => updateField('household_size', parseInt(e.target.value) || 1)}
                  className={errors.household_size ? 'border-red-500' : ''}
                />
                {errors.household_size && <p className="text-sm text-red-500">{errors.household_size}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="education_level">Niveau d'Éducation</Label>
                <Select
                  value={formData.education_level || ''}
                  onValueChange={(value) => updateField('education_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aucun">Aucun</SelectItem>
                    <SelectItem value="primaire">Primaire</SelectItem>
                    <SelectItem value="secondaire">Secondaire</SelectItem>
                    <SelectItem value="superieur">Supérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farming_experience_years">Expérience Agricole (années) *</Label>
                <Input
                  id="farming_experience_years"
                  type="number"
                  min="0"
                  value={formData.farming_experience_years || 0}
                  onChange={(e) => updateField('farming_experience_years', parseInt(e.target.value) || 0)}
                  className={errors.farming_experience_years ? 'border-red-500' : ''}
                />
                {errors.farming_experience_years && <p className="text-sm text-red-500">{errors.farming_experience_years}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_language">Langue Principale</Label>
                <Select
                  value={formData.primary_language || 'fr'}
                  onValueChange={(value) => updateField('primary_language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="wo">Wolof</SelectItem>
                    <SelectItem value="pe">Peul</SelectItem>
                    <SelectItem value="se">Sérère</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : (producer ? 'Mettre à jour' : 'Créer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
