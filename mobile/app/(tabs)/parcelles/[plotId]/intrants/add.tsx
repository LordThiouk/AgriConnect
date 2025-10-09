import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InputsServiceInstance } from '../../../../../lib/services/domain/inputs';
import { 
  FormContainer, 
  FormFooter, 
  ScreenContainer,
  FormInput,
  FormField,
  FormSelect,
  FormDatePicker
} from '../../../../../components/ui';
import { Box } from 'native-base';

function AddInputScreen() {
  console.log('🔄 [AddInputScreen] Component mounting');
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // États du formulaire
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!plotId) {
      Alert.alert('Erreur', 'ID de parcelle manquant');
      return;
    }

    if (!category || !productName || !quantity || !unit) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
             const inputData = {
               plot_id: plotId,
               name: productName,
               type: category.toLowerCase() as "fertilizer" | "pesticide" | "herbicide" | "fungicide" | "seed" | "equipment" | "other",
               category: category.toLowerCase(),
               input_type: category.toLowerCase(),
               product_name: productName,
               quantity: parseFloat(quantity) || 0,
               unit: unit,
               purchase_date: purchaseDate.toISOString().split('T')[0],
               supplier: supplier,
               cost: cost ? parseFloat(cost) : null,
               description: description,
               severity: 1, // Default severity
             };

      console.log('📦 [AddInputScreen] Création intrant:', inputData);
      
      await InputsServiceInstance.create(inputData);
      
      Alert.alert('Succès', 'Intrant ajouté avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('❌ [AddInputScreen] Erreur création intrant:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'intrant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer 
      title="Nouvel Intrant"
      subtitle="Ajouter un intrant à cette parcelle"
      showSubHeader={false}
      showBackButton={false}
      animationEnabled={false}
      contentScrollable={false}
    >
      <FormContainer 
        title="Nouvel Intrant" 
        subtitle="Ajouter un intrant à cette parcelle"
        enableKeyboardAvoidance
        keyboardVerticalOffset={100}
      >
        <Box p={4}>
          <FormField label="Catégorie" required>
            <FormSelect
              value={category}
              onValueChange={setCategory}
              options={[
                { value: 'fertilizer', label: 'Engrais' },
                { value: 'seed', label: 'Semence' },
                { value: 'pesticide', label: 'Pesticide' },
                { value: 'herbicide', label: 'Herbicide' },
                { value: 'other', label: 'Autre' }
              ]}
              placeholder="Sélectionner une catégorie"
            />
          </FormField>

          <FormField label="Nom du produit" required>
            <FormInput
              placeholder="Nom du produit"
              value={productName}
              onChangeText={setProductName}
            />
          </FormField>

          <FormField label="Quantité" required>
            <FormInput
              placeholder="0"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Unité" required>
            <FormSelect
              value={unit}
              onValueChange={setUnit}
              options={[
                { value: 'kg', label: 'Kilogramme' },
                { value: 'g', label: 'Gramme' },
                { value: 'L', label: 'Litre' },
                { value: 'mL', label: 'Millilitre' },
                { value: 'unit', label: 'Unité(s)' },
                { value: 'bag', label: 'Sac(s)' }
              ]}
              placeholder="Sélectionner une unité"
            />
          </FormField>

                 <FormField label="Date d'achat">
                   <FormDatePicker
                     value={purchaseDate.toISOString().split('T')[0]}
                     onChange={(value: string) => setPurchaseDate(new Date(value))}
                   />
                 </FormField>

          <FormField label="Fournisseur">
            <FormInput
              placeholder="Nom du fournisseur"
              value={supplier}
              onChangeText={setSupplier}
            />
          </FormField>

          <FormField label="Coût (FCFA)">
            <FormInput
              placeholder="0"
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Description">
            <FormInput
              placeholder="Description (optionnelle)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </FormField>
        </Box>
        
        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleSubmit}
          loading={loading}
        />
      </FormContainer>
    </ScreenContainer>
  );
}

export default React.memo(AddInputScreen);