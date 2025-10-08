import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../../lib/services/collecte';
import { FormSelect } from '../../../../../../components/ui';
import { FormDatePicker } from '../../../../../../components/ui';
import PhotoPicker from '../../../../../../components/PhotoPicker';
import { MediaFile } from '../../../../../../lib/services/media';
import { Feather } from '@expo/vector-icons';
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
      const observations = await CollecteService.getObservationsByPlotId(plotId);
      const observation = observations.find(obs => obs.id === observationId);

      if (!observation) {
        Alert.alert('Erreur', 'Observation non trouvée');
        router.back();
        return;
      }

      console.log('✅ Observation chargée:', observation);
      
      // Récupérer les détails complets depuis la base
      const { data: observationDetails, error } = await CollecteService.supabase
        .from('observations')
        .select(`
          *,
          crops (
            id,
            crop_type,
            variety
          )
        `)
        .eq('id', observationId)
        .single();

      if (error || !observationDetails) {
        console.error('❌ Erreur lors du chargement des détails:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails de l\'observation');
        return;
      }
      
      // Remplir le formulaire avec les données existantes
      setFormData({
        crop_id: observationDetails.crop_id || '',
        observation_type: observationDetails.observation_type || '',
        observation_date: observationDetails.observation_date || new Date().toISOString().split('T')[0],
        emergence_percent: observationDetails.emergence_percent?.toString() || '',
        pest_disease_name: observationDetails.pest_disease_name || '',
        severity: observationDetails.severity?.toString() || '',
        affected_area_percent: observationDetails.affected_area_percent?.toString() || '',
        description: observationDetails.description || '',
        recommendations: observationDetails.recommendations || '',
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
      const fetchedCrops = await CollecteService.getCropsByPlotId(plotId);
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

      await CollecteService.updateObservation(observationId!, updateData);
      
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
              await CollecteService.deleteObservation(observationId!);
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

  if (loading && !formData.observation_type) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D944B" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#3D944B" />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier Observation</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Feather name="trash-2" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.field}>
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
          </View>

          <View style={styles.field}>
            <FormSelect
              label="Type d'observation"
              options={observationTypes.map(opt => ({ value: opt.value, label: opt.label }))}
              value={formData.observation_type}
              onValueChange={(value) => handleInputChange('observation_type', value)}
              placeholder="Sélectionner un type"
            />
          </View>

          <View style={styles.field}>
            <FormDatePicker
              label="Date d'observation"
              value={formData.observation_date}
              onChange={(value: string) => handleInputChange('observation_date', value)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Pourcentage de levée</Text>
            <TextInput
              style={styles.input}
              value={formData.emergence_percent}
              onChangeText={(value) => handleInputChange('emergence_percent', value)}
              placeholder="Ex: 85"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Maladie/Ravageur</Text>
            <TextInput
              style={styles.input}
              value={formData.pest_disease_name}
              onChangeText={(value) => handleInputChange('pest_disease_name', value)}
              placeholder="Nom de la maladie ou du ravageur"
            />
          </View>

          <View style={styles.field}>
            <FormSelect
              label="Gravité"
              options={severityLevels.map(opt => ({ value: opt.value, label: opt.label }))}
              value={formData.severity}
              onValueChange={(value) => handleInputChange('severity', value)}
              placeholder="Sélectionner une gravité"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Zone affectée (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.affected_area_percent}
              onChangeText={(value) => handleInputChange('affected_area_percent', value)}
              placeholder="Ex: 15"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Décrivez l'observation..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Recommandations</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.recommendations}
              onChangeText={(value) => handleInputChange('recommendations', value)}
              placeholder="Recommandations d'action..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Photos</Text>
            <PhotoPicker
              entityType="observation"
              entityId={observationId!}
              onPhotosChange={setPhotos}
              existingPhotos={photos}
              maxPhotos={5}
              enableGPS={true}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Mettre à jour</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#3D944B',
    borderColor: '#3D944B',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
