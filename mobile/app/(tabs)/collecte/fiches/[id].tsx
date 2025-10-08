import React from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer, Card, Button, Badge } from '../../../../components/ui';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable,
  useTheme,
  Divider
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

const FicheDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const continueEditing = () => {
    if (!id) return;
    router.push(`/(tabs)/collecte/fiches/create?farmFileId=${id}`);
  };

  const addParcel = () => {
    if (!id) return;
    router.push(`/(tabs)/collecte/fiches/${id}/parcelles/add`);
  };

  const viewParcelles = () => {
    if (!id) return;
    router.push(`/(tabs)/collecte/fiches/${id}/parcelles`);
  };

  // Données d'exemple - à remplacer par des vraies données
  const ficheData = {
    id: id || 'N/A',
    status: 'draft',
    lastModified: '2025-01-02',
    organizationalData: {
      region: 'Kaolack',
      department: 'Kaolack',
      commune: 'Kaolack',
      village: 'Ndangane',
      cooperative: 'Coopérative Test'
    },
    producerData: {
      name: 'Amadou Diop',
      age: 45,
      phone: '+221 77 123 45 67',
      sex: 'M'
    },
    equipmentData: {
      tractors: 1,
      irrigation: 2,
      tools: 'Pulvérisateur, houe, bêche'
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'success';
      case 'draft':
        return 'warning';
      default:
        return 'muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'validated':
        return 'Validée';
      case 'draft':
        return 'Brouillon';
      default:
        return 'Inconnu';
    }
  };

  return (
    <ScreenContainer 
      title={`Fiche #${ficheData.id}`}
      subtitle="Détail de la fiche d'exploitation"
      showBackButton={true}
      showSubHeader={true}
      animationEnabled={true}
    >
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={4} p={4}>
          {/* En-tête avec statut */}
          <Card>
            <HStack justifyContent="space-between" alignItems="center" mb={3}>
              <VStack flex={1}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Fiche #{ficheData.id}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Dernière modification: {ficheData.lastModified}
                </Text>
              </VStack>
              <Badge
                colorScheme={getStatusColor(ficheData.status)}
                borderRadius="full"
                px={3}
                py={1}
              >
                <Text fontSize="xs" fontWeight="medium" color="white">
                  {getStatusText(ficheData.status)}
                </Text>
              </Badge>
            </HStack>
          </Card>

          {/* Données organisationnelles */}
          <Card>
            <VStack space={3}>
              <HStack alignItems="center" space={2}>
                <Ionicons name="business-outline" size={20} color={theme.colors.primary?.[500]} />
                <Text fontSize="md" fontWeight="semibold" color="primary.500">
                  Données organisationnelles
                </Text>
              </HStack>
              
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Région:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.organizationalData.region}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Département:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.organizationalData.department}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Commune:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.organizationalData.commune}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Village:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.organizationalData.village}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Coopérative:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.organizationalData.cooperative}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Chef d'exploitation */}
          <Card>
            <VStack space={3}>
              <HStack alignItems="center" space={2}>
                <Ionicons name="person-outline" size={20} color={theme.colors.primary?.[500]} />
                <Text fontSize="md" fontWeight="semibold" color="primary.500">
                  Chef d'exploitation
                </Text>
              </HStack>
              
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Nom:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.producerData.name}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Âge:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.producerData.age} ans</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Téléphone:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.producerData.phone}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Sexe:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.producerData.sex === 'M' ? 'Masculin' : 'Féminin'}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Inventaire matériel */}
          <Card>
            <VStack space={3}>
              <HStack alignItems="center" space={2}>
                <Ionicons name="construct-outline" size={20} color={theme.colors.primary?.[500]} />
                <Text fontSize="md" fontWeight="semibold" color="primary.500">
                  Inventaire matériel
                </Text>
              </HStack>
              
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Tracteurs:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.equipmentData.tractors}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Équipements d'irrigation:</Text>
                  <Text fontSize="sm" fontWeight="medium">{ficheData.equipmentData.irrigation}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Outils:</Text>
                  <Text fontSize="sm" fontWeight="medium" flex={1} textAlign="right">
                    {ficheData.equipmentData.tools}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Actions */}
          <VStack space={3} mt={4}>
            <Button
              title="Continuer la modification"
              variant="primary"
              onPress={continueEditing}
              leftIcon={<Ionicons name="create-outline" size={20} color="white" />}
            />
            
            <HStack space={3}>
              <Button
                title="Ajouter parcelle"
                variant="secondary"
                flex={1}
                onPress={addParcel}
                leftIcon={<Ionicons name="add-outline" size={18} color="#6c757d" />}
              />
              <Button
                title="Voir parcelles"
                variant="outline"
                flex={1}
                onPress={viewParcelles}
                leftIcon={<Ionicons name="list-outline" size={18} color="#6c757d" />}
              />
            </HStack>
          </VStack>
        </VStack>
      </ScrollView>
    </ScreenContainer>
  );
};

export default FicheDetailScreen;