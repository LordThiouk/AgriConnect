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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFicheCreation } from '../../../../hooks/useFicheCreation';
import { FicheCreationService } from '../../../../lib/services/fiche-creation';
import { Cooperative, FormStep } from '../../../../types/fiche-creation';
import { Colors } from '../../../../constants/Colors';

const CreateFicheScreen: React.FC = () => {
  const router = useRouter();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [isLoadingCooperatives, setIsLoadingCooperatives] = useState(true);

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
  } = useFicheCreation({
    agentId: 'd6daff9e-c1af-4a96-ab51-bd8925813890', // TODO: Récupérer depuis l'auth
  });

  // Charger les coopératives
  useEffect(() => {
    const loadCooperatives = async () => {
      try {
        const data = await FicheCreationService.getCooperatives();
        setCooperatives(data);
      } catch (error) {
        console.error('Erreur chargement coopératives:', error);
      } finally {
        setIsLoadingCooperatives(false);
      }
    };

    loadCooperatives();
  }, []);

  // Header personnalisé
  const HeaderTitle = useCallback(() => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="add-circle" size={24} color={Colors.primary} />
      <View style={{ marginLeft: 8 }}>
        <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>
          Nouvelle Fiche d'exploitation
        </Text>
        <Text style={{ color: Colors.text.secondary, fontSize: 12 }}>
          Étape {formState.currentStep} / 3
        </Text>
      </View>
    </View>
  ), [formState.currentStep]);

  const HeaderRight = useCallback(() => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      {formState.isSaving && (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
      )}
      {formState.lastSaved && (
        <Text style={{ color: Colors.text.secondary, fontSize: 10 }}>
          Sauvé {new Date(formState.lastSaved).toLocaleTimeString()}
        </Text>
      )}
    </View>
  ), [formState.isSaving, formState.lastSaved]);

  useLayoutEffect(() => {
    router.setOptions?.({
      headerTitle: () => <HeaderTitle />,
      headerRight: () => <HeaderRight />,
      headerStyle: { backgroundColor: Colors.white },
      headerTitleStyle: { color: Colors.text.primary },
      headerTintColor: Colors.text.primary,
      headerTitleAlign: 'left',
    } as any);
  }, [router, HeaderTitle, HeaderRight]);

  // Gestion de la géolocalisation
  const handleGetLocation = useCallback(async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        Alert.alert('Succès', 'Géolocalisation capturée avec succès');
      } else {
        Alert.alert('Erreur', 'Impossible d\'obtenir la géolocalisation');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la géolocalisation');
    }
  }, [getCurrentLocation]);

  // Gestion de la date de naissance
  const handleBirthDateChange = useCallback((birthDate: string) => {
    updateAgeAndIndicators(birthDate);
  }, [updateAgeAndIndicators]);

  // Gestion de la sauvegarde
  const handleSaveDraft = useCallback(async () => {
    try {
      const result = await saveDraft();
      if (result.success) {
        Alert.alert('Succès', 'Brouillon sauvegardé avec succès');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
    }
  }, [saveDraft]);

  const handleSaveFinal = useCallback(async () => {
    try {
      const result = await saveFinal();
      if (result.success) {
        Alert.alert('Succès', 'Fiche d\'exploitation créée avec succès', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/collecte') }
        ]);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la création');
    }
  }, [saveFinal, router]);

  // Rendu des étapes
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>1. Données organisationnelles</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom de la fiche *</Text>
        <TextInput
          style={[styles.input, getSectionErrors('organizationalData').length > 0 && styles.inputError]}
          placeholder="Ex: Fiche Exploitation Diouf"
          value={formData.organizationalData?.name || ''}
          onChangeText={(text) => updateFormData('organizationalData', { name: text })}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Département *</Text>
          <TextInput
            style={[styles.input, getSectionErrors('organizationalData').length > 0 && styles.inputError]}
            placeholder="Ex: Thiès"
            value={formData.organizationalData?.department || ''}
            onChangeText={(text) => updateFormData('organizationalData', { department: text })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Commune *</Text>
          <TextInput
            style={[styles.input, getSectionErrors('organizationalData').length > 0 && styles.inputError]}
            placeholder="Ex: Mbour"
            value={formData.organizationalData?.commune || ''}
            onChangeText={(text) => updateFormData('organizationalData', { commune: text })}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Village *</Text>
          <TextInput
            style={[styles.input, getSectionErrors('organizationalData').length > 0 && styles.inputError]}
            placeholder="Ex: Ndiaganiao"
            value={formData.organizationalData?.village || ''}
            onChangeText={(text) => updateFormData('organizationalData', { village: text })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Secteur *</Text>
          <TextInput
            style={[styles.input, getSectionErrors('organizationalData').length > 0 && styles.inputError]}
            placeholder="Ex: Secteur 1"
            value={formData.organizationalData?.sector || ''}
            onChangeText={(text) => updateFormData('organizationalData', { sector: text })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Coopérative *</Text>
        {isLoadingCooperatives ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.organizationalData?.cooperativeId || ''}
              onValueChange={(value) => updateFormData('organizationalData', { cooperativeId: value })}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner une coopérative" value="" />
              {cooperatives.map((coop) => (
                <Picker.Item key={coop.id} label={coop.name} value={coop.id} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date de recensement *</Text>
        <TextInput
          style={[styles.input, getSectionErrors('organizationalData').length > 0 && styles.inputError]}
          placeholder="YYYY-MM-DD"
          value={formData.organizationalData?.censusDate || ''}
          onChangeText={(text) => updateFormData('organizationalData', { censusDate: text })}
        />
      </View>

      <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation}>
        <Ionicons name="location" size={20} color={Colors.primary} />
        <Text style={styles.locationButtonText}>Capturer la géolocalisation GPS</Text>
      </TouchableOpacity>

      {formData.organizationalData?.gpsLatitude && (
        <View style={styles.gpsInfo}>
          <Text style={styles.gpsText}>
            GPS: {formData.organizationalData.gpsLatitude.toFixed(6)}, {formData.organizationalData.gpsLongitude?.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>2. Chef d'exploitation</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={[styles.input, getSectionErrors('producerData').length > 0 && styles.inputError]}
            placeholder="Ex: Amadou"
            value={formData.producerData?.firstName || ''}
            onChangeText={(text) => updateFormData('producerData', { firstName: text })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={[styles.input, getSectionErrors('producerData').length > 0 && styles.inputError]}
            placeholder="Ex: Diouf"
            value={formData.producerData?.lastName || ''}
            onChangeText={(text) => updateFormData('producerData', { lastName: text })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Statut *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.producerData?.status || 'Chef exploitation'}
            onValueChange={(value) => updateFormData('producerData', { status: value })}
            style={styles.picker}
          >
            <Picker.Item label="Chef exploitation" value="Chef exploitation" />
            <Picker.Item label="Producteur" value="Producteur" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date de naissance *</Text>
        <TextInput
          style={[styles.input, getSectionErrors('producerData').length > 0 && styles.inputError]}
          placeholder="YYYY-MM-DD"
          value={formData.producerData?.birthDate || ''}
          onChangeText={handleBirthDateChange}
        />
      </View>

      {formData.producerData?.age && (
        <View style={styles.ageInfo}>
          <Text style={styles.ageText}>Âge: {formData.producerData.age} ans</Text>
          {formData.producerData.isYoungProducer && (
            <View style={styles.youngProducerBadge}>
              <Text style={styles.youngProducerText}>Jeune producteur</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Sexe *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.producerData?.sex || 'M'}
              onValueChange={(value) => updateFormData('producerData', { sex: value })}
              style={styles.picker}
            >
              <Picker.Item label="Masculin" value="M" />
              <Picker.Item label="Féminin" value="F" />
            </Picker>
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Numéro CNI</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1234567890"
            value={formData.producerData?.cniNumber || ''}
            onChangeText={(text) => updateFormData('producerData', { cniNumber: text })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Alphabétisation *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.producerData?.literacy || 'Non'}
            onValueChange={(value) => updateFormData('producerData', { literacy: value })}
            style={styles.picker}
          >
            <Picker.Item label="Oui" value="Oui" />
            <Picker.Item label="Non" value="Non" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Langues parlées *</Text>
        <Text style={styles.helpText}>Sélectionnez au moins une langue</Text>
        {['Pular', 'Mandingue', 'Wolof', 'Français'].map((lang) => (
          <View key={lang} style={styles.checkboxRow}>
            <Switch
              value={formData.producerData?.languages?.includes(lang as any) || false}
              onValueChange={(value) => {
                const currentLanguages = formData.producerData?.languages || [];
                const newLanguages = value
                  ? [...currentLanguages, lang]
                  : currentLanguages.filter(l => l !== lang);
                updateFormData('producerData', { languages: newLanguages });
              }}
              trackColor={{ false: Colors.gray.light, true: Colors.primary }}
              thumbColor={Colors.white}
            />
            <Text style={styles.checkboxLabel}>{lang}</Text>
          </View>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Relais agricole formé *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.producerData?.isTrainedRelay || 'Non'}
            onValueChange={(value) => updateFormData('producerData', { isTrainedRelay: value })}
            style={styles.picker}
          >
            <Picker.Item label="Oui" value="Oui" />
            <Picker.Item label="Non" value="Non" />
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>3. Inventaire matériel</Text>
      
      <Text style={styles.subsectionTitle}>Pulvérisateurs</Text>
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Bon état</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={formData.equipmentData?.sprayers?.goodCondition?.toString() || '0'}
            onChangeText={(text) => updateFormData('equipmentData', {
              sprayers: { ...formData.equipmentData?.sprayers, goodCondition: parseInt(text) || 0 }
            })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Réparable</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={formData.equipmentData?.sprayers?.repairable?.toString() || '0'}
            onChangeText={(text) => updateFormData('equipmentData', {
              sprayers: { ...formData.equipmentData?.sprayers, repairable: parseInt(text) || 0 }
            })}
          />
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Matériel agricole</Text>
      <View style={styles.equipmentGrid}>
        {[
          { key: 'tractor', label: 'Tracteur' },
          { key: 'motocultor', label: 'Motoculteur' },
          { key: 'ucf', label: 'UCF' },
          { key: 'arara', label: 'Arara' },
          { key: 'other', label: 'Autres' },
        ].map(({ key, label }) => (
          <View key={key} style={styles.equipmentItem}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.equipmentData?.agriculturalEquipment?.[key as keyof typeof formData.equipmentData.agriculturalEquipment]?.toString() || '0'}
              onChangeText={(text) => updateFormData('equipmentData', {
                agriculturalEquipment: {
                  ...formData.equipmentData?.agriculturalEquipment,
                  [key]: parseInt(text) || 0
                }
              })}
            />
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>Outils manuels</Text>
      <View style={styles.equipmentGrid}>
        {[
          { key: 'hoeSine', label: 'Houe Sine' },
          { key: 'hoeWestern', label: 'Houe Occidentale' },
          { key: 'plows', label: 'Charrues' },
          { key: 'seeder', label: 'Semoir' },
          { key: 'ridger', label: 'Corps butteur' },
          { key: 'carts', label: 'Charrettes' },
        ].map(({ key, label }) => (
          <View key={key} style={styles.equipmentItem}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={formData.equipmentData?.manualTools?.[key as keyof typeof formData.equipmentData.manualTools]?.toString() || '0'}
              onChangeText={(text) => updateFormData('equipmentData', {
                manualTools: {
                  ...formData.equipmentData?.manualTools,
                  [key]: parseInt(text) || 0
                }
              })}
            />
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>Animaux de trait</Text>
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Bovins</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={formData.equipmentData?.draftAnimals?.cattle?.toString() || '0'}
            onChangeText={(text) => updateFormData('equipmentData', {
              draftAnimals: { ...formData.equipmentData?.draftAnimals, cattle: parseInt(text) || 0 }
            })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
          <Text style={styles.label}>Équins</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={formData.equipmentData?.draftAnimals?.horses?.toString() || '0'}
            onChangeText={(text) => updateFormData('equipmentData', {
              draftAnimals: { ...formData.equipmentData?.draftAnimals, horses: parseInt(text) || 0 }
            })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Ânes</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={formData.equipmentData?.draftAnimals?.donkeys?.toString() || '0'}
            onChangeText={(text) => updateFormData('equipmentData', {
              draftAnimals: { ...formData.equipmentData?.draftAnimals, donkeys: parseInt(text) || 0 }
            })}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Indicateur de progression */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              formState.currentStep >= step && styles.progressCircleActive,
              isStepComplete(step as FormStep) && styles.progressCircleCompleted
            ]}>
              <Text style={[
                styles.progressText,
                formState.currentStep >= step && styles.progressTextActive
              ]}>
                {step}
              </Text>
            </View>
            {step < 3 && (
              <View style={[
                styles.progressLine,
                formState.currentStep > step && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {formState.currentStep === 1 && renderStep1()}
        {formState.currentStep === 2 && renderStep2()}
        {formState.currentStep === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, formState.currentStep === 1 && styles.navButtonDisabled]}
          disabled={formState.currentStep === 1}
          onPress={goToPreviousStep}
        >
          <Text style={styles.navButtonText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.draftButton}
          onPress={handleSaveDraft}
          disabled={formState.isSaving}
        >
          <Text style={styles.draftButtonText}>Brouillon</Text>
        </TouchableOpacity>

        {formState.currentStep < 3 ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToNextStep}
            disabled={formState.isSaving}
          >
            <Text style={styles.primaryButtonText}>Suivant</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveFinal}
            disabled={formState.isSaving}
          >
            {formState.isSaving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Créer la fiche</Text>
            )}
          </TouchableOpacity>
        )}
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray.medium,
  },
  progressCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressCircleCompleted: {
    backgroundColor: Colors.success.dark,
    borderColor: Colors.success.dark,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray.medium,
  },
  progressTextActive: {
    color: Colors.white,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.gray.light,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  stepContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.gray.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray.light,
  },
  inputError: {
    borderColor: Colors.error.dark,
    backgroundColor: Colors.error.light,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickerContainer: {
    backgroundColor: Colors.gray.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray.light,
  },
  picker: {
    height: 50,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  locationButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  gpsInfo: {
    backgroundColor: Colors.success.light,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  gpsText: {
    fontSize: 12,
    color: Colors.success.dark,
    fontWeight: '500',
  },
  ageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  ageText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  youngProducerBadge: {
    backgroundColor: Colors.warning.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  youngProducerText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 12,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  equipmentItem: {
    width: '48%',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    backgroundColor: Colors.gray.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  draftButton: {
    backgroundColor: Colors.warning.dark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  draftButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default CreateFicheScreen;

