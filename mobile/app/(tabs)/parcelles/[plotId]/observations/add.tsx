import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCreateObservation } from '../../../../../lib/hooks/useObservations';
import { useCrops } from '../../../../../lib/hooks/useCrops';
import { useAuth } from '../../../../../context/AuthContext';
import PhotoPicker from '../../../../../components/PhotoPicker';
import { MediaFile } from '../../../../../lib/services/domain/media/media.types';
import { MediaServiceInstance } from '../../../../../lib/services/domain/media/media.service';
import { 
  FormContainer, 
  FormFooter, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormDatePicker,
  ScreenContainer
} from '../../../../../components/ui';
import { Box, Text } from 'native-base';

interface ObservationFormData {
  crop_id: string;
  observation_type: string;
  observation_date: string;
  emergence_percent: string;
  pest_disease_name: string;
  severity: number | null;
  affected_area_percent: string;
  description: string;
  recommendations: string;
}

const observationTypes = [
  { value: 'levée', label: 'Levée' },
  { value: 'maladie', label: 'Maladie' },
  { value: 'ravageur', label: 'Ravageur' },
  { value: 'développement', label: 'Développement' },
  { value: 'stress_hydrique', label: 'Stress Hydrique' },
  { value: 'autre', label: 'Autre' },
];

