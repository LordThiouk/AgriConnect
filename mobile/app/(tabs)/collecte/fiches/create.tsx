import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FormSelect } from '../../../../components/ui';

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
import { useAuth } from '../../../../context/AuthContext';
import { FormField } from '../../../../components/ui';
import { FormDatePicker } from '../../../../components/ui';
import CropFormView from '../../../../components/forms/CropForm';
import Step2Form from '../../../../components/fiche-creation/Step2Form';
import Step3Summary from '../../../../components/fiche-creation/Step3Summary';
import Step1Form from '../../../../components/fiche-creation/Step1Form';
import ParcelFormView from '../../../../components/forms/ParcelForm';
import { CooperativeService } from '../../../../lib/services/cooperatives';
import { LocationService } from '../../../../lib/services/location';
import { 
  ScreenContainer, 
  FormContainer, 
  Card, 
  Button, 
  Badge,
  FormInput,
  FormSelect as UIFormSelect
} from '../../../../components/ui';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable,
  useTheme,
  Switch,
  Checkbox,
  Progress,
  Divider,
  useColorModeValue
} from 'native-base';

const CreateFicheScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const params = useLocalSearchParams<{ farmFileId?: string; id?: string }>();
  const farmFileId = (params.farmFileId || params.id) as string | undefined;
  
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

  // Gestion GPS
  const handleGetCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        updateFormData('organizationalData', {
          ...formData.organizationalData,
          gpsLatitude: location.latitude,
          gpsLongitude: location.longitude,
        });
        
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
      typology: PARCEL_TYPOLOGY[0],
      cottonVariety: COTTON_VARIETIES[0],
      gpsLatitude: 0,
      gpsLongitude: 0,
      hasGps: false,
      location: '',
    };
    setCurrentParcel(newParcel);
    setParcelModalVisible(true);
  };

  const handleEditParcel = (parcel: ParcelData) => {
    setCurrentParcel(parcel);
    setParcelModalVisible(true);
  };

  const handleSaveParcel = (parcelData: ParcelData) => {
    if (currentParcel?.id.startsWith('new_')) {
      addParcel(parcelData);
    } else {
      updateParcel(currentParcel!.id, parcelData);
    }
    setParcelModalVisible(false);
    setCurrentParcel(null);
  };

  const handleCancelParcel = () => {
    setParcelModalVisible(false);
    setCurrentParcel(null);
  };

  // Gestion des cultures
  const handleAddCrop = (parcelId: string) => {
    const newCrop: CropData = {
      id: `crop_${Date.now()}`,
      type: CROP_TYPES[0],
      variety: '',
      area: 0.01,
      status: STATUS_OPTIONS[0],
      expectedYield: 0,
      actualYield: 0,
      sowingDate: new Date().toISOString().split('T')[0],
      expectedHarvestDate: new Date().toISOString().split('T')[0],
      notes: '',
    };
    addCropToParcel(parcelId, newCrop);
  };

  const handleEditCrop = (parcelId: string, crop: CropData) => {
    updateCropInParcel(parcelId, crop.id, crop);
  };

  const handleRemoveCrop = (parcelId: string, cropId: string) => {
    removeCropFromParcel(parcelId, cropId);
  };

  // Sauvegarde
  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      Alert.alert('Succès', 'Brouillon sauvegardé');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le brouillon');
    }
  };

  const handleSaveFinal = async () => {
    try {
      await saveFinal();
      Alert.alert('Succès', 'Fiche créée avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la fiche');
    }
  };

  // Navigation entre étapes
  const canGoNext = isStepComplete(formState.currentStep);
  const canGoPrevious = formState.currentStep > 1;

  const stepTitles = ['Fiche Exploitation', 'Parcelles & Cultures', 'Validation'];
  const progress = (formState.currentStep / 3) * 100;

  // Rendu des étapes
  const renderStep = () => {
    switch (formState.currentStep) {
      case 1:
        return (
          <Step1Form
            value={formData.organizationalData}
            cooperatives={cooperatives}
            onChange={(next) => updateFormData('organizationalData', next)}
            errors={getSectionErrors('organizationalData')}
            producerValue={formData.producerData}
            onChangeProducer={(next) => updateFormData('producerData', next)}
            errorsProducer={getSectionErrors('producerData')}
            equipmentValue={formData.equipmentData}
            onChangeEquipment={(next) => updateFormData('equipmentData', next)}
            errorsEquipment={getSectionErrors('equipmentData')}
          />
        );
      case 2:
        return (
          <Step2Form
            parcels={formData.parcels}
            onAddParcel={handleAddParcel}
            onEditParcel={handleEditParcel}
            onRemoveParcel={removeParcel}
          />
        );
      case 3:
        return (
          <Step3Summary
            organizationalData={formData.organizationalData}
            producerData={formData.producerData}
            parcels={formData.parcels}
            cooperatives={cooperatives}
          />
        );
      default:
        return null;
    }
  };

  if (isLoadingCooperatives) {
    return (
      <ScreenContainer title="Création de fiche" showBackButton={true}>
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.colors.primary?.[500]} />
          <Text mt={4} color="gray.600">Chargement des coopératives...</Text>
        </Box>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title="Création de fiche"
      subtitle={stepTitles[formState.currentStep - 1]}
      showBackButton={true}
      showSubHeader={true}
      animationEnabled={true}
    >
      <VStack flex={1} bg="gray.50">
        {/* Indicateur de progression */}
        <Box bg="white" px={4} py={3} borderBottomWidth={1} borderBottomColor="gray.200">
          <VStack space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                Étape {formState.currentStep} sur 3
              </Text>
              <Text fontSize="sm" color="primary.500" fontWeight="medium">
                {Math.round(progress)}%
              </Text>
            </HStack>
            <Progress value={Math.round(progress)} colorScheme="primary" size="sm" />
          </VStack>
        </Box>

        {/* Contenu de l'étape */}
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Actions du footer */}
        <Box bg="white" px={4} py={3} borderTopWidth={1} borderTopColor="gray.200">
          <HStack space={3} justifyContent="space-between">
            <Button
              title="Brouillon"
              variant="secondary"
              size="sm"
              onPress={handleSaveDraft}
              leftIcon={<Ionicons name="save-outline" size={16} color="#6c757d" />}
            />
            
            <HStack space={2}>
              {canGoPrevious && (
                <Button
                  title="Précédent"
                  variant="outline"
                  size="sm"
                  onPress={goToPreviousStep}
                  leftIcon={<Ionicons name="chevron-back" size={16} color="#6c757d" />}
                />
              )}
              
              {formState.currentStep < 3 ? (
                <Button
                  title="Suivant"
                  variant="primary"
                  size="sm"
                  onPress={goToNextStep}
                  disabled={!canGoNext}
                  rightIcon={<Ionicons name="chevron-forward" size={16} color="white" />}
                />
              ) : (
                <Button
                  title="Créer la fiche"
                  variant="primary"
                  size="sm"
                  onPress={handleSaveFinal}
                  disabled={!canGoNext}
                  leftIcon={<Ionicons name="checkmark" size={16} color="white" />}
                />
              )}
            </HStack>
          </HStack>
        </Box>
      </VStack>

      {/* Modale pour les parcelles */}
      <Modal
        visible={isParcelModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScreenContainer 
          title={currentParcel?.id.startsWith('new_') ? 'Nouvelle parcelle' : 'Modifier parcelle'}
          showBackButton={true}
          showSubHeader={true}
        >
          <ParcelFormView
            parcelData={currentParcel}
            onSave={handleSaveParcel}
            onCancel={handleCancelParcel}
            onGetLocation={getParcelLocation}
          />
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
};

export default CreateFicheScreen;