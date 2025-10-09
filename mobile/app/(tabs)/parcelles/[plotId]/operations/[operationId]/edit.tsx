import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUpdateOperation, useDeleteOperation } from '../../../../../../lib/hooks';
import { 
  FormSelect, 
  FormDatePicker, 
  ScreenContainer,
  FormContainer,
  FormFooter,
  FormField,
  FormInput
} from '../../../../../../components/ui';
import { Box } from 'native-base';
import PhotoPicker from '../../../../../../components/PhotoPicker';
import { MediaFile } from '../../../../../../lib/services/media';

interface OperationFormData {
  operation_type: string;
  product_name: string;
  dose_per_hectare: string;
  unit: string;
  operation_date: string;
  description: string;
  cost_per_hectare: string;
}

export default function EditOperationScreen() {
  const { plotId, operationId } = useLocalSearchParams<{ plotId: string; operationId: string }>();
  const router = useRouter();
  const [photos, setPhotos] = useState<MediaFile[]>([]);

  console.log('🚜 [EDIT_OPERATION] Écran d\'édition d\'opération initialisé:', { plotId, operationId });

  // Utiliser les hooks pour les opérations
  const { updateOperation, loading: updateLoading } = useUpdateOperation();
  const { deleteOperation, loading: deleteLoading } = useDeleteOperation();

  const loading = updateLoading || deleteLoading;

  const [formData, setFormData] = useState<OperationFormData>({
    operation_type: '',
    product_name: '',
    dose_per_hectare: '',
    unit: '',
    operation_date: '',
    description: '',
    cost_per_hectare: '',
  });

  const operationTypes = [
    { value: 'semis', label: 'Semis' },
    { value: 'fertilisation', label: 'Fertilisation' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'desherbage', label: 'Désherbage' },
    { value: 'traitement_phytosanitaire', label: 'Traitement phytosanitaire' },
    { value: 'recolte', label: 'Récolte' },
    { value: 'labour', label: 'Labour' },
    { value: 'autre', label: 'Autre' },
  ];

  const units = [
    { value: 'kg', label: 'Kilogramme (kg)' },
    { value: 'g', label: 'Gramme (g)' },
    { value: 'l', label: 'Litre (l)' },
    { value: 'ml', label: 'Millilitre (ml)' },
    { value: 'm2', label: 'Mètre carré (m²)' },
    { value: 'ha', label: 'Hectare (ha)' },
    { value: 'unite', label: 'Unité' },
  ];

  const [operationLoading, setOperationLoading] = useState(true);

  const loadOperationData = useCallback(async () => {
    if (!operationId || !plotId) return;
    
    try {
      setOperationLoading(true);
      
      console.log('🚜 [EDIT_OPERATION] Chargement des données de l\'opération:', operationId);
      
      // Récupérer l'opération directement via Supabase
      const { supabase } = await import('../../../../../../lib/supabase-client');
      const { data: operation, error } = await supabase
        .from('operations')
        .select('*')
        .eq('id', operationId)
        .single();

      if (error) {
        console.error('❌ [EDIT_OPERATION] Erreur lors du chargement de l\'opération:', error);
        Alert.alert('Erreur', 'Impossible de charger l\'opération');
        return;
      }

      if (!operation) {
        console.error('❌ [EDIT_OPERATION] Opération non trouvée');
        Alert.alert('Erreur', 'Opération non trouvée');
        return;
      }

      // Remplir le formulaire avec les données
      setFormData({
        operation_type: operation.operation_type || '',
        product_name: (operation as any).product_name || '',
        dose_per_hectare: operation.dose_per_hectare ? operation.dose_per_hectare.toString() : '',
        unit: operation.unit || '',
        operation_date: operation.operation_date || '',
        description: operation.description || '',
        cost_per_hectare: operation.cost_per_hectare ? operation.cost_per_hectare.toString() : '',
      });

      console.log('✅ [EDIT_OPERATION] Opération chargée:', operation);
    } catch (error) {
      console.error('❌ [EDIT_OPERATION] Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setOperationLoading(false);
    }
  }, [operationId, plotId]);

  useEffect(() => {
    loadOperationData();
  }, [loadOperationData]);


  const handleUpdate = async () => {
    if (!formData.operation_type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'opération');
      return;
    }

    if (!formData.operation_date) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date');
      return;
    }

    try {
      const operationData = {
        operation_type: formData.operation_type,
        product_name: formData.product_name || null,
        dose_per_hectare: formData.dose_per_hectare ? parseFloat(formData.dose_per_hectare) : null,
        unit: formData.unit || null,
        operation_date: formData.operation_date,
        description: formData.description || null,
        cost_per_hectare: formData.cost_per_hectare ? parseFloat(formData.cost_per_hectare) : null,
      };

      console.log('🚜 [EDIT_OPERATION] Mise à jour de l\'opération:', { operationId, operationData });
      const updatedOperation = await updateOperation(operationId!, operationData);
      console.log('✅ [EDIT_OPERATION] Opération mise à jour:', updatedOperation);

      // Si des photos ont été ajoutées, les associer à l'opération
      if (photos.length > 0) {
        console.log('📸 [EDIT_OPERATION] Association des photos à l\'opération:', operationId);
        
        // TODO: Utiliser MediaService pour associer les photos
        // Pour l'instant, on garde la logique existante
        for (const photo of photos) {
          try {
            const { supabase } = await import('../../../../../../lib/supabase-client');
            const { error: updateError } = await supabase
              .from('media')
              .update({ entity_id: operationId })
              .eq('id', photo.id);

            if (updateError) {
              console.error('❌ [EDIT_OPERATION] Erreur mise à jour photo:', updateError);
            } else {
              console.log('✅ [EDIT_OPERATION] Photo associée à l\'opération:', photo.file_name);
            }
          } catch (photoError) {
            console.error('❌ [EDIT_OPERATION] Erreur association photo:', photoError);
          }
        }
      }
      
      Alert.alert(
        'Succès', 
        'Opération mise à jour avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('❌ [EDIT_OPERATION] Erreur lors de la mise à jour de l\'opération:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'opération');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette opération ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚜 [EDIT_OPERATION] Suppression de l\'opération:', operationId);
              await deleteOperation(operationId!);
              console.log('✅ [EDIT_OPERATION] Opération supprimée');
              Alert.alert(
                'Succès',
                'Opération supprimée avec succès',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('❌ [EDIT_OPERATION] Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'opération');
            }
          }
        }
      ]
    );
  };

  if (loading || operationLoading) {
      return (
        <ScreenContainer 
          title=""
          subtitle=""
          showSubHeader={false}
          showBackButton={false}
          animationEnabled={false}
        >
          <FormContainer 
            title="Modifier l'Opération" 
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
      contentScrollable={false}
    >
      <FormContainer 
        title="Modifier l'Opération" 
        subtitle=""
        enableKeyboardAvoidance
        keyboardVerticalOffset={100}
      >
        <Box p={4}>
            <FormField label="Type d'opération" required>
              <FormSelect
                value={formData.operation_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, operation_type: value }))}
                options={operationTypes.map(opt => ({ value: opt.value, label: opt.label }))}
                placeholder="Sélectionner un type"
              />
            </FormField>

            <FormField label="Nom du produit">
              <FormInput
                value={formData.product_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, product_name: text }))}
                placeholder="Nom du produit utilisé"
              />
            </FormField>

            <FormField label="Dose par hectare">
              <FormInput
                value={formData.dose_per_hectare}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dose_per_hectare: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </FormField>

            <FormField label="Unité">
              <FormSelect
                value={formData.unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                options={units.map(opt => ({ value: opt.value, label: opt.label }))}
                placeholder="Sélectionner une unité"
              />
            </FormField>

            <FormField label="Date d'opération" required>
              <FormDatePicker
                value={formData.operation_date}
                onChange={(value: string) => setFormData(prev => ({ ...prev, operation_date: value }))}
              />
            </FormField>

            <FormField label="Coût par hectare (FCFA)">
              <FormInput
                value={formData.cost_per_hectare}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cost_per_hectare: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </FormField>

            <FormField label="Description">
              <FormInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Description de l'opération"
                multiline
                numberOfLines={4}
              />
            </FormField>

            <FormField label="Photos">
              <PhotoPicker
                entityType="operation"
                entityId={operationId!}
                onPhotosChange={setPhotos}
                existingPhotos={photos}
                maxPhotos={5}
                enableGPS={true}
              />
            </FormField>
        </Box>

        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleUpdate}
          onDelete={handleDelete}
          loading={loading}
        />
      </FormContainer>
    </ScreenContainer>
  );
}

