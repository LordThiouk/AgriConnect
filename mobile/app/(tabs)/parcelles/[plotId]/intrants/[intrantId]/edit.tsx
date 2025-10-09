import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InputsServiceInstance } from '../../../../../../lib/services/domain/inputs';
import { 
  ScreenContainer,
  FormContainer,
  FormField,
  FormInput,
  FormSelect,
  FormDatePicker,
  FormFooter,
  Card
} from '../../../../../../components/ui';

interface InputFormData {
  input_type: string;
  product_name: string;
  quantity: string;
  unit: string;
  application_date: string;
  description: string;
}

const inputTypes = [
  { id: 'fertilisant', label: 'Fertilisant' },
  { id: 'pesticide', label: 'Pesticide' },
  { id: 'herbicide', label: 'Herbicide' },
  { id: 'fongicide', label: 'Fongicide' },
  { id: 'semence', label: 'Semence' },
  { id: 'autre', label: 'Autre' },
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

export default function EditInputScreen() {
  const { plotId, intrantId } = useLocalSearchParams<{ plotId: string; intrantId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<InputFormData>({
    input_type: '',
    product_name: '',
    quantity: '',
    unit: '',
    application_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const loadInput = useCallback(async () => {
    if (!intrantId || !plotId) return;
    
    try {
      setLoading(true);
      
      // Récupérer tous les intrants de la parcelle via le service
      const inputs = await InputsServiceInstance.getLatestInputs(plotId);
      const input = inputs.find(i => i.id === intrantId);

      if (!input) {
        Alert.alert('Erreur', 'Intrant non trouvé');
        router.back();
        return;
      }

      console.log('✅ Intrant chargé:', input);
      
      // Récupérer les détails complets depuis la base
      const inputDetails = input;
      const error = null as any;

      if (error || !inputDetails) {
        console.error('❌ Erreur lors du chargement des détails:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails de l\'intrant');
        return;
      }
      
      // Remplir le formulaire avec les données existantes
      setFormData({
        input_type: inputDetails.input_type || '',
        product_name: inputDetails.product_name || '',
        quantity: inputDetails.quantity?.toString() || '',
        unit: inputDetails.unit || '',
        application_date: inputDetails.application_date || new Date().toISOString().split('T')[0],
        description: inputDetails.description || '',
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'intrant:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'intrant');
    } finally {
      setLoading(false);
    }
  }, [intrantId, plotId, router]);

  useEffect(() => {
    loadInput();
  }, [loadInput]);

  const handleInputChange = (field: keyof InputFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.input_type.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'intrant');
      return;
    }

    if (!formData.product_name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du produit');
      return;
    }

    if (!formData.quantity.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir la quantité');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        input_type: formData.input_type,
        product_name: formData.product_name.trim(),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit || null,
        application_date: formData.application_date,
        description: formData.description.trim() || null,
      };

      await InputsServiceInstance.updateInput(intrantId!, updateData);
      
      Alert.alert(
        'Succès', 
        'Intrant mis à jour avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'intrant:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'intrant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet intrant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await InputsServiceInstance.deleteInput(intrantId!);
              Alert.alert(
                'Succès',
                'Intrant supprimé avec succès',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'intrant');
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
        title="Modifier Intrant" 
        subtitle="Mettre à jour les informations"
        showBackButton
        onBack={() => router.back()}
      >
        <Card>
          <FormField label="Type d'intrant" required>
            <FormSelect
              value={formData.input_type}
              onValueChange={(value) => handleInputChange('input_type', value)}
              options={inputTypes.map(opt => ({ value: opt.id, label: opt.label }))}
              placeholder="Sélectionner un type"
            />
          </FormField>

          <FormField label="Nom du produit" required>
            <FormInput
              value={formData.product_name}
              onChangeText={(text) => handleInputChange('product_name', text)}
              placeholder="Nom du produit"
            />
          </FormField>

          <FormField label="Quantité" required>
            <FormInput
              value={formData.quantity}
              onChangeText={(text) => handleInputChange('quantity', text)}
              placeholder="Quantité utilisée"
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

          <FormField label="Date d'application">
            <FormDatePicker
              value={formData.application_date}
              onChange={(value: string) => handleInputChange('application_date', value)}
            />
          </FormField>

          <FormField label="Description">
            <FormInput
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Description de l'utilisation..."
              multiline
              numberOfLines={3}
            />
          </FormField>
        </Card>

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

