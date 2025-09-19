import React, { useState, useEffect } from 'react';
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

const EditCropScreen: React.FC = () => {
  const { plotId, cropId } = useLocalSearchParams<{ plotId: string; cropId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form data
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [status, setStatus] = useState('');

  // Dropdown states
  const [showCropTypeDropdown, setShowCropTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Options
  const cropTypes = [
    { id: 'Maize', label: 'Maïs' },
    { id: 'Sorghum', label: 'Sorgho' },
    { id: 'Millet', label: 'Millet' },
    { id: 'Rice', label: 'Riz' },
    { id: 'Peanut', label: 'Arachide' },
    { id: 'Cotton', label: 'Coton' },
    { id: 'Tomato', label: 'Tomate' },
    { id: 'Onion', label: 'Oignon' },
    { id: 'Other', label: 'Autre' }
  ];

  const statusOptions = [
    { id: 'en_cours', label: 'En cours' },
    { id: 'completed', label: 'Terminé' },
    { id: 'abandoned', label: 'Abandonné' },
    { id: 'suspended', label: 'Suspendu' }
  ];

  useEffect(() => {
    if (cropId && user?.id) {
      loadCrop();
    }
  }, [cropId, user?.id]);

  const loadCrop = async () => {
    try {
      setLoading(true);
      const crops = await CollecteService.getCropsByPlotId(plotId, user?.id || '');
      const foundCrop = crops.find(c => c.id === cropId);
      
      if (foundCrop) {
        setCrop(foundCrop);
        setCropType(foundCrop.crop_type);
        setVariety(foundCrop.variety);
        setSowingDate(foundCrop.sowing_date);
        setStatus(foundCrop.status);
      } else {
        Alert.alert('Erreur', 'Culture non trouvée');
        router.back();
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la culture:', error);
      Alert.alert('Erreur', 'Impossible de charger la culture');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!cropType || !variety || !sowingDate || !status) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      await CollecteService.updateCrop(cropId, {
        crop_type: cropType,
        variety: variety,
        sowing_date: sowingDate,
        status: status
      }, user?.id || '');

      Alert.alert('Succès', 'Culture mise à jour avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la culture');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette culture ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await CollecteService.deleteCrop(cropId, user?.id || '');
              Alert.alert('Succès', 'Culture supprimée avec succès', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la culture');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ContentWithHeader style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3D944B" />
        <Text style={{ marginTop: 16, color: '#666' }}>Chargement...</Text>
      </ContentWithHeader>
    );
  }

  return (
    <ContentWithHeader style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#3D944B" />
          </TouchableOpacity>
          <Text style={styles.title}>Modifier la culture</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Feather name="trash-2" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <FormField label="Type de culture" required>
            <Dropdown
              value={cropType}
              onSelect={setCropType}
              options={cropTypes}
              placeholder="Sélectionner le type"
              showDropdown={showCropTypeDropdown}
              onToggle={() => setShowCropTypeDropdown(!showCropTypeDropdown)}
            />
          </FormField>

          <FormField label="Variété" required>
            <TextInput
              style={styles.input}
              value={variety}
              onChangeText={setVariety}
              placeholder="Entrer la variété"
            />
          </FormField>

          <FormField label="Date de semis" required>
            <TextInput
              style={styles.input}
              value={sowingDate}
              onChangeText={setSowingDate}
              placeholder="YYYY-MM-DD"
            />
          </FormField>

          <FormField label="Statut" required>
            <Dropdown
              value={status}
              onSelect={setStatus}
              options={statusOptions}
              placeholder="Sélectionner le statut"
              showDropdown={showStatusDropdown}
              onToggle={() => setShowStatusDropdown(!showStatusDropdown)}
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
            style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  deleteButton: {
    padding: 8,
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

export default EditCropScreen;
