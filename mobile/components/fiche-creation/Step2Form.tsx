import React from 'react';
import { VStack, Text, HStack, Box, Pressable } from 'native-base';
import { ParcelData } from '../../lib/types/core/fiche-creation';

export type Step2FormProps = {
  parcels: ParcelData[];
  onAddParcel: () => void;
  onEditParcel: (parcel: ParcelData) => void;
  onRemoveParcel: (parcelId: string) => void;
};

const Step2Form: React.FC<Step2FormProps> = ({ parcels, onAddParcel, onEditParcel, onRemoveParcel }) => {
  return (
    <VStack space={4} p={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="lg" fontWeight="bold" color="primary.500">
          Parcelles & Cultures
        </Text>
        <Pressable
          onPress={onAddParcel}
          bg="primary.500"
          px={4}
          py={2}
          borderRadius="md"
          _pressed={{ opacity: 0.8 }}
        >
          <Text color="white" fontWeight="medium">+ Ajouter parcelle</Text>
        </Pressable>
      </HStack>

      {parcels.length === 0 ? (
        <Box bg="gray.100" p={4} borderRadius="md">
          <Text color="gray.500" textAlign="center">
            Aucune parcelle ajoutée
          </Text>
        </Box>
      ) : (
        <VStack space={3}>
          {parcels.map((parcel) => (
            <Box key={parcel.id} bg="gray.100" p={4} borderRadius="md">
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Text fontSize="md" fontWeight="bold" color="primary.500" flex={1}>
                  {parcel.name || 'Parcelle sans nom'}
                </Text>
                <HStack space={2}>
                  <Pressable
                    onPress={() => onEditParcel(parcel)}
                    bg="blue.500"
                    px={3}
                    py={1}
                    borderRadius="sm"
                    _pressed={{ opacity: 0.8 }}
                  >
                    <Text color="white" fontSize="sm">Modifier</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onRemoveParcel(parcel.id)}
                    bg="red.500"
                    px={3}
                    py={1}
                    borderRadius="sm"
                    _pressed={{ opacity: 0.8 }}
                  >
                    <Text color="white" fontSize="sm">Supprimer</Text>
                  </Pressable>
                </HStack>
              </HStack>

              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Surface totale:</Text>
                  <Text fontSize="sm" fontWeight="medium">{parcel.totalArea} ha</Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Typologie:</Text>
                  <Text fontSize="sm" fontWeight="medium">{parcel.typology}</Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Variété de coton:</Text>
                  <Text fontSize="sm" fontWeight="medium">{parcel.cottonVariety}</Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Cultures:</Text>
                  <Text fontSize="sm" fontWeight="medium">{parcel.crops.length}</Text>
                </HStack>

                {parcel.crops.length > 0 && (
                  <VStack space={1} mt={2}>
                    <Text fontSize="sm" color="gray.600">Détails des cultures:</Text>
                    {parcel.crops.map((crop, index) => (
                      <Text key={crop.id} fontSize="xs" color="gray.500" ml={2}>
                        • {crop.type} - {crop.variety} ({crop.area} ha)
                      </Text>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
};

export default Step2Form;