import React from 'react';
import { VStack, Text, HStack, Box } from 'native-base';
import { Cooperative, OrganizationalData, ProducerData, ParcelData } from '../../lib/types/core/fiche-creation';
import { FicheCreationService } from '../../lib/services/fiche-creation';

export type Step3SummaryProps = {
  organizationalData: OrganizationalData;
  producerData: ProducerData;
  parcels: ParcelData[];
  cooperatives: Cooperative[];
};

const Step3Summary: React.FC<Step3SummaryProps> = ({ organizationalData, producerData, parcels, cooperatives }) => {
  const coopName = cooperatives.find(c => c.id === organizationalData?.cooperativeId)?.name;
  
  return (
    <VStack space={4} p={4}>
      {/* Données organisationnelles */}
      <Box bg="gray.100" p={4} borderRadius="md">
        <Text fontSize="md" fontWeight="bold" color="primary.500" mb={2}>
          Données Organisationnelles
        </Text>
        <VStack space={1}>
          <Text fontSize="sm">Nom: {organizationalData?.name || 'Non renseigné'}</Text>
          <Text fontSize="sm">Localisation: {organizationalData?.village || 'Non renseigné'}, {organizationalData?.commune || 'Non renseigné'}</Text>
          <Text fontSize="sm">Coopérative: {coopName || 'Non sélectionnée'}</Text>
        </VStack>
      </Box>

      {/* Chef d'exploitation */}
      <Box bg="gray.100" p={4} borderRadius="md">
        <Text fontSize="md" fontWeight="bold" color="primary.500" mb={2}>
          Chef d'Exploitation
        </Text>
        <VStack space={1}>
          <Text fontSize="sm">Nom: {producerData?.firstName || ''} {producerData?.lastName || ''}</Text>
          <Text fontSize="sm">Âge: {producerData?.age ?? FicheCreationService.calculateAge(producerData?.birthDate, organizationalData?.censusDate)}</Text>
          <Text fontSize="sm">Sexe: {producerData?.sex || 'Non renseigné'}</Text>
          <Text fontSize="sm">Téléphone: {producerData?.phone || 'Non renseigné'}</Text>
        </VStack>
      </Box>

      {/* Parcelles */}
      <Box bg="gray.100" p={4} borderRadius="md">
        <Text fontSize="md" fontWeight="bold" color="primary.500" mb={2}>
          Parcelles ({parcels.length})
        </Text>
        {parcels.length === 0 ? (
          <Text fontSize="sm" color="gray.500">Aucune parcelle ajoutée</Text>
        ) : (
          <VStack space={2}>
            {parcels.map((parcel, index) => (
              <Box key={parcel.id} bg="white" p={3} borderRadius="sm">
                <Text fontSize="sm" fontWeight="medium" color="primary.500">
                  Parcelle {index + 1}: {parcel.name || 'Sans nom'}
                </Text>
                <VStack space={1} mt={1}>
                  <HStack justifyContent="space-between">
                    <Text fontSize="xs" color="gray.600">Surface:</Text>
                    <Text fontSize="xs">{parcel.totalArea} ha</Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text fontSize="xs" color="gray.600">Typologie:</Text>
                    <Text fontSize="xs">{parcel.typology}</Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text fontSize="xs" color="gray.600">Cultures:</Text>
                    <Text fontSize="xs">{parcel.crops.length}</Text>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Résumé global */}
      <Box bg="primary.50" p={4} borderRadius="md" borderLeftWidth={4} borderLeftColor="primary.500">
        <Text fontSize="md" fontWeight="bold" color="primary.500" mb={2}>
          Résumé
        </Text>
        <VStack space={1}>
          <HStack justifyContent="space-between">
            <Text fontSize="sm">Total parcelles:</Text>
            <Text fontSize="sm" fontWeight="medium">{parcels.length}</Text>
          </HStack>
          <HStack justifyContent="space-between">
            <Text fontSize="sm">Surface totale:</Text>
            <Text fontSize="sm" fontWeight="medium">
              {parcels.reduce((total, parcel) => total + parcel.totalArea, 0).toFixed(2)} ha
            </Text>
          </HStack>
          <HStack justifyContent="space-between">
            <Text fontSize="sm">Total cultures:</Text>
            <Text fontSize="sm" fontWeight="medium">
              {parcels.reduce((total, parcel) => total + parcel.crops.length, 0)}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  );
};

export default Step3Summary;