import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCreateObservation } from '../../../../../lib/hooks/useObservations';
import { Crop } from '../../../../../types/collecte';
import { useAuth } from '../../../../../context/AuthContext';
import PhotoPicker from '../../../../../components/PhotoPicker';
import { MediaFile } from '../../../../../lib/services/media';
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

  const [crops, setCrops] = useState<Crop[]>([]);
  const [photos, setPhotos] = useState<MediaFile[]>([]);

  // Utiliser le hook pour créer une observation
  const { createObservation, loading } = useCreateObservation();

  const loadCrops = useCallback(async () => {
    if (!plotId) return;
    
    try {
      // TODO: Utiliser CropsService pour récupérer les cultures
      const cropsData: Crop[] = []; // Placeholder
      setCrops(cropsData);
    } catch (error) {
      console.error('Erreur lors du chargement des cultures:', error);
    }
  }, [plotId]);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const handleInputChange = (field: keyof ObservationFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.crop_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner une culture');
      return;
    }

    if (!formData.observation_type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'observation');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
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

      // Associer les photos à l'observation créée
      if (photos.length > 0 && newObservation) {
        console.log('📸 Association des photos à l\'observation:', newObservation.id);
        
        for (const photo of photos) {
          try {
            // TODO: Utiliser MediaService pour associer les photos
            console.log('📸 Association photo:', photo.id, 'à observation:', newObservation.id);

            console.log('✅ Photo associée à l\'observation:', photo.file_name);
          } catch (photoError) {
            console.error('❌ Erreur association photo:', photoError);
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
    >
      <FormContainer 
        title="Nouvelle Observation" 
        subtitle="Ajouter une observation à cette parcelle"
      >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <FormField label="Culture" required>
            <FormSelect
              value={formData.crop_id}
              onValueChange={(value) => handleInputChange('crop_id', value)}
              options={crops.map(crop => ({ value: crop.id, label: `${crop.crop_type} - ${crop.variety} (${crop.status})` }))}
              placeholder="Sélectionner une culture"
            />
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
              entityType="observation"
              entityId={plotId || ''}
              onPhotosChange={setPhotos}
              existingPhotos={photos}
              maxPhotos={5}
              enableGPS={true}
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