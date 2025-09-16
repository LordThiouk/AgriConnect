import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FicheCreationCompleteData,
  FormStateComplete,
  FormStep, 
  FormSection, 
  SaveResult,
  ParcelData,
  CropData,
  FicheCreationCompleteSchema,
  ParcelSchema,
  FicheCreationSchema,
  ParcelFormSchema,
} from '../types/fiche-creation';
import { FicheCreationService } from '../lib/services/fiche-creation';
import { LocationService } from '../lib/services/location';

interface UseFicheCreationProps {
  userId?: string;
  initialData?: Partial<FicheCreationCompleteData>;
  farmFileId?: string;
  autoSaveDelay?: number;
}
export const useFicheCreation = ({
  userId,
  initialData,
  farmFileId,
  autoSaveDelay = 2000,
}: UseFicheCreationProps) => {
  // État du formulaire complet
  const [formData, setFormData] = useState<Partial<FicheCreationCompleteData>>(
    initialData || {
      organizationalData: {
        name: '',
        department: '',
        commune: '',
        village: '',
        sector: '',
        cooperativeId: '',
        censusDate: new Date().toISOString().split('T')[0],
      },
      producerData: {
        firstName: '',
        lastName: '',
        status: "Chef d'exploitation",
        birthDate: '',
        age: 0,
        isYoungProducer: false,
        sex: 'Homme',
        literacy: 'Analphabète',
        languages: ['Français'],
        isTrainedRelay: 'Non',
      },
      equipmentData: {
        sprayers: { goodCondition: 0, repairable: 0 },
        agriculturalEquipment: { tractor: 0, motocultor: 0, ucf: 0, arara: 0, other: 0 },
        manualTools: { hoeSine: 0, hoeWestern: 0, plows: 0, seeder: 0, ridger: 0, carts: 0 },
        draftAnimals: { cattle: 0, horses: 0, donkeys: 0 },
      },
      parcels: [],
    }
  );

  const [formState, setFormState] = useState<FormStateComplete>({
    currentStep: 1,
    completedSteps: [],
    isDirty: false,
    isSaving: false,
    errors: {},
    parcels: (initialData?.parcels || []).map((p: any) => ({ ...p, crops: p.crops || [] })) as any,
  });

  // Hydrater les données si initialData ou farmFileId changent (édition)
  useEffect(() => {
    if (initialData || farmFileId) {
      const defaultProducer = {
        firstName: '',
        lastName: '',
        status: "Chef d'exploitation",
        birthDate: '',
        age: 0,
        isYoungProducer: false,
        sex: 'Homme',
        literacy: 'Analphabète',
        languages: [] as string[],
        isTrainedRelay: 'Non',
      };
      const defaultEquipment = {
        sprayers: { goodCondition: 0, repairable: 0 },
        agriculturalEquipment: { tractor: 0, motocultor: 0, ucf: 0, arara: 0, other: 0 },
        manualTools: { hoeSine: 0, hoeWestern: 0, plows: 0, seeder: 0, ridger: 0, carts: 0 },
        draftAnimals: { cattle: 0, horses: 0, donkeys: 0 },
      };

      const mergedProducer = { ...defaultProducer, ...(initialData?.producerData || {}) } as any;
      if (!Array.isArray(mergedProducer.languages) || mergedProducer.languages.length === 0) {
        mergedProducer.languages = ['Français'];
      }
      // Recalculer l'âge si manquant mais birthDate présent
      if (mergedProducer.birthDate && (!mergedProducer.age || mergedProducer.age === 0)) {
        const newAge = FicheCreationService.calculateAge(mergedProducer.birthDate);
        mergedProducer.age = newAge;
        mergedProducer.isYoungProducer = FicheCreationService.isYoungProducer(newAge);
      } else if (typeof mergedProducer.isYoungProducer !== 'boolean') {
        mergedProducer.isYoungProducer = FicheCreationService.isYoungProducer(mergedProducer.age || 0);
      }

      const mergedEquipment = {
        ...defaultEquipment,
        ...(initialData?.equipmentData || {}),
        sprayers: { ...defaultEquipment.sprayers, ...(initialData?.equipmentData as any)?.sprayers },
        agriculturalEquipment: { ...defaultEquipment.agriculturalEquipment, ...(initialData?.equipmentData as any)?.agriculturalEquipment },
        manualTools: { ...defaultEquipment.manualTools, ...(initialData?.equipmentData as any)?.manualTools },
        draftAnimals: { ...defaultEquipment.draftAnimals, ...(initialData?.equipmentData as any)?.draftAnimals },
      };

      setFormData(prev => ({
        ...prev,
        ...(initialData || {}),
        producerData: mergedProducer,
        equipmentData: mergedEquipment,
      }));

      if (initialData?.parcels) {
        const normalizedParcels = (initialData.parcels as any[]).map(p => ({ ...p, crops: p.crops || [] }));
        setFormState(prev => ({ ...prev, parcels: normalizedParcels as any, isDirty: false }));
        console.log('[useFicheCreation] Parcelles hydratées:', initialData.parcels.length);
      }
    }
  }, [initialData, farmFileId]);

  // Refs pour l'auto-save
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save quand les données changent
  useEffect(() => {
    // Uniquement sauvegarder si un brouillon existe déjà (farmFileId est présent)
    if (formState.isDirty && farmFileId && userId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('📝 Déclenchement de la sauvegarde automatique...');
        // Rassembler toutes les données actuelles
        const dataToSave = { ...formData, parcels: formState.parcels };
        // Appeler le service avec les bons paramètres
        FicheCreationService.saveDraft(dataToSave, farmFileId);
        // Marquer le formulaire comme non-modifié après sauvegarde
        setFormState(prev => ({ ...prev, isDirty: false, lastSaved: new Date().toISOString() }));
      }, autoSaveDelay);
    }

    // Nettoyer le timeout si le composant est démonté
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, formState.isDirty, formState.parcels, farmFileId, userId, autoSaveDelay]);

  // Mettre à jour les données du formulaire
  const updateFormData = useCallback((
    section: keyof FicheCreationCompleteData,
    keyOrData: string | object,
    value?: any
  ) => {
    setFormData(prev => {
      const newSectionData = typeof keyOrData === 'string'
        ? { ...prev[section], [keyOrData]: value }
        : { ...prev[section], ...keyOrData };
      
      return { ...prev, [section]: newSectionData };
    });
    setFormState(prev => ({ ...prev, isDirty: true }));
  }, []);

  // Valider une section
  const validateSection = useCallback((section: 'organizationalData' | 'producerData' | 'equipmentData'): boolean => {
    console.log(`🔍 Validation section: ${section}`);
    const sectionData = formData[section];
    console.log(`  - Données section:`, sectionData);
    
    if (!sectionData) {
      console.log(`  ❌ Pas de données pour ${section}`);
      return false;
    }

    const validation = FicheCreationService.validateSection(section, sectionData);
    console.log(`  - Résultat validation:`, validation);
    
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [section]: validation.errors,
      },
    }));

    return validation.isValid;
  }, [formData]);

  // Passer à l'étape suivante
  const goToNextStep = useCallback(() => {
    const currentStep = formState.currentStep;
    console.log('🔄 goToNextStep appelé - Étape actuelle:', currentStep);
    
    // Validation spécifique selon l'étape
    let isValid = false;
    
    if (currentStep === 1) {
      console.log('🔍 Validation étape 1...');
      // Valider les 3 sections de l'étape 1
      const orgValid = validateSection('organizationalData');
      const prodValid = validateSection('producerData');
      const equipValid = validateSection('equipmentData');
      
      console.log('  - Données organisationnelles:', orgValid);
      console.log('  - Données producteur:', prodValid);
      console.log('  - Données équipement:', equipValid);
      
      isValid = orgValid && prodValid && equipValid;
    } else if (currentStep === 2) {
      console.log('🔍 Validation étape 2...');
      // Valider qu'au moins une parcelle est ajoutée et que chaque parcelle respecte ParcelFormSchema (name + totalArea)
      const hasAny = formState.parcels.length > 0;
      const perParcelValid = formState.parcels.every(p => {
        const trimmed = { ...p, name: (p.name || '').trim() } as any;
        const res = (ParcelFormSchema as any).safeParse({ name: trimmed.name, totalArea: trimmed.totalArea });
        return !!res.success;
      });
      isValid = hasAny && perParcelValid;
      console.log('  - Nombre de parcelles:', formState.parcels.length, '| Parcelles valides:', perParcelValid);
    } else if (currentStep === 3) {
      console.log('🔍 Étape 3 - toujours accessible');
      // Étape de validation, toujours valide
      isValid = true;
    }

    console.log('✅ Peut continuer:', isValid);

    if (!isValid) {
      console.log('❌ Validation échouée - retour false');
      return false;
    }

    const nextStep = Math.min(3, currentStep + 1) as FormStep;
    console.log('➡️ Passage à l\'étape:', nextStep);
    
    setFormState(prev => ({
      ...prev,
      currentStep: nextStep,
      completedSteps: [...prev.completedSteps, currentStep],
    }));

    return true;
  }, [formState.currentStep, formState.parcels.length, validateSection]);

  // Revenir à l'étape précédente
  const goToPreviousStep = useCallback(() => {
    const currentStep = formState.currentStep;
    if (currentStep <= 1) return false;

    const previousStep = (currentStep - 1) as FormStep;
    setFormState(prev => ({
      ...prev,
      currentStep: previousStep,
      completedSteps: prev.completedSteps.filter(step => step !== previousStep),
    }));

    return true;
  }, [formState.currentStep]);

  // Aller à une étape spécifique
  const goToStep = useCallback((step: FormStep) => {
    if (step < 1 || step > 3) return false;
    
    setFormState(prev => ({
      ...prev,
      currentStep: step,
    }));

    return true;
  }, []);

  // Sauvegarder en brouillon
  const saveDraft = useCallback(async (): Promise<SaveResult> => {
    setFormState(prev => ({ ...prev, isSaving: true }));

    try {
      const result = await FicheCreationService.saveDraft(formData, farmFileId);
      
      if (result.success) {
        setFormState(prev => ({
          ...prev,
          isDirty: false,
          lastSaved: new Date().toISOString(),
        }));
      }

      return result;
    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    } finally {
      setFormState(prev => ({ ...prev, isSaving: false }));
    }
  }, [formData, farmFileId]);

  // Sauvegarder définitivement
  const saveFinal = useCallback(async (): Promise<SaveResult> => {
    setFormState(prev => ({ ...prev, isSaving: true }));

    try {
      // Valider toutes les sections de l'étape 1
      const organizationalValid = validateSection('organizationalData');
      const producerValid = validateSection('producerData');
      const equipmentValid = validateSection('equipmentData');

      if (!organizationalValid || !producerValid || !equipmentValid) {
        return {
          success: false,
          error: 'Toutes les sections de l\'étape 1 doivent être valides',
        };
      }

      // Valider qu'au moins une parcelle est présente
      if (formState.parcels.length === 0) {
        return {
          success: false,
          error: 'Au moins une parcelle est requise',
        };
      }

      // Valider chaque parcelle (champ minimal requis uniquement)
      for (const parcel of formState.parcels) {
        const minimal = { name: (parcel.name || '').trim(), totalArea: parcel.totalArea } as any;
        const parcelValidation = (ParcelFormSchema as any).safeParse(minimal);
        if (!parcelValidation.success) {
          const msg = parcelValidation.error.issues[0]?.message || 'Champs parcelle invalides';
          return { success: false, error: `Parcelle ${parcel.name || ''}: ${msg}` };
        }
      }

      // S'assurer d'avoir un farmFileId (créer un brouillon si nécessaire)
      let effectiveFarmFileId = farmFileId;
      if (!effectiveFarmFileId) {
        const draftRes = await FicheCreationService.saveDraft(formData, undefined as any);
        if (!draftRes.success || !draftRes.farmFileId) {
          return { success: false, error: draftRes.error || 'Impossible de créer le brouillon' };
        }
        effectiveFarmFileId = draftRes.farmFileId;
      }

      // Valider le schéma complet
      const completeData = {
        ...formData,
        parcels: formState.parcels,
      } as FicheCreationCompleteData;
      const validatedData = FicheCreationCompleteSchema.parse(completeData);

      const result = await FicheCreationService.saveFinal(validatedData, effectiveFarmFileId as string);
      
      if (result.success) {
        setFormState(prev => ({
          ...prev,
          isDirty: false,
          completedSteps: [1, 2, 3],
        }));
      }

      return result;
    } catch (error) {
      console.error('Erreur sauvegarde finale:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    } finally {
      setFormState(prev => ({ ...prev, isSaving: false }));
    }
  }, [formData, farmFileId, formState.parcels, validateSection]);

  // Obtenir la géolocalisation
  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        updateFormData('organizationalData', {
          gpsLatitude: location.latitude,
          gpsLongitude: location.longitude,
        });
      }
      return location;
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      return null;
    }
  }, [updateFormData]);

  // Calculer l'âge et mettre à jour les indicateurs (prend en compte censusDate s'il existe)
  const updateAgeAndIndicators = useCallback((birthDate: string) => {
    const censusDate = (formData.organizationalData as any)?.censusDate;
    const age = FicheCreationService.calculateAge(birthDate, censusDate);
    const isYoungProducer = FicheCreationService.isYoungProducer(age);
    updateFormData('producerData', { birthDate, age, isYoungProducer });
  }, [formData.organizationalData, updateFormData]);

  // Recalcule l'âge lorsque birthDate ou censusDate changent
  useEffect(() => {
    const bd = (formData.producerData as any)?.birthDate;
    if (bd) {
      const censusDate = (formData.organizationalData as any)?.censusDate;
      const age = FicheCreationService.calculateAge(bd, censusDate);
      const isYoungProducer = FicheCreationService.isYoungProducer(age);
      setFormData(prev => ({
        ...prev,
        producerData: { ...(prev as any).producerData, age, isYoungProducer },
      }));
    }
  }, [formData.producerData?.birthDate, formData.organizationalData?.censusDate]);

  // Vérifier si une étape est complète
  const isStepComplete = useCallback((step: FormStep): boolean => {
    return formState.completedSteps.includes(step);
  }, [formState.completedSteps]);

  // Vérifier si toutes les étapes sont complètes
  const isAllStepsComplete = useCallback((): boolean => {
    return formState.completedSteps.length === 3;
  }, [formState.completedSteps]);

  // Gestion des parcelles
  const addParcel = useCallback((parcelData: Omit<ParcelData, 'id'>) => {
    const newParcel: ParcelData = {
      ...parcelData,
      id: `parcel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    // Normaliser pour éviter les validations parasites
    const normalized: ParcelData = {
      ...newParcel,
      name: (newParcel.name || '').trim(),
      totalArea: Math.max(0.01, typeof newParcel.totalArea === 'number' && !isNaN(newParcel.totalArea) ? newParcel.totalArea : 0.01),
      crops: newParcel.crops || [],
      responsible: (newParcel as any).responsible || (formData.producerData as any),
    } as any;
    
    setFormState(prev => ({
      ...prev,
      parcels: [...prev.parcels, normalized],
      isDirty: true,
    }));
  }, [formData.producerData]);

  const updateParcel = useCallback((parcelId: string, updates: Partial<ParcelData>) => {
    setFormState(prev => ({
      ...prev,
      parcels: prev.parcels.map(parcel => 
        parcel.id === parcelId ? {
          ...parcel,
          ...updates,
          name: ((updates.name ?? parcel.name) || '').trim(),
          totalArea: Math.max(0.01, typeof (updates.totalArea ?? parcel.totalArea) === 'number' && !isNaN((updates.totalArea ?? parcel.totalArea) as number) ? (updates.totalArea ?? parcel.totalArea)! : 0.01),
          crops: (updates.crops ?? parcel.crops) || [],
          responsible: ((updates as any).responsible ?? parcel.responsible) || (formData.producerData as any),
        } : parcel
      ),
      isDirty: true,
    }));
  }, [formData.producerData]);

  const removeParcel = useCallback((parcelId: string) => {
    setFormState(prev => ({
      ...prev,
      parcels: prev.parcels.filter(parcel => parcel.id !== parcelId),
      isDirty: true,
    }));
  }, []);

  const addCropToParcel = useCallback((parcelId: string, cropData: Omit<CropData, 'id'>) => {
    const newCrop: CropData = {
      ...cropData,
      id: `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setFormState(prev => ({
      ...prev,
      parcels: prev.parcels.map(parcel => 
        parcel.id === parcelId 
          ? { ...parcel, crops: [...parcel.crops, newCrop] }
          : parcel
      ),
      isDirty: true,
    }));
  }, []);

  const updateCropInParcel = useCallback((parcelId: string, cropId: string, updates: Partial<CropData>) => {
    setFormState(prev => ({
      ...prev,
      parcels: prev.parcels.map(parcel => 
        parcel.id === parcelId 
          ? {
              ...parcel,
              crops: parcel.crops.map(crop => 
                crop.id === cropId ? { ...crop, ...updates } : crop
              )
            }
          : parcel
      ),
      isDirty: true,
    }));
  }, []);

  const removeCropFromParcel = useCallback((parcelId: string, cropId: string) => {
    setFormState(prev => ({
      ...prev,
      parcels: prev.parcels.map(parcel => 
        parcel.id === parcelId 
          ? { ...parcel, crops: parcel.crops.filter(crop => crop.id !== cropId) }
          : parcel
      ),
      isDirty: true,
    }));
  }, []);

  // Obtenir la géolocalisation pour une parcelle
  const getParcelLocation = useCallback(async (parcelId: string) => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        updateParcel(parcelId, {
          gpsLatitude: location.latitude,
          gpsLongitude: location.longitude,
        });
      }
      return location;
    } catch (error) {
      console.error('Erreur géolocalisation parcelle:', error);
      return null;
    }
  }, [updateParcel]);

  // Obtenir les erreurs d'une section
  const getSectionErrors = useCallback((section: FormSection): string[] => {
    return formState.errors[section] || [];
  }, [formState.errors]);

  // Réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setFormData(initialData || {
      organizationalData: {
        name: '',
        department: '',
        commune: '',
        village: '',
        sector: '',
        cooperativeId: '',
        censusDate: new Date().toISOString().split('T')[0],
      },
      producerData: {
        firstName: '',
        lastName: '',
        status: "Chef d'exploitation",
        birthDate: '',
        age: 0,
        isYoungProducer: false,
        sex: 'Homme',
        literacy: 'Analphabète',
        languages: [],
        isTrainedRelay: 'Non',
      },
      equipmentData: {
        sprayers: { goodCondition: 0, repairable: 0 },
        agriculturalEquipment: { tractor: 0, motocultor: 0, ucf: 0, arara: 0, other: 0 },
        manualTools: { hoeSine: 0, hoeWestern: 0, plows: 0, seeder: 0, ridger: 0, carts: 0 },
        draftAnimals: { cattle: 0, horses: 0, donkeys: 0 },
      },
    });
    setFormState({
      currentStep: 1,
      completedSteps: [],
      isDirty: false,
      isSaving: false,
      errors: {},
      parcels: [],
    });
  }, [initialData]);

  return {
    // Données
    formData,
    formState,
    
    // Actions
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    saveDraft,
    saveFinal,
    getCurrentLocation,
    updateAgeAndIndicators,
    resetForm,
    
    // Gestion des parcelles
    addParcel,
    updateParcel,
    removeParcel,
    addCropToParcel,
    updateCropInParcel,
    removeCropFromParcel,
    getParcelLocation,
    
    // Validation
    validateSection,
    isStepComplete,
    isAllStepsComplete,
    getSectionErrors,
  };
};

