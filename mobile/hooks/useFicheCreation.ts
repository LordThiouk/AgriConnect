import { useState, useEffect, useCallback, useRef } from 'react';
import { FicheCreationData, FormState, FormStep, FormSection, SaveResult } from '../types/fiche-creation';
import { FicheCreationService } from '../lib/services/fiche-creation';
import { FicheCreationSchema } from '../types/fiche-creation';

interface UseFicheCreationProps {
  agentId: string;
  initialData?: Partial<FicheCreationData>;
  farmFileId?: string;
  autoSaveDelay?: number;
}

export const useFicheCreation = ({
  agentId,
  initialData,
  farmFileId,
  autoSaveDelay = 2000,
}: UseFicheCreationProps) => {
  // État du formulaire
  const [formData, setFormData] = useState<Partial<FicheCreationData>>(
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
        status: 'Chef exploitation',
        birthDate: '',
        age: 0,
        isYoungProducer: false,
        sex: 'M',
        literacy: 'Non',
        languages: [],
        isTrainedRelay: 'Non',
      },
      equipmentData: {
        sprayers: { goodCondition: 0, repairable: 0 },
        agriculturalEquipment: { tractor: 0, motocultor: 0, ucf: 0, arara: 0, other: 0 },
        manualTools: { hoeSine: 0, hoeWestern: 0, plows: 0, seeder: 0, ridger: 0, carts: 0 },
        draftAnimals: { cattle: 0, horses: 0, donkeys: 0 },
      },
    }
  );

  const [formState, setFormState] = useState<FormState>({
    currentStep: 1,
    completedSteps: [],
    isDirty: false,
    isSaving: false,
    errors: {},
  });

  // Refs pour l'auto-save
  const autoSaveRef = useRef<(() => void) | null>(null);
  const lastSaveRef = useRef<string | null>(null);

  // Initialiser l'auto-save
  useEffect(() => {
    autoSaveRef.current = FicheCreationService.createAutoSave(
      agentId,
      formData,
      farmFileId,
      autoSaveDelay
    );
  }, [agentId, formData, farmFileId, autoSaveDelay]);

  // Auto-save quand les données changent
  useEffect(() => {
    if (formState.isDirty && autoSaveRef.current) {
      autoSaveRef.current();
      setFormState(prev => ({ ...prev, lastSaved: new Date().toISOString() }));
    }
  }, [formData, formState.isDirty]);

  // Mettre à jour les données du formulaire
  const updateFormData = useCallback((
    section: FormSection,
    data: Partial<FicheCreationData[FormSection]>
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
    setFormState(prev => ({ ...prev, isDirty: true }));
  }, []);

  // Valider une section
  const validateSection = useCallback((section: FormSection): boolean => {
    const sectionData = formData[section];
    if (!sectionData) return false;

    const validation = FicheCreationService.validateSection(section, sectionData);
    
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
    const sectionMap: Record<FormStep, FormSection> = {
      1: 'organizationalData',
      2: 'producerData',
      3: 'equipmentData',
    };

    const section = sectionMap[currentStep];
    if (!section) return false;

    const isValid = validateSection(section);
    if (!isValid) return false;

    const nextStep = Math.min(3, currentStep + 1) as FormStep;
    setFormState(prev => ({
      ...prev,
      currentStep: nextStep,
      completedSteps: [...prev.completedSteps, currentStep],
    }));

    return true;
  }, [formState.currentStep, validateSection]);

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
      const result = await FicheCreationService.saveDraft(agentId, formData, farmFileId);
      
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
  }, [agentId, formData, farmFileId]);

  // Sauvegarder définitivement
  const saveFinal = useCallback(async (): Promise<SaveResult> => {
    setFormState(prev => ({ ...prev, isSaving: true }));

    try {
      // Valider toutes les sections
      const organizationalValid = validateSection('organizationalData');
      const producerValid = validateSection('producerData');
      const equipmentValid = validateSection('equipmentData');

      if (!organizationalValid || !producerValid || !equipmentValid) {
        return {
          success: false,
          error: 'Toutes les sections doivent être valides',
        };
      }

      // Valider le schéma complet
      const validatedData = FicheCreationSchema.parse(formData);
      const result = await FicheCreationService.saveFinal(agentId, validatedData, farmFileId);
      
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
  }, [agentId, formData, farmFileId, validateSection]);

  // Obtenir la géolocalisation
  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await FicheCreationService.getCurrentLocation();
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

  // Calculer l'âge et mettre à jour les indicateurs
  const updateAgeAndIndicators = useCallback((birthDate: string) => {
    const age = FicheCreationService.calculateAge(birthDate);
    const isYoungProducer = FicheCreationService.isYoungProducer(age);
    
    updateFormData('producerData', {
      birthDate,
      age,
      isYoungProducer,
    });
  }, [updateFormData]);

  // Vérifier si une étape est complète
  const isStepComplete = useCallback((step: FormStep): boolean => {
    return formState.completedSteps.includes(step);
  }, [formState.completedSteps]);

  // Vérifier si toutes les étapes sont complètes
  const isAllStepsComplete = useCallback((): boolean => {
    return formState.completedSteps.length === 3;
  }, [formState.completedSteps]);

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
        status: 'Chef exploitation',
        birthDate: '',
        age: 0,
        isYoungProducer: false,
        sex: 'M',
        literacy: 'Non',
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
    
    // Validation
    validateSection,
    isStepComplete,
    isAllStepsComplete,
    getSectionErrors,
  };
};
