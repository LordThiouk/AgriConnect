import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Input, VStack, HStack } from 'native-base';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../lib/services/collecte';
import { Crop } from '../../../../../types/collecte';
import { useAuth } from '../../../../../context/AuthContext';
import PhotoPicker from '../../../../../components/PhotoPicker';
import { MediaFile } from '../../../../../lib/services/media';
import { Feather } from '@expo/vector-icons';
import { FormField } from '../../../../../components/ui';
import { 
  FormInput, 
  FormSelect, 
  FormDatePicker, 
  FormFooter 
} from '../../../../../components/ui';

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
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<MediaFile[]>([]);

  const loadCrops = useCallback(async () => {
    if (!plotId) return;
    try {
      const fetchedCrops = await CollecteService.getCropsByPlotId(plotId);
      setCrops(fetchedCrops);
    } catch (error) {
      console.error('Erreur lors du chargement des cultures:', error);
      Alert.alert('Erreur', 'Impossible de charger les cultures.');
    }
  }, [plotId]);

  useEffect(() => {
    if (plotId && user?.id) {
      loadCrops();
    }
  }, [plotId, user?.id, loadCrops]);

  const handleSave = async () => {
    if (!formData.crop_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner une culture');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une description');
      return;
    }

    try {
      setLoading(true);
      
      const { data: agentProfile, error: agentError } = await CollecteService.supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .eq('role', 'agent')
        .single();

      if (agentError || !agentProfile) {
        Alert.alert('Erreur', 'Agent non trouvé');
        return;
      }
      
      const observationData = {
        crop_id: formData.crop_id,
        plot_id: plotId!,
        observation_type: formData.observation_type,
        observation_date: formData.observation_date,
        emergence_percent: formData.emergence_percent ? parseInt(formData.emergence_percent) : null,
        pest_disease_name: formData.pest_disease_name || null,
        severity: formData.severity || null,
        affected_area_percent: formData.affected_area_percent ? parseFloat(formData.affected_area_percent) : null,
        description: formData.description || null,
        recommendations: formData.recommendations || null,
        observed_by: user?.id || ''
      };

      const newObservation = await CollecteService.addObservation(observationData);
      console.log('✅ Observation ajoutée:', newObservation);

      if (photos.length > 0) {
        console.log('📸 Association des photos à l\'observation:', newObservation.id);
        
        for (const photo of photos) {
          try {
            const { error: updateError } = await CollecteService.supabase
              .from('media')
              .update({ entity_id: newObservation.id })
              .eq('id', photo.id);

            if (updateError) {
              console.error('❌ Erreur mise à jour photo:', updateError);
            } else {
              console.log('✅ Photo associée à l\'observation:', photo.file_name);
            }
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
    } finally {
      setLoading(false);
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
    <VStack flex={1} bg="gray.50">
      {/* Header */}
      <HStack 
        alignItems="center" 
        justifyContent="space-between" 
        px={4} 
        py={4} 
        bg="white" 
        borderBottomWidth={1} 
        borderBottomColor="gray.200"
      >
        <Button variant="ghost" onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#3D944B" />
        </Button>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Nouvelle Observation
        </Text>
        <View style={{ width: 40 }} />
      </HStack>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <VStack space={4} p={4}>
          <FormSelect
            label="Culture"
            required
            value={formData.crop_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, crop_id: value }))}
            options={crops.map(crop => ({ 
              value: crop.id, 
              label: `${crop.crop_type} - ${crop.variety} (${crop.status})` 
            }))}
            placeholder="Sélectionner une culture"
          />

          <FormSelect
            label="Type d'observation"
            required
            value={formData.observation_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, observation_type: value }))}
            options={observationTypes}
            placeholder="Sélectionner le type"
          />

          <FormDatePicker
            label="Date d'observation"
            required
            value={formData.observation_date}
            onChange={(value) => setFormData(prev => ({ ...prev, observation_date: value }))}
          />

          {formData.observation_type === 'levée' && (
            <FormInput
              label="Pourcentage de levée"
              value={formData.emergence_percent}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergence_percent: text }))}
              placeholder="0-100"
              keyboardType="numeric"
            />
          )}

          {(formData.observation_type === 'maladie' || formData.observation_type === 'ravageur') && (
            <FormInput
              label={`Nom du ${formData.observation_type === 'maladie' ? 'maladie' : 'ravageur'}`}
              value={formData.pest_disease_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pest_disease_name: text }))}
              placeholder="Nom du ravageur ou maladie"
            />
          )}

          <FormSelect
            label="Sévérité"
            value={formData.severity?.toString() || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, severity: parseInt(value) }))}
            options={severityOptions}
            placeholder="Sélectionner la sévérité"
          />

          <FormInput
            label="Zone affectée (%)"
            value={formData.affected_area_percent}
            onChangeText={(text) => setFormData(prev => ({ ...prev, affected_area_percent: text }))}
            placeholder="0-100"
            keyboardType="numeric"
          />

          <FormInput
            label="Description"
            required
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Décrivez l'observation..."
            multiline
            numberOfLines={3}
          />

          <FormInput
            label="Recommandations"
            value={formData.recommendations}
            onChangeText={(text) => setFormData(prev => ({ ...prev, recommendations: text }))}
            placeholder="Recommandations d'action..."
            multiline
            numberOfLines={3}
          />

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
        </VStack>
      </ScrollView>

      <FormFooter
        onCancel={() => router.back()}
        onSave={handleSave}
        loading={loading}
        cancelText="Annuler"
        saveText="Enregistrer"
      />
    </VStack>
  );
}
