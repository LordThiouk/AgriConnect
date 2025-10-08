import React, { useState } from 'react';
import {
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// TODO: Créer useCreateCrop hook
import { 
  FormContainer, 
  FormFooter, 
  Card, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormDatePicker,
  ScreenContainer
} from '../../../../../components/ui';
import { ScrollView } from 'native-base';

interface CropFormData {
  crop_type: string;
  variety: string;
  sowing_date: string;
  expected_harvest: string;
  estimated_yield_kg_ha: string;
  status: string;
}

const cropTypes = [
  { id: 'riz', label: 'Riz' },
  { id: 'mais', label: 'Maïs' },
  { id: 'millet', label: 'Millet' },
  { id: 'sorgho', label: 'Sorgho' },
  { id: 'arachide', label: 'Arachide' },
  { id: 'niébé', label: 'Niébé' },
  { id: 'sésame', label: 'Sésame' },
  { id: 'tomate', label: 'Tomate' },
  { id: 'oignon', label: 'Oignon' },
  { id: 'autre', label: 'Autre' },
];

const statusOptions = [
  { id: 'planifie', label: 'Planifié' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'termine', label: 'Terminé' },
  { id: 'abandonne', label: 'Abandonné' },
];

export default function AddCropScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();

  console.log('🌾 [ADD_CROP] Écran d\'ajout de culture initialisé:', { plotId });

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CropFormData>({
    crop_type: '',
    variety: '',
    sowing_date: new Date().toISOString().split('T')[0],
    expected_harvest: '',
    estimated_yield_kg_ha: '',
    status: 'planifie',
  });

  const handleInputChange = (field: keyof CropFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.crop_type.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de culture');
      return;
    }

    if (!formData.variety.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir la variété');
      return;
    }

    if (!formData.sowing_date) {
      Alert.alert('Erreur', 'Veuillez saisir la date de semis');
      return;
    }

    try {
      setLoading(true);
      
      const cropData = {
        plot_id: plotId!,
        season_id: 'default', // TODO: Récupérer la saison active
        crop_type: formData.crop_type,
        variety: formData.variety.trim(),
        sowing_date: formData.sowing_date,
        expected_harvest: formData.expected_harvest || undefined,
        estimated_yield_kg_ha: formData.estimated_yield_kg_ha ? parseFloat(formData.estimated_yield_kg_ha) : undefined,
        status: formData.status,
        created_by: 'system', // TODO: Récupérer l'ID de l'utilisateur connecté
      };

      console.log('🌾 [ADD_CROP] Données de la culture:', cropData);
      
      // Utiliser CropsService directement
      const { CropsServiceInstance } = await import('../../../../../lib/services/domain/crops');
      const newCrop = await CropsServiceInstance.createCrop(cropData);
      console.log('✅ [ADD_CROP] Culture ajoutée:', newCrop);
      
      Alert.alert(
        'Succès', 
        'Culture ajoutée avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('❌ [ADD_CROP] Erreur lors de l\'ajout de la culture:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la culture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer 
      title=""
      subtitle=""
      showSubHeader={false}
      showBackButton={false}
      animationEnabled={false}
    >
      <FormContainer 
        title="Nouvelle Culture" 
        subtitle="Ajouter une culture à cette parcelle"
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <FormField label="Type de culture" required>
              <FormSelect
                value={formData.crop_type}
                onValueChange={(value) => handleInputChange('crop_type', value)}
                options={cropTypes.map(opt => ({ value: opt.id, label: opt.label }))}
                placeholder="Sélectionner un type"
              />
            </FormField>

            <FormField label="Variété" required>
              <FormInput
                value={formData.variety}
                onChangeText={(value) => handleInputChange('variety', value)}
                placeholder="Nom de la variété"
              />
            </FormField>

            <FormField label="Date de semis" required>
              <FormDatePicker
                value={formData.sowing_date}
                onChange={(value: string) => handleInputChange('sowing_date', value)}
              />
            </FormField>

            <FormField label="Date de récolte prévue">
              <FormDatePicker
                value={formData.expected_harvest}
                onChange={(value: string) => handleInputChange('expected_harvest', value)}
              />
            </FormField>

            <FormField label="Rendement estimé (kg/ha)">
              <FormInput
                value={formData.estimated_yield_kg_ha}
                onChangeText={(value) => handleInputChange('estimated_yield_kg_ha', value)}
                placeholder="Rendement estimé"
                keyboardType="numeric"
              />
            </FormField>

            <FormField label="Statut">
              <FormSelect
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                options={statusOptions.map(opt => ({ value: opt.id, label: opt.label }))}
                placeholder="Sélectionner un statut"
              />
            </FormField>
          </Card>
        </ScrollView>

        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleSave}
          loading={loading}
        />
      </FormContainer>
    </ScreenContainer>
  );
}
