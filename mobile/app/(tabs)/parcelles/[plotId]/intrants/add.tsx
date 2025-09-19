import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../lib/services/collecte';
import { Crop } from '../../../../../types/collecte';
import { useAuth } from '../../../../../context/AuthContext';
import ContentWithHeader from '../../../../../components/ContentWithHeader';
import { Feather } from '@expo/vector-icons';

const FormField = ({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
  </View>
);

const Dropdown = ({ 
  value, 
  onSelect, 
  options, 
  placeholder, 
  showDropdown, 
  onToggle 
}: {
  value: string;
  onSelect: (value: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  showDropdown: boolean;
  onToggle: () => void;
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.dropdownText} onPress={onToggle}>
        <Text style={[styles.dropdownTextContent, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Feather name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Sélectionner {placeholder}</Text>
              <TouchableOpacity onPress={onToggle}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              {filteredOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    index === 0 && styles.dropdownItemFirst,
                    value === option.id && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    onSelect(option.id);
                    onToggle();
                    setSearchText('');
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    value === option.id && styles.dropdownItemTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
              {filteredOptions.length === 0 && (
                <View style={styles.emptySearchContainer}>
                  <Text style={styles.emptySearchText}>Aucun résultat trouvé</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const AddInputScreen: React.FC = () => {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [formData, setFormData] = useState({
    crop_id: '',
    category: '',
    label: '',
    quantity: '',
    unit: 'kg',
    planned: false,
    cost_fcfa: '',
    notes: ''
  });

  const [showCropDropdown, setShowCropDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const categories = [
    { id: 'semence', label: 'Semence' },
    { id: 'engrais', label: 'Engrais' },
    { id: 'pesticide', label: 'Pesticide' },
    { id: 'herbicide', label: 'Herbicide' },
    { id: 'autre', label: 'Autre' }
  ];

  const units = [
    { id: 'kg', label: 'Kilogrammes (kg)' },
    { id: 'l', label: 'Litres (l)' },
    { id: 'pieces', label: 'Pièces' },
    { id: 'sacs', label: 'Sacs' },
    { id: 'tonnes', label: 'Tonnes' }
  ];

  const loadCrops = useCallback(async () => {
    try {
      const data = await CollecteService.getCropsByPlotId(plotId, user?.id || '');
      setCrops(data);
    } catch (error) {
      console.error('Erreur lors du chargement des cultures:', error);
    }
  }, [plotId, user?.id]);

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

    if (!formData.category || !formData.label || !formData.quantity) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      const inputData = {
        plot_id: plotId!,
        crop_id: formData.crop_id || null,
        category: formData.category,
        label: formData.label || null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit: formData.unit || null,
        planned: formData.planned || null,
        cost_fcfa: formData.cost_fcfa ? parseFloat(formData.cost_fcfa) : null,
        notes: formData.notes || null,
        created_by: user?.id || ''
      };

      await CollecteService.addInput(inputData);
      
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
    <ContentWithHeader style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#3D944B" />
          </TouchableOpacity>
          <Text style={styles.title}>Ajouter un intrant</Text>
        </View>

        <View style={styles.form}>
          <FormField label="Culture" required>
            <Dropdown
              value={formData.crop_id}
              onSelect={(value) => setFormData(prev => ({ ...prev, crop_id: value }))}
              options={crops.map(crop => ({ id: crop.id, label: `${crop.crop_type} - ${crop.variety} (${crop.status})` }))}
              placeholder="Sélectionner une culture"
              showDropdown={showCropDropdown}
              onToggle={() => setShowCropDropdown(!showCropDropdown)}
            />
          </FormField>

          <FormField label="Catégorie" required>
            <Dropdown
              value={formData.category}
              onSelect={(value) => setFormData(prev => ({ ...prev, category: value }))}
              options={categories}
              placeholder="Sélectionner la catégorie"
              showDropdown={showCategoryDropdown}
              onToggle={() => setShowCategoryDropdown(!showCategoryDropdown)}
            />
          </FormField>

          <FormField label="Libellé" required>
            <TextInput
              style={styles.input}
              value={formData.label}
              onChangeText={(text) => setFormData(prev => ({ ...prev, label: text }))}
              placeholder="Nom de l'intrant"
            />
          </FormField>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormField label="Quantité" required>
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </FormField>
            </View>
            <View style={styles.halfField}>
              <FormField label="Unité">
                <Dropdown
                  value={formData.unit}
                  onSelect={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  options={units}
                  placeholder="Sélectionner l'unité"
                  showDropdown={showUnitDropdown}
                  onToggle={() => setShowUnitDropdown(!showUnitDropdown)}
                />
              </FormField>
            </View>
          </View>

          <FormField label="Coût (FCFA)">
            <TextInput
              style={styles.input}
              value={formData.cost_fcfa}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cost_fcfa: text }))}
              placeholder="0"
              keyboardType="numeric"
            />
          </FormField>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData(prev => ({ ...prev, planned: !prev.planned }))}
            >
              <View style={[styles.checkboxBox, formData.planned && styles.checkboxChecked]}>
                {formData.planned && <Feather name="check" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Intrant planifié</Text>
            </TouchableOpacity>
          </View>

          <FormField label="Notes">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Notes supplémentaires..."
              multiline
              numberOfLines={3}
            />
          </FormField>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ContentWithHeader>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownText: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdownTextContent: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholder: {
    color: '#9ca3af',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dropdownModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemFirst: {
    borderTopWidth: 0,
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownItemTextSelected: {
    color: '#3D944B',
    fontWeight: '600',
  },
  emptySearchContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#3D944B',
    borderColor: '#3D944B',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3D944B',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AddInputScreen;