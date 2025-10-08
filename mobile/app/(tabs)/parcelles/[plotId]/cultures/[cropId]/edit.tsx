import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// TODO: Créer useUpdateCrop et useDeleteCrop hooks
import { 
  FormSelect, 
  FormDatePicker, 
  ScreenContainer,
  FormContainer,
  FormFooter,
  Card,
  FormField,
  FormInput
} from '../../../../../../components/ui';
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

export default function EditCropScreen() {
  const { plotId, cropId } = useLocalSearchParams<{ plotId: string; cropId: string }>();
  const router = useRouter();

  console.log('🌾 [EDIT_CROP] Écran d\'édition de culture initialisé:', { plotId, cropId });

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CropFormData>({
    crop_type: '',
    variety: '',
    sowing_date: new Date().toISOString().split('T')[0],
    expected_harvest: '',
    estimated_yield_kg_ha: '',
    status: 'planifie',
  });

  const loadCrop = useCallback(async () => {
    if (!cropId || !plotId) return;
    
    try {
      setLoading(true);
      console.log('🌾 [EDIT_CROP] Chargement de la culture:', cropId);
      
      // Utiliser CropsService directement
      const { CropsServiceInstance } = await import('../../../../../../lib/services/domain/crops');
      const crops = await CropsServiceInstance.getCropsByPlotId(plotId);
      const crop = crops.find(c => c.id === cropId);

      if (!crop) {
        Alert.alert('Erreur', 'Culture non trouvée');
        router.back();
        return;
      }

      console.log('✅ [EDIT_CROP] Culture chargée:', crop);
      
      // Remplir le formulaire avec les données existantes
      setFormData({
        crop_type: crop.crop_type || '',
        variety: crop.variety || '',
        sowing_date: crop.sowing_date || new Date().toISOString().split('T')[0],
        expected_harvest: crop.expected_harvest_date || '',
        estimated_yield_kg_ha: crop.actual_yield_kg?.toString() || '',
        status: crop.status || 'planifie',
      });
      
    } catch (error) {
      console.error('❌ [EDIT_CROP] Erreur lors du chargement de la culture:', error);
      Alert.alert('Erreur', 'Impossible de charger la culture');
    } finally {
      setLoading(false);
    }
  }, [cropId, plotId, router]);

  useEffect(() => {
    loadCrop();
  }, [loadCrop]);

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
      
      const updateData = {
        crop_type: formData.crop_type,
        variety: formData.variety.trim(),
        sowing_date: formData.sowing_date,
        expected_harvest: formData.expected_harvest || undefined,
        estimated_yield_kg_ha: formData.estimated_yield_kg_ha ? parseFloat(formData.estimated_yield_kg_ha) : undefined,
        status: formData.status,
      };

      console.log('🌾 [EDIT_CROP] Mise à jour de la culture:', { cropId, updateData });
      
      // Utiliser CropsService directement
      const { CropsServiceInstance } = await import('../../../../../../lib/services/domain/crops');
      await CropsServiceInstance.updateCrop(cropId!, updateData);
      
      console.log('✅ [EDIT_CROP] Culture mise à jour avec succès');
      
      Alert.alert(
        'Succès', 
        'Culture mise à jour avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('❌ [EDIT_CROP] Erreur lors de la mise à jour de la culture:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la culture');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette culture ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🌾 [EDIT_CROP] Suppression de la culture:', cropId);
              
              // Utiliser CropsService directement
              const { CropsServiceInstance } = await import('../../../../../../lib/services/domain/crops');
              await CropsServiceInstance.deleteCrop(cropId!, plotId!);
              
              console.log('✅ [EDIT_CROP] Culture supprimée avec succès');
              
              Alert.alert(
                'Succès',
                'Culture supprimée avec succès',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('❌ [EDIT_CROP] Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la culture');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !formData.crop_type) {
    return (
      <ScreenContainer 
        title=""
        subtitle=""
        showSubHeader={false}
        showBackButton={false}
        animationEnabled={false}
      >
        <FormContainer 
          title="Modifier Culture" 
          subtitle=""
        >
          <ActivityIndicator size="large" color="#3D944B" />
        </FormContainer>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title=""
      subtitle=""
      showSubHeader={false}
      showBackButton={false}
      animationEnabled={false}
    >
      <FormContainer 
        title="Modifier Culture" 
        subtitle=""
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
                onChangeText={(text) => handleInputChange('variety', text)}
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
                onChangeText={(text) => handleInputChange('estimated_yield_kg_ha', text)}
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
          onDelete={handleDelete}
          loading={loading}
        />
      </FormContainer>
    </ScreenContainer>
  );
}

