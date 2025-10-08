import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../../lib/services/collecte';
import { 
  FormSelect, 
  FormDatePicker, 
  ScreenContainer,
  FormContainer,
  FormFooter,
  Card,
  FormField,
  FormInput
} from '../../../../../../components/ui';
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

export default function EditIntervenantScreen() {
  const { plotId, participantId } = useLocalSearchParams<{ plotId: string; participantId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

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

  const loadParticipant = useCallback(async () => {
    if (!participantId || !plotId) return;
    
    try {
      setLoading(true);
      
      // Récupérer tous les participants de la parcelle via le service
      const participants = await CollecteService.getParticipantsByPlotId(plotId);
      const participant = participants.find(p => p.id === participantId);

      if (!participant) {
        Alert.alert('Erreur', 'Intervenant non trouvé');
        router.back();
        return;
      }

      console.log('✅ Intervenant chargé:', participant);
      
      // Remplir le formulaire avec les données existantes
      setFormData({
        name: participant.name || '',
        role: participant.role || '',
        sex: (participant as any).sex || '',
        birthdate: (participant as any).birthdate || '',
        cni: (participant as any).cni || '',
        is_young: (participant as any).is_young || false,
        literacy: (participant as any).literacy || false,
        languages: (participant as any).languages ? (participant as any).languages.join(', ') : '',
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'intervenant:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'intervenant');
    } finally {
      setLoading(false);
    }
  }, [participantId, plotId, router]);

  useEffect(() => {
    loadParticipant();
  }, [loadParticipant]);

  const handleInputChange = (field: keyof IntervenantFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom');
      return;
    }

    if (!formData.role.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        name: formData.name.trim(),
        role: formData.role,
        sex: formData.sex || null,
        birthdate: formData.birthdate || null,
        cni: formData.cni || null,
        is_young: formData.is_young,
        literacy: formData.literacy,
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()) : null,
      };

      await CollecteService.updateParticipant(participantId!, updateData);
      
      Alert.alert(
        'Succès', 
        'Intervenant mis à jour avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'intervenant:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'intervenant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet intervenant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await CollecteService.deleteParticipant(participantId!);
              Alert.alert(
                'Succès',
                'Intervenant supprimé avec succès',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'intervenant');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !formData.name) {
    return (
      <ScreenContainer 
        title=""
        subtitle=""
        showSubHeader={false}
        showBackButton={false}
        animationEnabled={false}
      >
        <FormContainer 
          title="Modifier Intervenant" 
          subtitle=""
        >
          <ActivityIndicator size="large" color="#3D944B" />
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
    >
      <FormContainer 
        title="Modifier Intervenant" 
        subtitle=""
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <FormField label="Nom complet" required>
              <FormInput
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
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
                onChangeText={(text) => handleInputChange('cni', text)}
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
                onChangeText={(text) => handleInputChange('languages', text)}
                placeholder="Français, Wolof, Sérère (séparées par des virgules)"
              />
            </FormField>
          </Card>
        </ScrollView>

        <FormFooter 
          onCancel={() => router.back()}
          onSave={handleSave}
          onDelete={handleDelete}
          loading={loading}
        />
      </FormContainer>
    </ScreenContainer>
  );
}
