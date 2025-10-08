import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../lib/services/collecte';
import { useAuth } from '../../../../../context/AuthContext';
import { 
  FormContainer, 
  FormFooter, 
  Card, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormDatePicker,
  ScreenContainer
} from '../../../../../components/ui';
import { 
  Box, 
  HStack, 
  Pressable, 
  Text,
  useTheme,
  ScrollView
} from 'native-base';

interface IntervenantFormData {
  name: string;
  role: string;
  sex: string;
  birthdate: string;
  cni: string;
  is_young: boolean;
  literacy: boolean;
  languages: string;
}

const roleOptions = [
  { value: 'producteur', label: 'Producteur' },
  { value: 'agent', label: 'Agent' },
  { value: 'ouvrier', label: 'Ouvrier' },
  { value: 'superviseur', label: 'Superviseur' },
  { value: 'autre', label: 'Autre' },
];

const sexOptions = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
];

export default function AddIntervenantScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const [formData, setFormData] = useState<IntervenantFormData>({
    name: '',
    role: '',
    sex: '',
    birthdate: '',
    cni: '',
    is_young: false,
    literacy: false,
    languages: ''
  });

  const handleInputChange = (field: keyof IntervenantFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      // Récupérer le profile.id depuis l'auth user.id
      const { data: agentProfile, error: agentError } = await CollecteService.supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .eq('role', 'agent')
        .single();

      if (agentError || !agentProfile) {
        Alert.alert('Erreur', 'Agent non trouvé');
        return;
      }
      
      const intervenantData = {
        plot_id: plotId!,
        name: formData.name,
        role: formData.role,
        sex: formData.sex || null,
        birthdate: formData.birthdate || null,
        cni: formData.cni || null,
        is_young: formData.is_young,
        literacy: formData.literacy,
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()) : null,
        created_by: agentProfile.id
      };

      await CollecteService.addParticipant(intervenantData);
      
      Alert.alert(
        'Succès',
        'Intervenant ajouté avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'intervenant:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'intervenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer 
      title=""
      subtitle=""
      showSubHeader={false}
      showBackButton={false}
      animationEnabled={false}
    >
      <FormContainer 
        title="Nouvel Intervenant" 
        subtitle="Ajouter un intervenant à cette parcelle"
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <FormField label="Nom complet" required>
              <FormInput
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Nom et prénom"
              />
            </FormField>

            <FormField label="Rôle" required>
              <FormSelect
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                options={roleOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                placeholder="Sélectionner un rôle"
              />
            </FormField>

            <HStack space={4}>
              <Box flex={1}>
                <FormField label="Sexe">
                  <FormSelect
                    value={formData.sex}
                    onValueChange={(value) => handleInputChange('sex', value)}
                    options={sexOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                    placeholder="Sélectionner"
                  />
                </FormField>
              </Box>
              <Box flex={1}>
                <FormField label="Date de naissance">
                  <FormDatePicker
                    value={formData.birthdate}
                    onChange={(value: string) => handleInputChange('birthdate', value)}
                  />
                </FormField>
              </Box>
            </HStack>

            <FormField label="CNI">
              <FormInput
                value={formData.cni}
                onChangeText={(value) => handleInputChange('cni', value)}
                placeholder="Numéro de CNI"
              />
            </FormField>

            <HStack space={4}>
              <Box flex={1}>
                <FormField label="Jeune">
                  <Pressable
                    onPress={() => handleInputChange('is_young', !formData.is_young)}
                    _pressed={{ opacity: 0.8 }}
                  >
                    <Box
                      bg={formData.is_young ? (theme.colors.primary?.[500] || '#3D944B') : 'gray.100'}
                      borderRadius="md"
                      p={3}
                      alignItems="center"
                      borderWidth={1}
                      borderColor={formData.is_young ? (theme.colors.primary?.[500] || '#3D944B') : 'gray.200'}
                    >
                      <Text
                        color={formData.is_young ? 'white' : 'gray.600'}
                        fontSize="md"
                        fontWeight="semibold"
                      >
                        {formData.is_young ? 'Oui' : 'Non'}
                      </Text>
                    </Box>
                  </Pressable>
                </FormField>
              </Box>
              <Box flex={1}>
                <FormField label="Alphabétisé">
                  <Pressable
                    onPress={() => handleInputChange('literacy', !formData.literacy)}
                    _pressed={{ opacity: 0.8 }}
                  >
                    <Box
                      bg={formData.literacy ? (theme.colors.primary?.[500] || '#3D944B') : 'gray.100'}
                      borderRadius="md"
                      p={3}
                      alignItems="center"
                      borderWidth={1}
                      borderColor={formData.literacy ? (theme.colors.primary?.[500] || '#3D944B') : 'gray.200'}
                    >
                      <Text
                        color={formData.literacy ? 'white' : 'gray.600'}
                        fontSize="md"
                        fontWeight="semibold"
                      >
                        {formData.literacy ? 'Oui' : 'Non'}
                      </Text>
                    </Box>
                  </Pressable>
                </FormField>
              </Box>
            </HStack>

            <FormField label="Langues parlées">
              <FormInput
                value={formData.languages}
                onChangeText={(value) => handleInputChange('languages', value)}
                placeholder="Français, Wolof, Sérère (séparées par des virgules)"
              />
            </FormField>
          </Card>
        </ScrollView>

        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleSave}
          loading={loading}
        />
      </FormContainer>
    </ScreenContainer>
  );
}
