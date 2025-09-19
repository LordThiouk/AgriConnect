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

const AddObservationScreen: React.FC = () => {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [formData, setFormData] = useState({
    crop_id: '',
    observation_type: 'levée',
    observation_date: new Date().toISOString().split('T')[0],
    emergence_percent: '',
    pest_disease_name: '',
    severity: 1,
    affected_area_percent: '',
    description: '',
    recommendations: ''
  });

  const [showCropDropdown, setShowCropDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const observationTypes = [
    { id: 'levée', label: 'Levée' },
    { id: 'maladie', label: 'Maladie' },
    { id: 'ravageur', label: 'Ravageur' },
    { id: 'stress_hydrique', label: 'Stress hydrique' },
    { id: 'stress_nutritionnel', label: 'Stress nutritionnel' },
    { id: 'développement', label: 'Développement' },
    { id: 'other', label: 'Autre' }
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

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une description');
      return;
    }

    try {
      setLoading(true);
      
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
        observed_by: user?.id || null
      };

      await CollecteService.addObservation(observationData);
      
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

  return (
    <ContentWithHeader style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#3D944B" />
          </TouchableOpacity>
          <Text style={styles.title}>Ajouter une observation</Text>
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

          <FormField label="Type d'observation" required>
            <Dropdown
              value={formData.observation_type}
              onSelect={(value) => setFormData(prev => ({ ...prev, observation_type: value }))}
              options={observationTypes}
              placeholder="Sélectionner le type"
              showDropdown={showTypeDropdown}
              onToggle={() => setShowTypeDropdown(!showTypeDropdown)}
            />
          </FormField>

          <FormField label="Date d'observation" required>
            <TextInput
              style={styles.input}
              value={formData.observation_date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, observation_date: text }))}
              placeholder="YYYY-MM-DD"
            />
          </FormField>

          {formData.observation_type === 'levée' && (
            <FormField label="Pourcentage de levée">
              <TextInput
                style={styles.input}
                value={formData.emergence_percent}
                onChangeText={(text) => setFormData(prev => ({ ...prev, emergence_percent: text }))}
                placeholder="0-100"
                keyboardType="numeric"
              />
            </FormField>
          )}

          {(formData.observation_type === 'maladie' || formData.observation_type === 'ravageur') && (
            <FormField label={`Nom du ${formData.observation_type === 'maladie' ? 'maladie' : 'ravageur'}`}>
              <TextInput
                style={styles.input}
                value={formData.pest_disease_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pest_disease_name: text }))}
                placeholder="Nom du ravageur ou maladie"
              />
            </FormField>
          )}

          <FormField label="Sévérité (1-5)">
            <View style={styles.severityContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    formData.severity === level && styles.severityButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, severity: level }))}
                >
                  <Text style={[
                    styles.severityText,
                    formData.severity === level && styles.severityTextSelected
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <FormField label="Zone affectée (%)">
            <TextInput
              style={styles.input}
              value={formData.affected_area_percent}
              onChangeText={(text) => setFormData(prev => ({ ...prev, affected_area_percent: text }))}
              placeholder="0-100"
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Description" required>
      <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Décrivez l'observation..."
        multiline
              numberOfLines={3}
            />
          </FormField>

          <FormField label="Recommandations">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.recommendations}
              onChangeText={(text) => setFormData(prev => ({ ...prev, recommendations: text }))}
              placeholder="Recommandations..."
              multiline
              numberOfLines={2}
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
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  severityButtonSelected: {
    backgroundColor: '#3D944B',
    borderColor: '#3D944B',
  },
  severityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  severityTextSelected: {
    color: '#fff',
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

export default AddObservationScreen;