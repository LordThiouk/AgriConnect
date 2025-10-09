import React, { useState } from 'react';
import {
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCreateOperation } from '../../../../../lib/hooks';
import { 
  FormContainer, 
  FormFooter, 
  Box, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormDatePicker,
  ScreenContainer
} from '../../../../../components/ui';
import PhotoPicker from '../../../../../components/PhotoPicker';
import { ScrollView } from 'native-base';

interface OperationFormData {
  operation_type: string;
  product: string;
  quantity: string;
  unit: string;
  operation_date: string;
  description: string;
  cost: string;
}

export default function AddOperationScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);

  console.log('🚜 [ADD_OPERATION] Écran d\'ajout d\'opération initialisé:', { plotId });

  // Utiliser le hook pour créer une opération
  const { createOperation, loading, error } = useCreateOperation();

  console.log('🚜 [ADD_OPERATION] État du hook:', { loading, error: error?.message });

  const [formData, setFormData] = useState<OperationFormData>({
    operation_type: '',
    product: '',
    quantity: '',
    unit: '',
    operation_date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
  });

  const operationTypes = [
    { label: 'Semis', value: 'semis' },
    { label: 'Fertilisation', value: 'fertilisation' },
    { label: 'Irrigation', value: 'irrigation' },
    { label: 'Désherbage', value: 'desherbage' },
    { label: 'Traitement phytosanitaire', value: 'traitement_phytosanitaire' },
    { label: 'Récolte', value: 'recolte' },
    { label: 'Labour', value: 'labour' },
    { label: 'Autre', value: 'autre' },
  ];

  const units = [
    { id: 'kg', label: 'Kilogramme (kg)' },
    { id: 'g', label: 'Gramme (g)' },
    { id: 'l', label: 'Litre (l)' },
    { id: 'ml', label: 'Millilitre (ml)' },
    { id: 'sac', label: 'Sac' },
    { id: 'boite', label: 'Boîte' },
    { id: 'autre', label: 'Autre' },
  ];

  const handleInputChange = (field: keyof OperationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.operation_type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'opération');
      return;
    }

    if (!formData.product.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du produit');
      return;
    }

    try {
      const operationData = {
        plot_id: plotId!,
        operation_type: formData.operation_type,
        product: formData.product,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit: formData.unit || null,
        operation_date: formData.operation_date,
        description: formData.description || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
      };

      console.log('🚜 [ADD_OPERATION] Données de l\'opération:', operationData);
      const newOperation = await createOperation(operationData);
      console.log('✅ [ADD_OPERATION] Opération ajoutée:', newOperation);
      
      Alert.alert(
        'Succès', 
        'Opération ajoutée avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'opération:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'opération');
    }
  };

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
        title="Nouvelle Opération" 
        subtitle="Ajouter une opération à cette parcelle"
        enableKeyboardAvoidance
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Box>
            <FormField label="Type d'opération" required>
              <FormSelect
                value={formData.operation_type}
                onValueChange={(value) => handleInputChange('operation_type', value)}
                options={operationTypes.map(opt => ({ value: opt.value, label: opt.label }))}
                placeholder="Sélectionner un type"
              />
            </FormField>

            <FormField label="Produit" required>
              <FormInput
                value={formData.product}
                onChangeText={(value) => handleInputChange('product', value)}
                placeholder="Nom du produit utilisé"
              />
            </FormField>

            <FormField label="Quantité">
              <FormInput
                value={formData.quantity}
                onChangeText={(value) => handleInputChange('quantity', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </FormField>

            <FormField label="Unité">
              <FormSelect
                value={formData.unit}
                onValueChange={(value) => handleInputChange('unit', value)}
                options={units.map(opt => ({ value: opt.id, label: opt.label }))}
                placeholder="Sélectionner une unité"
              />
            </FormField>

            <FormField label="Date d'opération">
              <FormDatePicker
                value={formData.operation_date}
                onChange={(value: string) => handleInputChange('operation_date', value)}
              />
            </FormField>

            <FormField label="Coût (FCFA)">
              <FormInput
                value={formData.cost}
                onChangeText={(value) => handleInputChange('cost', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </FormField>

            <FormField label="Description">
              <FormInput
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Description de l'opération..."
                multiline
                numberOfLines={3}
              />
            </FormField>

            <FormField label="Photos">
              <PhotoPicker
                entityType="operation"
                entityId={plotId!}
                onPhotosChange={setPhotos}
                existingPhotos={photos}
                maxPhotos={5}
                enableGPS={true}
              />
            </FormField>
          </Box>
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