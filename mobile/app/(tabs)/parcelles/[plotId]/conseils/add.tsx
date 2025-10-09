import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../../context/AuthContext';
import { RecommendationsServiceInstance } from '../../../../../lib/services/domain/recommendations';
import { CropsServiceInstance } from '../../../../../lib/services/domain/crops';
import { 
  ScreenContainer,
  FormContainer,
  FormFooter,
  Card,
  FormField,
  FormInput,
  FormSelect,
  VStack,
  Spinner
} from '../../../../../components/ui';
import { ScrollView, Text } from 'native-base';
import { RecommendationInsert } from '../../../../../types/collecte';

const recommendationTypes = [
  { label: 'Fertilisation', value: 'fertilisation' },
  { label: 'Traitement', value: 'traitement' },
  { label: 'Irrigation', value: 'irrigation' },
  { label: 'Ravageur/Maladie', value: 'pest_disease' },
  { label: 'Autre', value: 'autre' },
];

export default function AddRecommendationScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCrop = async () => {
      if (plotId) {
        try {
          const crop = await CropsServiceInstance.getActiveCropByPlotId(plotId);
          setActiveCropId(crop?.id || null);
        } catch (error) {
          console.error("Erreur_récupération_culture_active:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchActiveCrop();
  }, [plotId]);

  const handleSave = async () => {
    if (!plotId || !user || !title || !message || !type) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setIsSaving(true);
    const typeMap: Record<string, 'fertilizer' | 'pesticide' | 'irrigation' | 'harvest' | 'planting' | 'general' | 'alert'> = {
      fertilisation: 'fertilizer',
      traitement: 'pesticide',
      irrigation: 'irrigation',
      pest_disease: 'alert',
      autre: 'general'
    };
    const recData = {
      title,
      description: message,
      type: typeMap[type] || 'general',
      priority: 'medium' as const,
      applicable_crops: [],
      applicable_regions: [],
      applicable_seasons: [],
      conditions: 'Applicable au contexte courant',
      actions: [message],
      expected_benefits: 'Amélioration des pratiques',
      implementation_date: undefined,
      expires_at: undefined,
      metadata: { plot_id: plotId, crop_id: activeCropId, created_by: user.id }
    };
    
    try {
      await RecommendationsServiceInstance.create(recData);
      Alert.alert('Succès', 'Conseil enregistré avec succès.');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', "L'enregistrement du conseil a échoué.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <ScreenContainer 
        title=""
        subtitle=""
        showSubHeader={false}
        showBackButton={false}
        animationEnabled={false}
      >
        <FormContainer title="Nouveau Conseil" subtitle="Chargement de la culture active...">
          <VStack flex={1} alignItems="center" justifyContent="center" space={3} py={10}>
            <Spinner color="primary.500" size="lg" />
            <Text color="gray.600">Chargement...</Text>
          </VStack>
        </FormContainer>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title=""
      subtitle=""
      showSubHeader={false}
      showBackButton={false}
      animationEnabled={false}
      contentScrollable={false}
    >
      <FormContainer title="Nouveau Conseil" subtitle="Créer une recommandation pour cette parcelle" enableKeyboardAvoidance keyboardVerticalOffset={110}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card>
            <FormField label="Titre" required>
              <FormInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Alerte Mildiou"
              />
            </FormField>

            <FormField label="Type de conseil" required>
              <FormSelect
                options={recommendationTypes}
                onValueChange={(value) => setType(value || '')}
                value={type}
                placeholder="Sélectionner le type"
              />
            </FormField>

            <FormField label="Message / Recommandation" required>
              <FormInput
                value={message}
                onChangeText={setMessage}
                placeholder="Détaillez le conseil ici..."
                multiline
                numberOfLines={5}
              />
            </FormField>
          </Card>
        </ScrollView>

        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleSave}
          loading={isSaving}
          saveText={isSaving ? 'Enregistrement...' : 'Enregistrer'}
        />
      </FormContainer>
    </ScreenContainer>
  );
}
