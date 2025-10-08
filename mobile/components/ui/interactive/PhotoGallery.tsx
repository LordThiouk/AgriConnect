import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaService, MediaFile } from '../../../lib/services/media';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  IconButton,
  Badge,
  Spinner,
  useTheme
} from 'native-base';

interface PhotoGalleryProps {
  entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
  entityId: string;
  title?: string;
  maxPhotos?: number;
  showTitle?: boolean;
  style?: any;
  isHeaderGallery?: boolean;
  columns?: number;
  spacing?: number;
  onPhotoPress?: (photo: MediaFile) => void;
  onPhotoDelete?: (photoId: string) => void;
  enableDelete?: boolean;
  showBadge?: boolean;
  badgeColor?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  entityType,
  entityId,
  title,
  maxPhotos = 10,
  showTitle = true,
  style,
  isHeaderGallery = false,
  columns = 3,
  spacing = 2.5,
  onPhotoPress,
  onPhotoDelete,
  enableDelete = true,
  showBadge = true,
  badgeColor = 'error.500',
}) => {
  const theme = useTheme();
  const [photos, setPhotos] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<MediaFile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const photoSize = (screenWidth - (spacing * (columns + 1) * 4)) / columns;

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📸 [PhotoGallery] Chargement photos pour:', { entityType, entityId });
      const mediaPhotos = await MediaService.getMediaByEntity(entityType, entityId);
      console.log('📸 [PhotoGallery] Photos récupérées:', mediaPhotos.length, 'photos');
      setPhotos(mediaPhotos.slice(0, maxPhotos));
    } catch (error) {
      console.error('❌ [PhotoGallery] Erreur chargement photos:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, maxPhotos]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handlePhotoPress = (photo: MediaFile) => {
    if (onPhotoPress) {
      onPhotoPress(photo);
    } else {
      setSelectedPhoto(photo);
      setModalVisible(true);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (onPhotoDelete) {
      onPhotoDelete(photoId);
    } else {
      Alert.alert(
        'Supprimer la photo',
        'Êtes-vous sûr de vouloir supprimer cette photo ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await MediaService.deleteMedia(photoId);
                setPhotos(photos.filter(p => p.id !== photoId));
                Alert.alert('Succès', 'Photo supprimée avec succès');
              } catch (error) {
                console.error('Erreur suppression photo:', error);
                Alert.alert('Erreur', 'Impossible de supprimer la photo');
              }
            }
          }
        ]
      );
    }
  };

  const renderPhoto = (photo: MediaFile, index: number) => (
    <Pressable
      key={photo.id}
      onPress={() => handlePhotoPress(photo)}
      _pressed={{ opacity: 0.8 }}
      mb={spacing}
      mr={index % columns === columns - 1 ? 0 : spacing}
    >
      <Box
        w={photoSize}
        h={photoSize}
        borderRadius={8}
        overflow="hidden"
        bg="gray.100"
        position="relative"
      >
        <Image
          source={{ uri: photo.url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        
        {/* Overlay avec actions */}
        <Box
          position="absolute"
          top={0}
          right={0}
          left={0}
          bottom={0}
          bg="rgba(0,0,0,0.3)"
          justifyContent="space-between"
          alignItems="flex-end"
          p={1}
        >
          {enableDelete && (
            <IconButton
              icon={<Ionicons name="close-circle" size={20} color={theme.colors.red?.[500] || '#FF4444'} />}
              onPress={() => handlePhotoDelete(photo.id)}
              variant="ghost"
              bg="rgba(255,255,255,0.8)"
              borderRadius={10}
              size="xs"
              _pressed={{ opacity: 0.7 }}
            />
          )}
          
          {photo.gps_coordinates && showBadge && (
            <Box
              bg="rgba(255,255,255,0.8)"
              borderRadius={8}
              p={1}
            >
              <Ionicons name="location" size={12} color={theme.colors.primary?.[500] || '#3D944B'} />
            </Box>
          )}
        </Box>
      </Box>
    </Pressable>
  );

  if (loading) {
    return (
      <Box style={style} my={2.5}>
        {showTitle && (
          <Text fontSize="md" fontWeight="semibold" color="gray.800" mb={3}>
            {title || `Photos (${entityType})`}
          </Text>
        )}
        <HStack alignItems="center" justifyContent="center" p={5}>
          <Spinner size="sm" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text ml={2} color="gray.500" fontSize="sm">
            Chargement des photos...
          </Text>
        </HStack>
      </Box>
    );
  }

  if (photos.length === 0) {
    if (isHeaderGallery) {
      return (
        <Pressable
          onPress={() => handlePhotoPress({} as MediaFile)}
          _pressed={{ opacity: 0.8 }}
        >
          <Box
            w="100%"
            h={200}
            bg="primary.50"
            justifyContent="center"
            alignItems="center"
            borderRadius={8}
          >
            <Ionicons name="camera-outline" size={48} color={theme.colors.primary?.[500] || '#3D944B'} />
            <Text fontSize="sm" fontWeight="semibold" color={theme.colors.primary?.[500] || '#3D944B'} mt={2}>
              Photo de parcelle
            </Text>
          </Box>
        </Pressable>
      );
    }
    
    return (
      <Box style={style} my={2.5}>
        {showTitle && (
          <Text fontSize="md" fontWeight="semibold" color="gray.800" mb={3}>
            {title || `Photos (${entityType})`}
          </Text>
        )}
        <VStack alignItems="center" p={5} bg="gray.50" borderRadius={8}>
          <Ionicons name="camera-outline" size={48} color="gray.500" />
          <Text mt={2} color="gray.500" fontSize="sm">
            Aucune photo disponible
          </Text>
        </VStack>
      </Box>
    );
  }

  // Mode header - afficher une seule photo en grand format
  if (isHeaderGallery) {
    const firstPhoto = photos[0];
    return (
      <Pressable
        onPress={() => handlePhotoPress(firstPhoto)}
        _pressed={{ opacity: 0.8 }}
      >
        <Box
          w="100%"
          h={200}
          position="relative"
          borderRadius={8}
          overflow="hidden"
        >
          <Image
            source={{ uri: firstPhoto.url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <Box
            position="absolute"
            bottom={4}
            left={4}
            bg="rgba(0,0,0,0.5)"
            flexDirection="row"
            alignItems="center"
            px={3}
            py={1.5}
            borderRadius={16}
          >
            <Ionicons name="camera" size={20} color="rgba(255,255,255,0.8)" />
            <Text fontSize="sm" fontWeight="semibold" color="#FFFFFF" ml={2}>
              Photo de parcelle
            </Text>
          </Box>
        </Box>
      </Pressable>
    );
  }

  return (
    <Box style={style} my={2.5}>
      {showTitle && (
        <Text fontSize="md" fontWeight="semibold" color="gray.800" mb={3}>
          {title || `Photos (${entityType})`} ({photos.length})
        </Text>
      )}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <HStack flexWrap="wrap" space={0}>
          {photos.map((photo, index) => renderPhoto(photo, index))}
        </HStack>
      </ScrollView>

      {/* Modal de visualisation */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Box flex={1} bg="rgba(0,0,0,0.9)" justifyContent="center" alignItems="center">
          <Box w="90%" h="80%" position="relative">
            <IconButton
              icon={<Ionicons name="close" size={24} color="#FFFFFF" />}
              onPress={() => setModalVisible(false)}
              variant="ghost"
              position="absolute"
              top={2.5}
              right={2.5}
              zIndex={1}
              bg="rgba(0,0,0,0.5)"
              borderRadius={20}
              _pressed={{ opacity: 0.7 }}
            />
            
            {selectedPhoto && (
              <ScrollView style={{ flex: 1 }}>
                <Image
                  source={{ uri: selectedPhoto.url }}
                  style={{ width: '100%', height: '70%' }}
                  resizeMode="contain"
                />
                
                <VStack p={4} bg="rgba(255,255,255,0.1)">
                  <Text color="#FFFFFF" fontSize="md" fontWeight="semibold" mb={2}>
                    {selectedPhoto.file_name}
                  </Text>
                  {selectedPhoto.description && (
                    <Text color="#FFFFFF" fontSize="sm" mb={2}>
                      {selectedPhoto.description}
                    </Text>
                  )}
                  {selectedPhoto.gps_coordinates && (
                    <Text color={theme.colors.primary?.[500] || '#3D944B'} fontSize="xs" mb={1}>
                      📍 {selectedPhoto.gps_coordinates.lat.toFixed(6)}, {selectedPhoto.gps_coordinates.lon.toFixed(6)}
                    </Text>
                  )}
                  <Text color="#CCCCCC" fontSize="xs" mb={2}>
                    📅 {new Date(selectedPhoto.taken_at || selectedPhoto.created_at).toLocaleString()}
                  </Text>
                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <VStack mt={2}>
                      <Text color="#FFFFFF" fontSize="xs" mb={1}>
                        Tags:
                      </Text>
                      <HStack flexWrap="wrap">
                        {selectedPhoto.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            bg={`rgba(${theme.colors.primary?.[500] || '#3D944B'}, 0.8)`}
                            borderRadius="full"
                            px={2}
                            py={1}
                            mr={1}
                            mb={1}
                          >
                            <Text color="#FFFFFF" fontSize="xs">
                              {tag}
                            </Text>
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              </ScrollView>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default PhotoGallery;
