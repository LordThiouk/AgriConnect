import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../../../context/AuthContext';
import { CollecteService } from '../../../../../lib/services/collecte';
import ContentWithHeader from '../../../../../components/ContentWithHeader';

const AddCropScreen: React.FC = () => {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [seasons, setSeasons] = useState<{ id: string; label: string }[]>([]);
  const [formData, setFormData] = useState({
    crop_type: 'Maize',
    variety: '',
    sowing_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    status: 'en_cours',
    season_id: '',
  });

  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const cropTypes = [
    'Maize',
    'Rice', 
    'Millet',
    'Sorghum',
    'Groundnut',
    'Cotton',
    'Tomato',
    'Onion',
    'Other'
  ];

  const statusOptions = [
    { value: 'en_cours', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'abandoned', label: 'Abandonné' },
  ];

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const currentSeason = await CollecteService.getCurrentSeason();
      if (currentSeason) {
        setSeasons([{ id: currentSeason.id, label: currentSeason.name }]);
        setFormData(prev => ({ ...prev, season_id: currentSeason.id }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des saisons:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.variety.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir la variété de la culture');
      return;
    }

    if (!formData.season_id) {
      Alert.alert('Erreur', 'Aucune saison sélectionnée');
      return;
    }

    try {
      setLoading(true);
      
      const cropData = {
        plot_id: plotId!,
        season_id: formData.season_id,
        crop_type: formData.crop_type,
        variety: formData.variety.trim(),
        sowing_date: formData.sowing_date,
        status: formData.status,
        created_by: user?.id || null,
      };

      await CollecteService.createCrop(cropData, user?.id);
      
      Alert.alert(
        'Succès', 
        'Culture créée avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de la création de la culture:', error);
      Alert.alert('Erreur', 'Impossible de créer la culture');
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({ 
    label, 
    children, 
    required = false 
  }: { 
    label: string; 
    children: React.ReactNode; 
    required?: boolean;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      {children}
    </View>
  );

  const Dropdown = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    dropdownKey,
    required = false 
  }: { 
    label: string; 
    value: string; 
    options: { value: string; label: string }[]; 
    onSelect: (value: string) => void; 
    dropdownKey: string;
    required?: boolean;
  }) => {
    const isOpen = showDropdown === dropdownKey;
    const selectedOption = options.find(opt => opt.value === value);

    return (
      <FormField label={label} required={required}>
        <TouchableOpacity
          style={styles.dropdownContainer}
          onPress={() => setShowDropdown(isOpen ? null : dropdownKey)}
        >
          <Text style={styles.dropdownText}>
            {selectedOption?.label || `Sélectionner ${label.toLowerCase()}`}
          </Text>
          <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
        </TouchableOpacity>

        {isOpen && (
          <Modal
            transparent={true}
            visible={isOpen}
            onRequestClose={() => setShowDropdown(null)}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(null)}
            >
              <View style={styles.dropdownModal}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Sélectionner {label.toLowerCase()}</Text>
                  <TouchableOpacity
                    onPress={() => setShowDropdown(null)}
                    style={styles.closeButton}
                  >
                    <Feather name="x" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        item.value === value && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        onSelect(item.value);
                        setShowDropdown(null);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        item.value === value && styles.dropdownItemTextSelected
                      ]}>
                        {item.label}
                      </Text>
                      {item.value === value && (
                        <Feather name="check" size={16} color="#3D944B" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </FormField>
    );
  };

  return (
    <ContentWithHeader style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter une Culture</Text>
          <Text style={styles.subtitle}>Renseignez les informations de la nouvelle culture</Text>
        </View>

        <View style={styles.form}>
          <Dropdown
            label="Type de culture"
            value={formData.crop_type}
            options={cropTypes.map(type => ({ value: type, label: type }))}
            onSelect={(value) => setFormData(prev => ({ ...prev, crop_type: value }))}
            dropdownKey="crop_type"
            required
          />

          <FormField label="Variété" required>
            <TextInput
              style={styles.textInput}
              value={formData.variety}
              onChangeText={(text) => setFormData(prev => ({ ...prev, variety: text }))}
              placeholder="Ex: Variété locale, hybride..."
              placeholderTextColor="#9ca3af"
            />
          </FormField>

          <FormField label="Date de semis" required>
            <TextInput
              style={styles.textInput}
              value={formData.sowing_date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, sowing_date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
          </FormField>

          <Dropdown
            label="Statut"
            value={formData.status}
            options={statusOptions}
            onSelect={(value) => setFormData(prev => ({ ...prev, status: value }))}
            dropdownKey="status"
          />

          <Dropdown
            label="Saison"
            value={formData.season_id}
            options={seasons.map(season => ({ value: season.id, label: season.label }))}
            onSelect={(value) => setFormData(prev => ({ ...prev, season_id: value }))}
            dropdownKey="season"
            required
          />
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
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>
    </ContentWithHeader>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    padding: 20,
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
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3D944B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0fdf4',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#3D944B',
    fontWeight: '500',
  },
});

export default AddCropScreen;
