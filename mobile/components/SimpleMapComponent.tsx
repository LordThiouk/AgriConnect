import React from 'react';
import { ScrollView } from 'react-native';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  Badge,
  useTheme
} from 'native-base';

interface PlotData {
  id: string;
  name: string;
  producerName: string;
  hasGps: boolean;
  lat?: number;
  lon?: number;
}

interface SimpleMapComponentProps {
  plots: PlotData[];
  onMarkerPress: (plotId: string) => void;
}

const SimpleMapComponent: React.FC<SimpleMapComponentProps> = ({ plots, onMarkerPress }) => {
  const theme = useTheme();
  const plotsWithGps = plots.filter(p => p.hasGps && p.lat && p.lon);
  const plotsWithoutGps = plots.filter(p => !p.hasGps || !p.lat || !p.lon);

  return (
    <Box flex={1} bg="gray.50">
      <Box 
        p={4} 
        bg="white" 
        borderBottomWidth={1} 
        borderBottomColor="gray.200"
      >
        <VStack space={1}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            🗺️ Carte des Parcelles
          </Text>
          <Text fontSize="sm" color="gray.600">
            {plotsWithGps.length} parcelles avec GPS • {plotsWithoutGps.length} sans localisation
          </Text>
        </VStack>
      </Box>

      <ScrollView flex={1} p={4} showsVerticalScrollIndicator={false}>
        {/* Parcelles avec GPS */}
        {plotsWithGps.length > 0 && (
          <VStack space={4} mb={6}>
            <Text fontSize="md" fontWeight="semibold" color="gray.700">
              📍 Parcelles Localisées
            </Text>
            {plotsWithGps.map((plot) => (
              <Pressable
                key={plot.id}
                onPress={() => onMarkerPress(plot.id)}
                _pressed={{ opacity: 0.7 }}
              >
                <Box
                  bg="white"
                  borderRadius="lg"
                  p={4}
                  shadow={1}
                  borderLeftWidth={4}
                  borderLeftColor="success.500"
                >
                  <HStack justifyContent="space-between" alignItems="center" mb={2}>
                    <Text fontSize="md" fontWeight="semibold" color="gray.800" flex={1}>
                      {plot.name}
                    </Text>
                    <Badge bg="success.500" borderRadius="full" px={3} py={1}>
                      <Text fontSize="xs" fontWeight="medium" color="white">
                        GPS
                      </Text>
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    {plot.producerName}
                  </Text>
                  
                  <Text fontSize="xs" color="success.600" fontFamily="mono" mb={2}>
                    📍 {plot.lat?.toFixed(4)}, {plot.lon?.toFixed(4)}
                  </Text>
                  
                  <Box bg="gray.100" p={2} borderRadius="md">
                    <Text fontSize="xs" color="gray.700">
                      Région: Dakar • Zone: {plot.lat && plot.lat > 14.7 ? 'Nord' : 'Sud'}
                    </Text>
                  </Box>
                </Box>
              </Pressable>
            ))}
          </VStack>
        )}

        {/* Parcelles sans GPS */}
        {plotsWithoutGps.length > 0 && (
          <VStack space={4} mb={6}>
            <Text fontSize="md" fontWeight="semibold" color="gray.700">
              ❓ Parcelles sans Localisation
            </Text>
            {plotsWithoutGps.map((plot) => (
              <Pressable
                key={plot.id}
                onPress={() => onMarkerPress(plot.id)}
                _pressed={{ opacity: 0.7 }}
              >
                <Box
                  bg="white"
                  borderRadius="lg"
                  p={4}
                  shadow={1}
                  borderLeftWidth={4}
                  borderLeftColor="warning.500"
                >
                  <HStack justifyContent="space-between" alignItems="center" mb={2}>
                    <Text fontSize="md" fontWeight="semibold" color="gray.800" flex={1}>
                      {plot.name}
                    </Text>
                    <Badge bg="warning.500" borderRadius="full" px={3} py={1}>
                      <Text fontSize="xs" fontWeight="medium" color="white">
                        Sans GPS
                      </Text>
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    {plot.producerName}
                  </Text>
                  
                  <Text fontSize="xs" color="warning.600" fontStyle="italic">
                    📍 Localisation non disponible
                  </Text>
                </Box>
              </Pressable>
            ))}
          </VStack>
        )}

        {/* Message si aucune parcelle */}
        {plots.length === 0 && (
          <Box flex={1} justifyContent="center" alignItems="center" py={10}>
            <VStack space={2} alignItems="center">
              <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                Aucune parcelle trouvée
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Les parcelles apparaîtront ici une fois créées
              </Text>
            </VStack>
          </Box>
        )}
      </ScrollView>
    </Box>
  );
};

export default SimpleMapComponent;