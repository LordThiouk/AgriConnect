import React, { useState, useEffect, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ObservationsServiceInstance } from '../../../../../../lib/services/domain/observations';
import { CropsServiceInstance } from '../../../../../../lib/services/domain/crops';
import { 
  FormContainer,
  ScreenContainer,
  FormField,
  FormInput,
  FormSelect,
  FormDatePicker,
  FormFooter
} from '../../../../../../components/ui';
import PhotoPicker from '../../../../../../components/PhotoPicker';
import { MediaFile } from '../../../../../../lib/services/media';
import { Crop } from '../../../../../../types/collecte';

interface ObservationFormData {
  crop_id: string;
  observation_type: string;
  observation_date: string;
  emergence_percent: string;
  pest_disease_name: string;
  severity: string;
  affected_area_percent: string;
  description: string;
  recommendations: string;
}

export default function EditObservationScreen() {
  const { plotId, observationId } = useLocalSearchParams<{ plotId: string; observationId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<MediaFile[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);

  const [formData, setFormData] = useState<ObservationFormData>({
    crop_id: '',
    observation_type: '',
    observation_date: new Date().toISOString().split('T')[0],
    emergence_percent: '',
    pest_disease_name: '',
    severity: '',
    affected_area_percent: '',
    description: '',
    recommendations: '',
  });

  const observationTypes = [
    { label: 'Levée', value: 'levée' },
    { label: 'Maladie', value: 'maladie' },
    { label: 'Ravageur', value: 'ravageur' },
    { label: 'Développement', value: 'développement' },
    { label: 'Stress hydrique', value: 'stress_hydrique' },
    { label: 'Autre', value: 'autre' },
  ];

  const severityLevels = [
    { label: 'Faible (1)', value: '1' },
    { label: 'Modéré (2)', value: '2' },
    { label: 'Élevé (3)', value: '3' },
    { label: 'Très élevé (4)', value: '4' },
    { label: 'Critique (5)', value: '5' },
  ];

  const loadObservation = useCallback(async () => {
    if (!observationId || !plotId) return;
    
    try {
      setLoading(true);
      
      // Récupérer toutes les observations de la parcelle via le service
      const observations = await ObservationsServiceInstance.getObservationsByPlotId(plotId);
      const observation = observations.find(obs => obs.id === observationId);

      if (!observation) {
        Alert.alert('Erreur', 'Observation non trouvée');
        router.back();
        return;
      }

      console.log('✅ Observation chargée:', observation);
      
      // Pré-remplir à partir de l'observation trouvée
      setFormData({
        crop_id: (observation as any).crop_id || '',
        observation_type: (observation as any).observation_type || '',
        observation_date: (observation as any).observation_date || new Date().toISOString().split('T')[0],
        emergence_percent: (observation as any).emergence_percent?.toString() || '',
        pest_disease_name: (observation as any).pest_disease_name || '',
        severity: (observation as any).severity?.toString() || '',
        affected_area_percent: (observation as any).affected_area_percent?.toString() || '',
        description: (observation as any).description || '',
        recommendations: (observation as any).recommendations || '',
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'observation:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'observation');
    } finally {
      setLoading(false);
    }
  }, [observationId, plotId, router]);

  const loadCrops = useCallback(async () => {
    if (!plotId) return;
    try {
      const fetchedCrops = await CropsServiceInstance.getCropsByPlotId(plotId);
      setCrops(fetchedCrops);
    } catch (error) {
      console.error('Erreur lors du chargement des cultures:', error);
    }
  }, [plotId]);

  useEffect(() => {
    loadObservation();
    loadCrops();
  }, [observationId, plotId, loadObservation, loadCrops]);

  const handleInputChange = (field: keyof ObservationFormData, value: string) => {
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

    if (!formData.observation_type.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'observation');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une description');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        crop_id: formData.crop_id,
        observation_type: formData.observation_type,
        observation_date: formData.observation_date,
        emergence_percent: formData.emergence_percent ? parseInt(formData.emergence_percent) : null,
        pest_disease_name: formData.pest_disease_name || null,
        severity: formData.severity ? parseInt(formData.severity) : null,
        affected_area_percent: formData.affected_area_percent ? parseFloat(formData.affected_area_percent) : null,
        description: formData.description,
        recommendations: formData.recommendations || null,
      };

      await ObservationsServiceInstance.updateObservation(observationId!, updateData);
      
      Alert.alert(
        'Succès', 
        'Observation mise à jour avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'observation:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'observation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette observation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ObservationsServiceInstance.deleteObservation(observationId!);
              Alert.alert(
                'Succès',
                'Observation supprimée avec succès',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'observation');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
        title="Modifier Observation" 
        subtitle="Mettre à jour les informations"
        showBackButton
        onBack={() => router.back()}
      >
        <View style={{ padding: 16 }}>
          <FormField label="Culture" required>
            <FormSelect
            label="Culture"
            options={crops.map(crop => ({ 
              label: `${crop.crop_type} - ${crop.variety} (${crop.status})`, 
              value: crop.id 
            }))}
            value={formData.crop_id}
            onValueChange={(value) => handleInputChange('crop_id', value)}
            placeholder="Sélectionner une culture"
            />
          </FormField>

          <FormField label="Type d'observation" required>
            <FormSelect
            label="Type d'observation"
            options={observationTypes.map(opt => ({ value: opt.value, label: opt.label }))}
            value={formData.observation_type}
            onValueChange={(value) => handleInputChange('observation_type', value)}
            placeholder="Sélectionner un type"
            />
          </FormField>

          <FormField label="Date d'observation">
            <FormDatePicker
            label="Date d'observation"
            value={formData.observation_date}
            onChange={(value: string) => handleInputChange('observation_date', value)}
            />
          </FormField>

          <FormField label="Pourcentage de levée">
            <FormInput
              value={formData.emergence_percent}
              onChangeText={(value) => handleInputChange('emergence_percent', value)}
              placeholder="Ex: 85"
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Maladie/Ravageur">
            <FormInput
              value={formData.pest_disease_name}
              onChangeText={(value) => handleInputChange('pest_disease_name', value)}
              placeholder="Nom de la maladie ou du ravageur"
            />
          </FormField>

          <FormField label="Gravité">
            <FormSelect
              label="Gravité"
              options={severityLevels.map(opt => ({ value: opt.value, label: opt.label }))}
              value={formData.severity}
              onValueChange={(value) => handleInputChange('severity', value)}
              placeholder="Sélectionner une gravité"
            />
          </FormField>

          <FormField label="Zone affectée (%)">
            <FormInput
              value={formData.affected_area_percent}
              onChangeText={(value) => handleInputChange('affected_area_percent', value)}
              placeholder="Ex: 15"
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Description *">
            <FormInput
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Décrivez l'observation..."
              multiline
              numberOfLines={4}
            />
          </FormField>

          <FormField label="Recommandations">
            <FormInput
              value={formData.recommendations}
              onChangeText={(value) => handleInputChange('recommendations', value)}
              placeholder="Recommandations d'action..."
              multiline
              numberOfLines={3}
            />
          </FormField>

          <FormField label="Photos">
            <PhotoPicker
              entityType="observation"
              entityId={observationId!}
              onPhotosChange={setPhotos}
              existingPhotos={photos}
              maxPhotos={5}
              enableGPS={true}
            />
          </FormField>
        </View>

        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleSave}
          onDelete={handleDelete}
          showDelete
          loading={loading}
          saveText="Mettre à jour"
        />
      </FormContainer>
    </ScreenContainer>
  );
}

