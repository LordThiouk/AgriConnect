import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../lib/services/collecte';
import { 
  FormContainer, 
  FormFooter, 
  Card, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormDatePicker 
} from '../../../../../components/ui';

interface InputFormData {
  input_type: string;
  product_name: string;
  quantity: string;
  unit: string;
  purchase_date: string;
  supplier: string;
  cost: string;
  description: string;
}

export default function AddInputScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<InputFormData>({
    input_type: '',
    product_name: '',
    quantity: '',
    unit: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier: '',
    cost: '',
    description: '',
  });

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

  const handleInputChange = (field: keyof InputFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.input_type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'intrant');
      return;
    }

    if (!formData.product_name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du produit');
      return;
    }

    setLoading(true);

    try {
      // Récupérer le profil de l'agent actuel
      const { data: agentProfile, error: agentError } = await CollecteService.supabase
        .from('profiles')
        .select('id')
        .eq('role', 'agent')
        .single();

      if (agentError || !agentProfile) {
        Alert.alert('Erreur', 'Agent non trouvé');
        return;
      }
      
      const inputData = {
        plot_id: plotId!,
        input_type: formData.input_type,
        product_name: formData.product_name,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit: formData.unit || null,
        purchase_date: formData.purchase_date,
        supplier: formData.supplier || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        description: formData.description || null,
        added_by: agentProfile.id
      };

      const newInput = await CollecteService.addInput(inputData);
      console.log('✅ Intrant ajouté:', newInput);
      
      Alert.alert(
        'Succès', 
        'Intrant ajouté avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'intrant:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'intrant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer 
      title="Nouvel Intrant" 
      subtitle="Ajouter un intrant à cette parcelle"
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              onChangeText={(value) => handleInputChange('product_name', value)}
              placeholder="Nom du produit"
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

          <FormField label="Date d'achat">
            <FormDatePicker
              value={formData.purchase_date}
              onChange={(value: string) => handleInputChange('purchase_date', value)}
            />
          </FormField>

          <FormField label="Fournisseur">
            <FormInput
              value={formData.supplier}
              onChangeText={(value) => handleInputChange('supplier', value)}
              placeholder="Nom du fournisseur"
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
              placeholder="Description de l'intrant"
              multiline
              numberOfLines={4}
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
  );
}