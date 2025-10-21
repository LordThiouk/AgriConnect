import React, { useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaFile } from '../../../lib/services/media';
import { useMediaByEntity } from '../../../lib/hooks/useMedia';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  IconButton,
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
  openImmediately?: boolean; // auto-open modal when photos ready
  modalOnly?: boolean; // render only fullscreen modal, no inline gallery
  onClose?: () => void; // notify parent on close
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
  openImmediately = false,
  modalOnly = false,
  onClose,
}) => {
  const theme = useTheme();
  const { data: photos, loading, deleteMedia } = useMediaByEntity(entityType, entityId, { refetchOnMount: true });
  const [selectedPhoto, setSelectedPhoto] = useState<MediaFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const screenWidth = Dimensions.get('window').width;
  const photoSize = (screenWidth - (spacing * (columns + 1) * 4)) / columns;

  // Limiter à maxPhotos si fourni
  const limitedPhotos = (photos || []).slice(0, maxPhotos);

  // Auto-open fullscreen if requested and photos are available
  useEffect(() => {
    if (openImmediately && !modalVisible && limitedPhotos.length > 0) {
      setSelectedPhoto(limitedPhotos[0]);
      setSelectedIndex(0);
      setModalVisible(true);
    }
  }, [openImmediately, limitedPhotos, modalVisible]);

  const handlePhotoPress = (photo: MediaFile) => {
    if (onPhotoPress) {
      onPhotoPress(photo);
    } else {
      setSelectedPhoto(photo);
      const index = limitedPhotos.findIndex(p => p.id === photo.id);
      setSelectedIndex(index >= 0 ? index : 0);
      setModalVisible(true);
    }
  };

  // When modal opens, scroll to the selected index once
  useEffect(() => {
    if (modalVisible && scrollRef.current) {
      const x = selectedIndex * screenWidth;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x, y: 0, animated: false });
      });
    }
  }, [modalVisible, selectedIndex, screenWidth]);

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
                await deleteMedia(photoId);
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

  if (limitedPhotos.length === 0) {
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
    const firstPhoto = limitedPhotos[0];
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

  if (modalOnly) {
    return (
      <Box style={style}>
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setModalVisible(false);
            onClose?.();
          }}
        >
          <Box flex={1} bg="rgba(0,0,0,0.95)" justifyContent="center" alignItems="center">
            <Box w="100%" h="100%" position="relative">
              <IconButton
                icon={<Ionicons name="close" size={24} color="#FFFFFF" />}
                onPress={() => {
                  setModalVisible(false);
                  onClose?.();
                }}
                variant="ghost"
                position="absolute"
                top={10}
                right={10}
                zIndex={1}
                bg="rgba(0,0,0,0.5)"
                borderRadius={20}
                _pressed={{ opacity: 0.7 }}
              />
              {selectedPhoto && (
                <>
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                      setSelectedIndex(idx);
                      setSelectedPhoto(limitedPhotos[idx]);
                    }}
                    style={{ flex: 1 }}
                  >
                    {limitedPhotos.map((p) => (
                      <Box key={p.id} width={screenWidth} height="100%" alignItems="center" justifyContent="center">
                        <Image
                          source={{ uri: p.url }}
                          style={{ width: screenWidth, height: '100%' }}
                          resizeMode="contain"
                        />
                      </Box>
                    ))}
                  </ScrollView>
                  <HStack position="absolute" bottom={24} alignSelf="center" space={1}>
                    {limitedPhotos.map((_, i) => (
                      <Box key={i} w={2} h={2} borderRadius={10} bg={i === selectedIndex ? 'white' : 'gray.500'} opacity={i === selectedIndex ? 1 : 0.5} />
                    ))}
                  </HStack>
                </>
              )}
            </Box>
          </Box>
        </Modal>
      </Box>
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
          {limitedPhotos.map((photo, index) => renderPhoto(photo, index))}
        </HStack>
      </ScrollView>

      {/* Modal de visualisation */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Box flex={1} bg="rgba(0,0,0,0.95)" justifyContent="center" alignItems="center">
          <Box w="100%" h="100%" position="relative">
            <IconButton
              icon={<Ionicons name="close" size={24} color="#FFFFFF" />}
              onPress={() => setModalVisible(false)}
              variant="ghost"
              position="absolute"
              top={10}
              right={10}
              zIndex={1}
              bg="rgba(0,0,0,0.5)"
              borderRadius={20}
              _pressed={{ opacity: 0.7 }}
            />
            
            {selectedPhoto && (
              <>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                    setSelectedIndex(idx);
                    setSelectedPhoto(limitedPhotos[idx]);
                  }}
                  style={{ flex: 1 }}
                >
                  {limitedPhotos.map((p) => (
                    <Box key={p.id} width={screenWidth} height="100%" alignItems="center" justifyContent="center">
                      <Image
                        source={{ uri: p.url }}
                        style={{ width: screenWidth, height: '100%' }}
                        resizeMode="contain"
                      />
                    </Box>
                  ))}
                </ScrollView>
                <HStack position="absolute" bottom={24} alignSelf="center" space={1}>
                  {limitedPhotos.map((_, i) => (
                    <Box key={i} w={2} h={2} borderRadius={10} bg={i === selectedIndex ? 'white' : 'gray.500'} opacity={i === selectedIndex ? 1 : 0.5} />
                  ))}
                </HStack>
              </>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default PhotoGallery;
