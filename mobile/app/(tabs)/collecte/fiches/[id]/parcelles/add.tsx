import React from 'react';
import { Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../../lib/services/collecte';
import PhotoPicker from '../../../../../../components/PhotoPicker';
import { MediaFile } from '../../../../../../lib/services/media';
import { 
  ScreenContainer, 
  FormContainer, 
  Card, 
  Button, 
  FormField, 
  FormInput, 
  FormSelect,
  FormFooter
} from '../../../../../../components/ui';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  useTheme,
  Divider
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

const AddParcelleScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [code, setCode] = React.useState('');
  const [area, setArea] = React.useState('');
  const [variety, setVariety] = React.useState('');
  const [typology, setTypology] = React.useState('');
  const [size, setSize] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [photos, setPhotos] = React.useState<MediaFile[]>([]);

  // Options pour les sélecteurs
  const typologyOptions = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'CC', label: 'CC' },
    { value: 'EAM', label: 'EAM' },
  ];

  const sizeOptions = [
    { value: 'Standard', label: 'Standard' },
    { value: 'HGros', label: 'HGros' },
    { value: 'Super gros', label: 'Super gros' },
  ];

  const varietyOptions = [
    { value: 'CE', label: 'CE' },
    { value: 'CM', label: 'CM' },
    { value: 'SH', label: 'SH' },
    { value: 'NAW', label: 'NAW' },
  ];

  const onSave = async () => {
    if (!id) return;
    if (!code || !area) {
      Alert.alert('Champs requis', 'Identifiant parcelle et surface sont requis.');
      return;
    }
    setSaving(true);
    try {
      const plotId = await CollecteService.createFarmFilePlot({
        farmFileId: id,
        code,
        areaHa: Number(area),
        cottonVariety: variety || undefined,
        typology: typology || undefined,
        producerSize: size || undefined,
      });
      if (plotId) {
        Alert.alert('Succès', 'La parcelle a été ajoutée à la fiche.', [
          {
            text: 'OK',
            onPress: () => {
              router.replace(`/(tabs)/parcelles/${plotId}`);
            },
          },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de créer la parcelle');
    } finally {
      setSaving(false);
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
        title={`Ajouter Parcelle - Fiche #${id}`}
        subtitle="Créer une nouvelle parcelle pour cette fiche"
        showBackButton={true}
        footerActions={[
          {
            label: saving ? 'Enregistrement…' : 'Enregistrer (brouillon)',
            onPress: onSave,
            variant: 'primary',
            loading: saving,
            disabled: !code || !area,
            icon: <Ionicons name="save-outline" size={16} color="white" />
          }
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Identification */}
          <Card>
            <VStack space={4}>
              <HStack alignItems="center" space={2}>
                <Ionicons name="finger-print-outline" size={20} color={theme.colors.primary?.[500]} />
                <Text fontSize="md" fontWeight="semibold" color="primary.500">
                  Identification
                </Text>
              </HStack>
              
              <FormField label="Identifiant parcelle" required>
                <FormInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Ex: P001"
                  autoCapitalize="characters"
                />
              </FormField>

              <FormField label="Surface recensée (ha)" required>
                <FormInput
                  value={area}
                  onChangeText={setArea}
                  placeholder="Ex: 2.5"
                  keyboardType="numeric"
                />
              </FormField>
            </VStack>
          </Card>

          {/* Classification */}
          <Card>
            <VStack space={4}>
              <HStack alignItems="center" space={2}>
                <Ionicons name="layers-outline" size={20} color={theme.colors.primary?.[500]} />
                <Text fontSize="md" fontWeight="semibold" color="primary.500">
                  Classification
                </Text>
              </HStack>
              
              <FormField label="Typologie">
                <FormSelect
                  value={typology}
                  onValueChange={setTypology}
                  options={typologyOptions}
                  placeholder="Sélectionner une typologie"
                />
              </FormField>

              <FormField label="Taille">
                <FormSelect
                  value={size}
                  onValueChange={setSize}
                  options={sizeOptions}
                  placeholder="Sélectionner une taille"
                />
              </FormField>

              <FormField label="Variété">
                <FormSelect
                  value={variety}
                  onValueChange={setVariety}
                  options={varietyOptions}
                  placeholder="Sélectionner une variété"
                />
              </FormField>
            </VStack>
          </Card>

          {/* Localisation */}
          <Card>
            <VStack space={3}>
              <HStack alignItems="center" space={2}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary?.[500]} />
                <Text fontSize="md" fontWeight="semibold" color="primary.500">
                  Localisation
                </Text>
              </HStack>
              
              <Box 
                bg="primary.50" 
                p={3} 
                borderRadius="md" 
                borderLeftWidth={3} 
                borderLeftColor="primary.500"
              >
                <Text fontSize="sm" color="primary.700" fontWeight="medium">
                  📍 GPS automatique
                </Text>
                <Text fontSize="xs" color="primary.600" mt={1}>
                  La localisation sera capturée automatiquement lors de l'ajout de photos
                </Text>
              </Box>
            </VStack>
          </Card>

          {/* Photos */}
          <Card>
            <VStack space={4}>
              <HStack alignItems="center" space={2}>
                <Ionicons name="camera-outline" size={20} color={theme.colors.primary?.[500]} />
                <Text fontSize="md" fontWeight="semibold" color="primary.500">
                  Photos de la parcelle
                </Text>
              </HStack>
              
              <PhotoPicker
                entityType="plot"
                entityId={id || ''}
                onPhotosChange={setPhotos}
                existingPhotos={photos}
                maxPhotos={5}
                enableGPS={true}
                enableDescription={true}
              />
            </VStack>
          </Card>
        </ScrollView>
      </FormContainer>
    </ScreenContainer>
  );
};

export default AddParcelleScreen;