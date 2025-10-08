import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// Type assertions pour résoudre les conflits de types
const TabsComponent = Tabs as any;
const TabsListComponent = TabsList as any;
const TabsTriggerComponent = TabsTrigger as any;
const TabsContentComponent = TabsContent as any;
import { Producer, ProducersService } from '../../services/producersService';
import { useToast } from '../../context/ToastContext';

interface ProducerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  producer: Producer | null;
  title: string;
}

const ProducerModal: React.FC<ProducerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  producer,
  title
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    // Informations de base
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    cooperative_id: '',
    
    // Localisation
    region: '',
    department: '',
    commune: '',
    village: '',
    address: '',
    
    // Informations personnelles
    birth_date: '',
    gender: '',
    education_level: '',
    farming_experience_years: '',
    household_size: '',
    primary_language: '',
    
    // Statut
    is_active: true
  });

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      loadOptions();
    }
  }, [isOpen, producer]);

  const loadFormData = () => {
    if (producer) {
      setFormData({
        first_name: producer.first_name || '',
        last_name: producer.last_name || '',
        phone: producer.phone || '',
        email: producer.email || '',
        cooperative_id: producer.cooperative_id || '',
        region: producer.region || '',
        department: producer.department || '',
        commune: producer.commune || '',
        village: producer.village || '',
        address: producer.address || '',
        birth_date: producer.birth_date || '',
        gender: producer.gender || '',
        education_level: producer.education_level || '',
        farming_experience_years: producer.farming_experience_years?.toString() || '',
        household_size: producer.household_size?.toString() || '',
        primary_language: producer.primary_language || '',
        is_active: producer.is_active ?? true
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        cooperative_id: '',
        region: '',
        department: '',
        commune: '',
        village: '',
        address: '',
        birth_date: '',
        gender: '',
        education_level: '',
        farming_experience_years: '',
        household_size: '',
        primary_language: '',
        is_active: true
      });
    }
  };

  const loadOptions = async () => {
    try {
      // Load cooperatives
      const { CooperativesService } = await import('../../services/cooperativesService');
      const cooperativesResult = await CooperativesService.getCooperatives({}, 1, 1000);
      setCooperatives(cooperativesResult.data);

      // Load regions
      const regions = await ProducersService.getRegions();
      setRegions(regions);

      // Mock departments and communes for now
      setDepartments(['Dakar', 'Thiès', 'Kaolack', 'Saint-Louis']);
      setCommunes(['Commune 1', 'Commune 2', 'Commune 3']);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      showToast({ type: 'error', title: 'Veuillez remplir les champs obligatoires' });
      return;
    }

    try {
      setLoading(true);
      
      const producerData = {
        ...formData,
        farming_experience_years: formData.farming_experience_years ? parseInt(formData.farming_experience_years) : null,
        household_size: formData.household_size ? parseInt(formData.household_size) : null,
        birth_date: formData.birth_date && formData.birth_date.trim() !== '' ? formData.birth_date : null,
        email: formData.email && formData.email.trim() !== '' ? formData.email : null,
        village: formData.village && formData.village.trim() !== '' ? formData.village : null,
        address: formData.address && formData.address.trim() !== '' ? formData.address : null,
        gender: formData.gender && formData.gender.trim() !== '' ? formData.gender : null,
        education_level: formData.education_level && formData.education_level.trim() !== '' ? formData.education_level : null,
        primary_language: formData.primary_language && formData.primary_language.trim() !== '' ? formData.primary_language : null,
        is_active: String(formData.is_active) === 'true'
      };

      console.log('Form data before processing:', formData);
      console.log('Processed producer data:', producerData);

      if (producer) {
        await ProducersService.updateProducer(producer.id, producerData);
        showToast({ type: 'success', title: 'Producteur modifié avec succès' });
      } else {
        await ProducersService.createProducer(producerData);
        showToast({ type: 'success', title: 'Producteur créé avec succès' });
      }

      onSave();
    } catch (error) {
      console.error('Error saving producer:', error);
      showToast({ type: 'error', title: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: 'M', label: 'Homme' },
    { value: 'F', label: 'Femme' },
    { value: 'O', label: 'Autre' }
  ];

  const educationLevels = [
    { value: 'none', label: 'Aucune' },
    { value: 'primary', label: 'Primaire' },
    { value: 'secondary', label: 'Secondaire' },
    { value: 'high_school', label: 'Lycée' },
    { value: 'university', label: 'Université' }
  ];

  const languages = [
    { value: 'french', label: 'Français' },
    { value: 'wolof', label: 'Wolof' },
    { value: 'pulaar', label: 'Pulaar' },
    { value: 'serer', label: 'Sérère' },
    { value: 'diola', label: 'Diola' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {producer ? 'Modifier les informations du producteur' : 'Ajouter un nouveau producteur'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4">
          <TabsComponent defaultValue="basic" className="w-full">
            <TabsListComponent className="grid w-full grid-cols-3">
              <TabsTriggerComponent value="basic">Informations de base</TabsTriggerComponent>
              <TabsTriggerComponent value="location">Localisation</TabsTriggerComponent>
              <TabsTriggerComponent value="personal">Informations personnelles</TabsTriggerComponent>
            </TabsListComponent>

            {/* Informations de base */}
            <TabsContentComponent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                      <Label htmlFor="first_name">Prénom *</Label>
                      <Input
                        id="first_name"
                value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        required
                      />
            </div>
            <div>
                      <Label htmlFor="last_name">Nom *</Label>
                      <Input
                        id="last_name"
                value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        required
                      />
                    </div>
            </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                  value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                />
              </div>
            <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                  type="email"
                  value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            <div>
                    <Label htmlFor="cooperative_id">Coopérative *</Label>
                    <Select
                      value={formData.cooperative_id}
                      onValueChange={(value) => handleInputChange('cooperative_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une coopérative" />
                      </SelectTrigger>
                      <SelectContent>
                        {cooperatives
                          .filter((coop) => coop.id && coop.name)
                          .map((coop) => (
                            <SelectItem key={coop.id} value={coop.id}>
                              {coop.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                <input
                      type="checkbox"
                      id="is_active"
                      aria-label="Producteur actif"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked.toString())}
                    />
                    <Label htmlFor="is_active">Producteur actif</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContentComponent>

            {/* Localisation */}
            <TabsContentComponent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Localisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="region">Région *</Label>
                      <Select
                  value={formData.region}
                        onValueChange={(value) => handleInputChange('region', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une région" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions
                            .filter((region) => region && region.trim() !== '')
                            .map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Département *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => handleInputChange('department', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un département" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments
                            .filter((dept) => dept && dept.trim() !== '')
                            .map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="commune">Commune *</Label>
                      <Select
                        value={formData.commune}
                        onValueChange={(value) => handleInputChange('commune', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une commune" />
                        </SelectTrigger>
                        <SelectContent>
                          {communes
                            .filter((commune) => commune && commune.trim() !== '')
                            .map((commune) => (
                              <SelectItem key={commune} value={commune}>
                                {commune}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
              </div>
            </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="village">Village</Label>
                      <Input
                        id="village"
                        value={formData.village}
                        onChange={(e) => handleInputChange('village', e.target.value)}
                      />
                    </div>
            <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
            </div>
                </CardContent>
              </Card>
            </TabsContentComponent>

            {/* Informations personnelles */}
            <TabsContentComponent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birth_date">Date de naissance</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Genre</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
            </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="education_level">Niveau d'éducation</Label>
                      <Select
                        value={formData.education_level}
                        onValueChange={(value) => handleInputChange('education_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="primary_language">Langue principale</Label>
                      <Select
                        value={formData.primary_language}
                        onValueChange={(value) => handleInputChange('primary_language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une langue" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
            </div>
          </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="farming_experience_years">Années d'expérience agricole</Label>
                      <Input
                        id="farming_experience_years"
                        type="number"
                        min="0"
                        value={formData.farming_experience_years}
                        onChange={(e) => handleInputChange('farming_experience_years', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="household_size">Taille du ménage</Label>
                      <Input
                        id="household_size"
                        type="number"
                        min="1"
                        value={formData.household_size}
                        onChange={(e) => handleInputChange('household_size', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContentComponent>
          </TabsComponent>
        </form>

          {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2"
            >
            {loading ? 'Sauvegarde...' : (producer ? 'Modifier' : 'Créer')}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProducerModal;
