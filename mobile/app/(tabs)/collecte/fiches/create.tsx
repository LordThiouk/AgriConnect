import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CompatiblePicker from '../../../../components/CompatiblePicker';

import { useFicheCreation } from '../../../../hooks/useFicheCreation';
import { FicheCreationService } from '../../../../lib/services/fiche-creation';
import { 
  Cooperative, 
  FormStep, 
  ParcelData,
  CropData,
  PARCEL_TYPOLOGY,
  PRODUCER_SIZE,
  COTTON_VARIETIES,
  CROP_TYPES,
  STATUS_OPTIONS,
  SEX_OPTIONS,
  LITERACY_OPTIONS,
  LANGUAGE_OPTIONS,
  FicheCreationCompleteData,
} from '../../../../types/fiche-creation';
import { Colors } from '../../../../constants/Colors';
// import { ParcelForm } from '../../../../components/ParcelForm'; // Supprimé car ParcelForm est défini localement
import { useAuth } from '../../../../context/AuthContext';
import FormField from '../../../../components/FormField';
import DateField from '../../../../components/DateField';
import CropFormView from '../../../../components/forms/CropForm';
import Step2Form from '../../../../components/fiche-creation/Step2Form';
import Step3Summary from '../../../../components/fiche-creation/Step3Summary';
import Step1Form from '../../../../components/fiche-creation/Step1Form';
import ParcelFormView from '../../../../components/forms/ParcelForm';
import { CooperativeService } from '../../../../lib/services/cooperatives';
import { LocationService } from '../../../../lib/services/location';

const CreateFicheScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ farmFileId?: string; id?: string }>();
  const farmFileId = (params.farmFileId || params.id) as string | undefined;
  console.log('🔗 Résolution farmFileId:', { params, farmFileId });
  const [initialData, setInitialData] = useState<any>(undefined);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [isLoadingCooperatives, setIsLoadingCooperatives] = useState(true);
  const [isParcelModalVisible, setParcelModalVisible] = useState(false);
  const [currentParcel, setCurrentParcel] = useState<ParcelData | null>(null);

  useEffect(() => {
    (async () => {
      if (farmFileId) {
        const draft = await FicheCreationService.loadDraft(farmFileId);
        if (draft) setInitialData(draft);
        if (draft) {
          console.log('✅ Draft chargé - parcelles:', Array.isArray((draft as any).parcels) ? (draft as any).parcels.length : 0);
        }
      }
    })();
  }, [farmFileId]);

  // Hook personnalisé pour la gestion du formulaire
  const {
    formData,
    formState,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    saveDraft,
    saveFinal,
    getCurrentLocation,
    updateAgeAndIndicators,
    isStepComplete,
    getSectionErrors,
    addParcel,
    updateParcel,
    removeParcel,
    addCropToParcel,
    updateCropInParcel,
    removeCropFromParcel,
    getParcelLocation,
  } = useFicheCreation({
    userId: user?.id,
    initialData,
    farmFileId,
  });

  useEffect(() => {
    const fetchCooperatives = async () => {
      setIsLoadingCooperatives(true);
      const fetchedCooperatives = await CooperativeService.getCooperatives();
      setCooperatives(fetchedCooperatives);
      setIsLoadingCooperatives(false);
    };

    fetchCooperatives();
  }, []);

  // Configuration du header
  useLayoutEffect(() => {
    const progress = (formState.currentStep / 3) * 100;
    const stepTitles = ['Fiche Exploitation', 'Parcelles & Cultures', 'Validation'];
    
    // Configuration du header avec indicateur de progression
    // Note: Cette partie sera gérée par le layout parent
  }, [formState.currentStep]);

  // Gestion GPS
  const handleGetCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        // Mettre à jour les données organisationnelles avec les coordonnées GPS
        updateFormData('organizationalData', {
          ...formData.organizationalData,
          gpsLatitude: location.latitude,
          gpsLongitude: location.longitude,
        });
        
        // Afficher les coordonnées capturées
        Alert.alert(
          'GPS Capturé',
          `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur GPS', 'Impossible de capturer la localisation');
    }
  };

  // Gestion des parcelles
  const handleAddParcel = () => {
    const newParcel: ParcelData = {
      id: `new_${Date.now()}`,
      name: '',
      totalArea: 0.01,
      crops: [],
      // Lier la parcelle au chef d'exploitation courant
      responsible: (formData.producerData as any),
      plantingWave: '1 vague',
      producerSize: 'Standard (< 3 ha)',
      typology: 'A',
      cottonVariety: 'CE',
    };
    setCurrentParcel(newParcel);
    setParcelModalVisible(true);
  };

  const handleEditParcel = (parcel: ParcelData) => {
    setCurrentParcel(parcel);
    setParcelModalVisible(true);
  };

  const handleSaveParcel = (parcelData: ParcelData) => {
    const trimmedName = (parcelData.name || '').trim();
    const safeParcel: ParcelData = {
      ...parcelData,
      name: trimmedName,
      totalArea: Math.max(0.01, typeof parcelData.totalArea === 'number' && !isNaN(parcelData.totalArea) ? parcelData.totalArea : 0.01),
      crops: parcelData.crops || [],
      responsible: (parcelData as any).responsible || (formData.producerData as any),
    } as any;
    if (currentParcel && formState.parcels.some(p => p.id === parcelData.id)) {
      // Mise à jour
      updateParcel(parcelData.id, safeParcel);
    } else {
      // Ajout
      addParcel(safeParcel);
    }
    setParcelModalVisible(false);
    setCurrentParcel(null);
  };
  
  const handleCancelParcel = () => {
    setParcelModalVisible(false);
    setCurrentParcel(null);
  };

  // Sauvegarder en brouillon
  const handleSaveDraft = async () => {
    try {
      const result = await saveDraft();
      if (result.success) {
        Alert.alert('Succès', 'Brouillon sauvegardé');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur de sauvegarde');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de sauvegarde');
    }
  };

  // Sauvegarder définitivement
  const handleSaveFinal = async () => {
    try {
      const result = await saveFinal();
      if (result.success) {
        Alert.alert('Succès', 'Fiche créée avec succès', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur de sauvegarde');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de sauvegarde');
    }
  };

  // Debug: Log de l'état du formulaire
  const debugFormState = () => {
    console.log('🔍 DEBUG - État du formulaire:');
    console.log('  - Étape actuelle:', formState.currentStep);
    console.log('  - Étapes complétées:', formState.completedSteps);
    console.log('  - Données organisationnelles:', formData.organizationalData);
    console.log('  - Données producteur:', formData.producerData);
    console.log('  - Données équipement:', formData.equipmentData);
    console.log('  - Parcelles:', formState.parcels);
    console.log('  - Erreurs:', formState.errors);
  };

  // Rendu de l'étape 1: Fiche Exploitation
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Données Organisationnelles</Text>
        <Step1Form
          value={formData.organizationalData as any}
          cooperatives={cooperatives}
          onChange={(next) => updateFormData('organizationalData', next as any)}
          errors={formState.errors.organizationalData as any}

          producerValue={formData.producerData as any}
          onChangeProducer={(next) => updateFormData('producerData', next as any)}
          errorsProducer={formState.errors.producerData as any}

          equipmentValue={formData.equipmentData as any}
          onChangeEquipment={(next) => updateFormData('equipmentData', next as any)}
          errorsEquipment={formState.errors.equipmentData as any}
        />
        <View style={styles.gpsSection}>
          <Text style={styles.label}>Géolocalisation GPS</Text>
          <TouchableOpacity style={styles.locationButton} onPress={handleGetCurrentLocation}>
            <Text style={styles.locationButtonText}>📍 Obtenir GPS automatique</Text>
          </TouchableOpacity>
          <Text style={styles.manualGpsLabel}>Ou saisir manuellement :</Text>
          <View style={styles.row}>
            <FormField
                label="Latitude"
                value={(formData.organizationalData as any)?.gpsLatitude?.toString() || ''}
                onChangeText={(text) => updateFormData('organizationalData', 'gpsLatitude', parseFloat(text) || undefined)}
                placeholder="14.6928"
                keyboardType="numeric"
            />
            <FormField
                label="Longitude"
                value={(formData.organizationalData as any)?.gpsLongitude?.toString() || ''}
                onChangeText={(text) => updateFormData('organizationalData', 'gpsLongitude', parseFloat(text) || undefined)}
                placeholder="-17.4467"
                keyboardType="numeric"
            />
          </View>
          {((formData.organizationalData as any)?.gpsLatitude && (formData.organizationalData as any)?.gpsLongitude) && (
            <View style={styles.gpsDisplay}>
              <Text style={styles.gpsLabel}>Coordonnées GPS :</Text>
              <Text style={styles.gpsCoordinates}>Lat: {(formData.organizationalData as any).gpsLatitude.toFixed(6)}</Text>
              <Text style={styles.gpsCoordinates}>Lng: {(formData.organizationalData as any).gpsLongitude.toFixed(6)}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  // Rendu de l'étape 2: Parcelles et Cultures
  const renderStep2 = () => (
    <ScrollView
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Step2Form
          parcels={formState.parcels}
          onAddParcel={handleAddParcel}
          onEditParcel={handleEditParcel}
          onRemoveParcel={removeParcel}
        />
      </View>
    </ScrollView>
  );

  // Rendu de l'étape 3: Validation
  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Step3Summary
          organizationalData={formData.organizationalData as any}
          producerData={formData.producerData as any}
          parcels={formState.parcels}
          cooperatives={cooperatives}
        />
      </View>
    </ScrollView>
  );
  
  // =================================================================
  // COMPOSANT LOCAL : ParcelForm
  // =================================================================
  const ParcelForm = ({
    isVisible,
    onClose,
    onSave,
    initialData,
  }: {
    isVisible: boolean;
    onClose: () => void;
    onSave: (data: ParcelData) => void;
    initialData?: ParcelData | null;
  }) => {
    const [parcel, setParcel] = useState<Partial<ParcelData>>(initialData || {});
    const [isCropModalVisible, setCropModalVisible] = useState(false);
    const [currentCrop, setCurrentCrop] = useState<CropData | null>(null);

    useEffect(() => {
        setParcel(initialData || {});
    }, [initialData]);

    const handleInputChange = (field: keyof ParcelData, value: any) => {
      setParcel(prev => ({ ...prev, [field]: value }));
    };
    
    // --- Gestion des cultures (maintenant interne à ParcelForm) ---
    const handleAddNewCrop = () => {
      const newCrop: CropData = {
        id: `new_crop_${Date.now()}`,
        type: 'Coton', variety: '',
        sowingDate: new Date().toISOString().split('T')[0], area: 0,
      };
      setCurrentCrop(newCrop);
      setCropModalVisible(true);
    };

    const handleEditCrop = (crop: CropData) => {
      setCurrentCrop(crop);
      setCropModalVisible(true);
    };

    const handleSaveCrop = (cropData: CropData) => {
      setParcel(prevParcel => {
        const existingCrop = prevParcel.crops?.find(c => c.id === cropData.id);
        let updatedCrops: CropData[];

        if (existingCrop) {
          updatedCrops = (prevParcel.crops || []).map(c => c.id === cropData.id ? cropData : c);
        } else {
          updatedCrops = [...(prevParcel.crops || []), cropData];
        }
        return { ...prevParcel, crops: updatedCrops };
      });
      setCropModalVisible(false);
      setCurrentCrop(null);
    };

    const handleDeleteCrop = (cropId: string) => {
      setParcel(prevParcel => {
        const updatedCrops = (prevParcel.crops || []).filter(c => c.id !== cropId);
        return { ...prevParcel, crops: updatedCrops };
      });
    };
    
    const handleSave = () => {
      const trimmedName = (parcel.name || '').trim();
      if (!trimmedName) {
        Alert.alert('Erreur', 'Le nom de la parcelle est obligatoire.');
        return;
      }
      const toSave = { ...parcel, name: trimmedName } as ParcelData;
      onSave(toSave);
    };

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalTitle}>{initialData?.id?.startsWith?.('new_') ? 'Ajouter une parcelle' : 'Modifier la parcelle'}</Text>
            
            <FormField
              label="Nom de la parcelle *"
              value={parcel.name || ''}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Ex: Champ du fond"
            />
            
            <FormField
              label="Surface totale (ha)"
              value={parcel.totalArea?.toString() || ''}
              onChangeText={(text) => handleInputChange('totalArea', parseFloat(text) || 0)}
              keyboardType="numeric"
              placeholder="Ex: 2.5"
            />

            <Text style={styles.label}>Typologie</Text>
            <CompatiblePicker
              selectedValue={parcel.typology}
              onValueChange={(value) => handleInputChange('typology', value)}
              items={PARCEL_TYPOLOGY.map(item => ({ label: item, value: item }))}
            />

            <Text style={styles.label}>Taille Producteur</Text>
            <CompatiblePicker
              selectedValue={parcel.producerSize}
              onValueChange={(value) => handleInputChange('producerSize', value)}
              items={PRODUCER_SIZE.map(item => ({ label: item, value: item }))}
            />

            <Text style={styles.label}>Variété Coton</Text>
            <CompatiblePicker
              selectedValue={parcel.cottonVariety}
              onValueChange={(value) => handleInputChange('cottonVariety', value)}
              items={COTTON_VARIETIES.map(item => ({ label: item, value: item }))}
            />

            <FormField
              label="Vague de plantation"
              value={parcel.plantingWave || ''}
              onChangeText={(text) => handleInputChange('plantingWave', text)}
              placeholder="Ex: 1ère vague"
            />
            
            <View style={styles.subsection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.subsectionTitle}>Cultures</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddNewCrop}>
                  <Text style={styles.addButtonText}>+ Ajouter culture</Text>
                </TouchableOpacity>
              </View>

              {parcel.crops?.length === 0 ? (
                <Text style={styles.emptyStateSubtext}>Aucune culture ajoutée.</Text>
              ) : (
                <View style={styles.parcelsList}>
                  {(parcel.crops || []).map(crop => (
                    <View key={crop.id} style={styles.parcelCard}>
                      <View style={styles.parcelHeader}>
                        <Text style={styles.parcelTitle}>{crop.type} - {crop.variety}</Text>
                        <View style={styles.parcelActions}>
                          <TouchableOpacity style={styles.editButton} onPress={() => handleEditCrop(crop)}>
                            <Text style={styles.editButtonText}>Modifier</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.removeButton} onPress={() => handleDeleteCrop(crop.id)}>
                            <Text style={styles.removeButtonText}>Supprimer</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.parcelInfo}>Surface: {crop.area} ha</Text>
                      <Text style={styles.parcelInfo}>Date de semis: {crop.sowingDate}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.previousButton} onPress={onClose}>
              <Text style={styles.previousButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CropFormView
          isVisible={isCropModalVisible}
          onClose={() => setCropModalVisible(false)}
          onSave={handleSaveCrop}
          initialData={currentCrop}
        />
      </Modal>
    );
  };


  // =================================================================
  // Rendu principal
  return (
    <View style={styles.container}>
      {/* Indicateur de progression */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(formState.currentStep / 3) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Étape {formState.currentStep}/3: {
            formState.currentStep === 1 ? 'Fiche Exploitation' :
            formState.currentStep === 2 ? 'Parcelles & Cultures' :
            'Validation'
          }
        </Text>
      </View>

      {/* Contenu de l'étape */}
      {formState.currentStep === 1 && renderStep1()}
      {formState.currentStep === 2 && renderStep2()}
      {formState.currentStep === 3 && renderStep3()}

      {/* Modale pour le formulaire de parcelle */}
      <ParcelFormView
          isVisible={isParcelModalVisible}
          onClose={handleCancelParcel}
          onSave={handleSaveParcel}
          initialData={currentParcel}
      />

      {/* Boutons de navigation */}
      <View style={styles.navigationContainer}>
        <View style={styles.buttonRow}>
          {formState.currentStep > 1 && (
            <TouchableOpacity style={styles.previousButton} onPress={goToPreviousStep}>
              <Text style={styles.previousButtonText}>Retour</Text>
        </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
            <Text style={styles.draftButtonText}>Brouillon</Text>
          </TouchableOpacity>

          {formState.currentStep < 3 ? (
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={goToNextStep}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        ) : (
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveFinal}
            >
              <Text style={styles.saveButtonText}>Créer la fiche</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray.light,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: Colors.gray.dark,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray.dark,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  locationButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  locationButtonText: {
    color: Colors.white,
    fontWeight: '500',
  },
  gpsDisplay: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  gpsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  gpsCoordinates: {
    fontSize: 12,
    color: '#0c4a6e',
    fontFamily: 'monospace',
  },
  tempMessage: {
    padding: 20,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
  },
  tempMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  tempMessageSubtext: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  manualGpsLabel: {
    fontSize: 14,
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#3d944b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  parcelsList: {
    gap: 12,
  },
  parcelCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parcelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d944b',
    flex: 1,
  },
  parcelActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  parcelInfo: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  summarySection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d944b',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  parcelSummary: {
    marginLeft: 16,
    marginBottom: 12,
  },
  parcelSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3d944b',
    marginBottom: 4,
  },
  navigationContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previousButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  previousButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  draftButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#3d944b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  checkboxIndicator: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  checkboxIndicatorSelected: {
    backgroundColor: '#3d944b',
    borderColor: '#3d944b',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  gpsSection: {
    marginTop: 16,
  },
  switchContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  // Styles pour la modale ParcelForm
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 50,
  },
  modalScrollView: {
    flex: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    backgroundColor: Colors.white,
  },
  // Styles pour la modale CropForm
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cropModalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
});

export default CreateFicheScreen;