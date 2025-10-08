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
import { Feather } from '@expo/vector-icons';
import { FormSelect } from '../../../../../../components/ui';
import { FormDatePicker } from '../../../../../../components/ui';

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
      const inputs = await CollecteService.getLatestInputs(plotId);
      const input = inputs.find(i => i.id === intrantId);

      if (!input) {
        Alert.alert('Erreur', 'Intrant non trouvé');
        router.back();
        return;
      }

      console.log('✅ Intrant chargé:', input);
      
      // Récupérer les détails complets depuis la base
      const { data: inputDetails, error } = await CollecteService.supabase
        .from('agricultural_inputs')
        .select('*')
        .eq('id', intrantId)
        .single();

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

      await CollecteService.updateInput(intrantId!, updateData);
      
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
              await CollecteService.deleteInput(intrantId!);
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

  if (loading && !formData.input_type) {
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
        <Text style={styles.title}>Modifier Intrant</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Feather name="trash-2" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <View style={styles.inputContainer}>
              <FormSelect
                label="Type d'intrant"
                value={formData.input_type}
                onValueChange={(value) => handleInputChange('input_type', value)}
                options={inputTypes.map(opt => ({ value: opt.id, label: opt.label }))}
                placeholder="Sélectionner un type"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nom du produit *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.product_name}
                onChangeText={(text) => handleInputChange('product_name', text)}
                placeholder="Nom du produit"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Quantité *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => handleInputChange('quantity', text)}
                placeholder="Quantité utilisée"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.inputContainer}>
              <FormSelect
                label="Unité"
                value={formData.unit}
                onValueChange={(value) => handleInputChange('unit', value)}
                options={units.map(opt => ({ value: opt.id, label: opt.name }))}
                placeholder="Sélectionner une unité"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.inputContainer}>
              <FormDatePicker
                label="Date d'application"
                value={formData.application_date}
                onChange={(value: string) => handleInputChange('application_date', value)}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Description</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Description de l'utilisation..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
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
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: 'transparent',
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
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#3D944B',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