export default function AddObservationScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ObservationFormData>({
    crop_id: '',
    observation_type: '',
    observation_date: new Date().toISOString().split('T')[0],
    emergence_percent: '',
    pest_disease_name: '',
    severity: null,
    affected_area_percent: '',
    description: '',
    recommendations: '',
  });

  const [photos, setPhotos] = useState<MediaFile[]>([]);

  // Utiliser le hook pour créer une observation
  const { createObservation, loading } = useCreateObservation();

  // Mémoriser la fonction onPhotosChange pour éviter les re-renders
  const handlePhotosChange = useCallback((newPhotos: MediaFile[]) => {
    setPhotos(newPhotos);
  }, []);
  
  // Utiliser le hook pour récupérer les cultures de la parcelle
  const { 
    crops, 
    loading: loadingCrops, 
    error: errorCrops 
  } = useCrops(plotId || '', user?.id, { 
    enabled: !!plotId && !!user?.id,
    refetchOnMount: true 
  });

  const handleInputChange = (field: keyof ObservationFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validation des champs obligatoires
    if (!formData.crop_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner une culture');
      return;
    }

    if (!formData.observation_type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'observation');
      return;
    }

    if (!formData.observation_date) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date d\'observation');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    // Validation des pourcentages
    if (formData.emergence_percent && (parseFloat(formData.emergence_percent) < 0 || parseFloat(formData.emergence_percent) > 100)) {
      Alert.alert('Erreur', 'Le pourcentage de levée doit être entre 0 et 100');
      return;
    }

    if (formData.affected_area_percent && (parseFloat(formData.affected_area_percent) < 0 || parseFloat(formData.affected_area_percent) > 100)) {
      Alert.alert('Erreur', 'Le pourcentage de zone affectée doit être entre 0 et 100');
      return;
    }

    try {
      const observationData = {
        crop_id: formData.crop_id,
        observation_type: formData.observation_type,
        observation_date: formData.observation_date,
        emergence_percent: formData.emergence_percent ? parseFloat(formData.emergence_percent) : null,
        pest_disease_name: formData.pest_disease_name || null,
        severity: formData.severity,
        affected_area_percent: formData.affected_area_percent ? parseFloat(formData.affected_area_percent) : null,
        description: formData.description || null,
        recommendations: formData.recommendations || null,
        observed_by: user.id
      };

      const newObservation = await createObservation(observationData);
      console.log('✅ Observation ajoutée:', newObservation);

      // Associer les photos à l'observation maintenant qu'on a l'ID
      if (photos.length > 0 && newObservation?.id) {
        console.log('📸 Association des photos à l\'observation:', newObservation.id);
        
        // Mettre à jour les photos pour les associer à l'observation
        for (const photo of photos) {
          try {
            // Mettre à jour l'entité associée à la photo
            await MediaServiceInstance.updateMediaEntity(photo.id, 'observation', newObservation.id);
            console.log('✅ Photo associée à l\'observation:', photo.id);
          } catch (error) {
            console.error('❌ Erreur association photo:', error);
          }
        }
      }
      
      Alert.alert(
        'Succès', 
        'Observation ajoutée avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'observation:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'observation');
    }
  };

  const severityOptions = [
    { value: '1', label: '1 - Très faible' },
    { value: '2', label: '2 - Faible' },
    { value: '3', label: '3 - Modéré' },
    { value: '4', label: '4 - Élevé' },
    { value: '5', label: '5 - Très élevé' },
  ];

  return (
    <ScreenContainer 
      title=""
      subtitle=""
      showSubHeader={false}
      showBackButton={false}
      animationEnabled={false}
      contentScrollable={false}
      >
      <FormContainer 
        title="Nouvelle Observation" 
        subtitle="Ajouter une observation à cette parcelle"
        enableKeyboardAvoidance
        keyboardVerticalOffset={110}
      >
        <Box p={4}>
          <FormField label="Culture" required>
            <FormSelect
              value={formData.crop_id}
              onValueChange={(value) => handleInputChange('crop_id', value)}
              options={crops.map(crop => ({ 
                value: crop.id, 
                label: `${crop.crop_type} - ${crop.variety} (${crop.status})` 
              }))}
              placeholder={loadingCrops ? "Chargement des cultures..." : "Sélectionner une culture"}
              disabled={loadingCrops || crops.length === 0}
            />
            {errorCrops && (
              <Text fontSize="xs" color="error.500" mt={1}>
                Erreur lors du chargement des cultures: {errorCrops.message}
              </Text>
            )}
            {!loadingCrops && crops.length === 0 && (
              <Text fontSize="xs" color="warning.500" mt={1}>
                Aucune culture trouvée pour cette parcelle
              </Text>
            )}
          </FormField>

          <FormField label="Type d'observation" required>
            <FormSelect
              value={formData.observation_type}
              onValueChange={(value) => handleInputChange('observation_type', value)}
              options={observationTypes}
              placeholder="Sélectionner un type"
            />
          </FormField>

          <FormField label="Date d'observation">
            <FormDatePicker
              value={formData.observation_date}
              onChange={(value: string) => handleInputChange('observation_date', value)}
            />
          </FormField>

          <FormField label="Pourcentage de levée (%)">
            <FormInput
              value={formData.emergence_percent}
              onChangeText={(value) => handleInputChange('emergence_percent', value)}
              placeholder="0"
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Nom du ravageur/maladie">
            <FormInput
              value={formData.pest_disease_name}
              onChangeText={(value) => handleInputChange('pest_disease_name', value)}
              placeholder="Nom du ravageur ou de la maladie"
            />
          </FormField>

          <FormField label="Gravité">
            <FormSelect
              value={formData.severity?.toString() || ''}
              onValueChange={(value) => handleInputChange('severity', value ? parseInt(value) : null)}
              options={severityOptions}
              placeholder="Sélectionner la gravité"
            />
          </FormField>

          <FormField label="Zone affectée (%)">
            <FormInput
              value={formData.affected_area_percent}
              onChangeText={(value) => handleInputChange('affected_area_percent', value)}
              placeholder="0"
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Description">
            <FormInput
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Description de l'observation..."
              multiline
              numberOfLines={3}
            />
          </FormField>

          <FormField label="Recommandations">
            <FormInput
              value={formData.recommendations}
              onChangeText={(value) => handleInputChange('recommendations', value)}
              placeholder="Recommandations..."
              multiline
              numberOfLines={3}
            />
          </FormField>

          <FormField label="Photos">
            <PhotoPicker
              entityType="plot"
              entityId={plotId!} // Utiliser le plotId pour éviter l'erreur UUID
              onPhotosChange={handlePhotosChange}
              existingPhotos={photos}
              maxPhotos={5}
              enableGPS={true}
            />
          </FormField>
        </Box>

        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleSave}
          loading={loading}
        />
      </FormContainer>
    </ScreenContainer>
  );
}