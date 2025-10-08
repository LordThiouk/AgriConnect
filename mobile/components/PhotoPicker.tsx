import React, { useState, useRef } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  IconButton,
  Button,
  Input,
  Badge,
  useTheme
} from 'native-base';
import { MediaService, MediaFile, UploadMediaParams } from '../lib/services/media';

interface PhotoPickerProps {
  entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
  entityId: string;
  onPhotosChange: (photos: MediaFile[]) => void;
  existingPhotos?: MediaFile[];
  maxPhotos?: number;
  enableGPS?: boolean;
  enableDescription?: boolean;
  style?: any;
}

export default function PhotoPicker({
  entityType,
  entityId,
  onPhotosChange,
  existingPhotos = [],
  maxPhotos = 5,
  enableGPS = true,
  enableDescription = true,
  style
}: PhotoPickerProps) {
  const theme = useTheme();
  const [photos, setPhotos] = useState<MediaFile[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<MediaFile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const screenWidth = Dimensions.get('window').width;
  const photoSize = (screenWidth - 60) / 3; // 3 photos par ligne avec marges

  // Demander les permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (enableGPS) {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      return cameraStatus === 'granted' && libraryStatus === 'granted' && locationStatus === 'granted';
    }
    
    return cameraStatus === 'granted' && libraryStatus === 'granted';
  };

  const getLocation = async () => {
    if (!enableGPS) return null;
    
    try {
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.warn('Erreur lors de la récupération de la position:', error);
      return null;
    }
  };

  const handleImagePicker = async (source: 'camera' | 'library') => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limite atteinte', `Vous ne pouvez ajouter que ${maxPhotos} photos maximum.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permissions requises', 'Veuillez autoriser l\'accès à la caméra et à la galerie.');
      return;
    }

    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const location = await getLocation();
        
        setSelectedPhoto({
          id: Date.now().toString(),
          uri: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
          type: 'image',
          entityType,
          entityId,
          location,
          description: '',
          tags: [],
          createdAt: new Date().toISOString(),
          fileSize: 0, // Sera calculé lors de l'upload
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  const uploadPhoto = async () => {
    if (!selectedPhoto) return;

    setUploading(true);
    try {
      const uploadParams: UploadMediaParams = {
        entityType: selectedPhoto.entityType,
        entityId: selectedPhoto.entityId,
        uri: selectedPhoto.uri,
        description: enableDescription ? description : undefined,
        tags: tags.length > 0 ? tags : undefined,
        location: selectedPhoto.location,
      };

      const uploadedMedia = await MediaService.uploadMedia(uploadParams);
      const newPhotos = [...photos, uploadedMedia];
      
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
      
      setModalVisible(false);
      setSelectedPhoto(null);
      setDescription('');
      setTags([]);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader la photo.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoId: string) => {
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
              const photo = photos.find(p => p.id === photoId);
              if (photo) {
                await MediaService.deleteMedia(photoId);
                const newPhotos = photos.filter(p => p.id !== photoId);
                setPhotos(newPhotos);
                onPhotosChange(newPhotos);
              }
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la photo.');
            }
          }
        }
      ]
    );
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <VStack space={3} {...style}>
      {/* Header avec boutons */}
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="md" fontWeight="medium" color="gray.700">
          Photos ({photos.length}/{maxPhotos})
        </Text>
        <HStack space={2}>
          <IconButton
            icon={<Ionicons name="camera" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />}
            onPress={() => handleImagePicker('camera')}
            variant="outline"
            borderColor="primary.500"
            size="sm"
            isDisabled={photos.length >= maxPhotos}
          />
          <IconButton
            icon={<Ionicons name="images" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />}
            onPress={() => handleImagePicker('library')}
            variant="outline"
            borderColor="primary.500"
            size="sm"
            isDisabled={photos.length >= maxPhotos}
          />
        </HStack>
      </HStack>

      {/* Grille de photos */}
      <HStack flexWrap="wrap" space={2}>
        {photos.map((photo, index) => (
          <Box
            key={photo.id}
            position="relative"
            w={photoSize}
            h={photoSize}
            borderRadius="md"
            overflow="hidden"
            bg="gray.200"
          >
            <Image
              source={{ uri: photo.uri }}
              style={{
                width: photoSize,
                height: photoSize,
              }}
              resizeMode="cover"
            />
            <IconButton
              icon={<Ionicons name="close" size={16} color="white" />}
              onPress={() => removePhoto(photo.id)}
              position="absolute"
              top={1}
              right={1}
              bg="rgba(0,0,0,0.6)"
              borderRadius="full"
              size="xs"
              _pressed={{ bg: 'rgba(0,0,0,0.8)' }}
            />
            {photo.location && (
              <Badge
                position="absolute"
                bottom={1}
                left={1}
                bg="green.500"
                borderRadius="sm"
                px={1}
                py={0.5}
              >
                <Text fontSize="2xs" color="white">GPS</Text>
              </Badge>
            )}
          </Box>
        ))}
        
        {photos.length < maxPhotos && (
          <Pressable
            onPress={() => handleImagePicker('library')}
            w={photoSize}
            h={photoSize}
            bg="gray.100"
            borderRadius="md"
            borderWidth={2}
            borderColor="gray.300"
            borderStyle="dashed"
            justifyContent="center"
            alignItems="center"
            _pressed={{ bg: 'gray.200' }}
          >
            <VStack alignItems="center" space={1}>
              <Ionicons name="add" size={24} color={theme.colors.gray?.[500] || '#6c757d'} />
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Ajouter
              </Text>
            </VStack>
          </Pressable>
        )}
      </HStack>

      {/* Modal pour les détails de la photo */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="center" px={4}>
          <Box bg="white" borderRadius="lg" p={4} maxH="80%">
            <HStack justifyContent="space-between" alignItems="center" mb={4}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Détails de la photo
              </Text>
              <IconButton
                icon={<Ionicons name="close" size={24} color={theme.colors.gray?.[500] || '#6c757d'} />}
                onPress={() => setModalVisible(false)}
                variant="ghost"
                size="sm"
              />
            </HStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space={4}>
                {selectedPhoto && (
                  <Box borderRadius="md" overflow="hidden" bg="gray.200">
                    <Image
                      source={{ uri: selectedPhoto.uri }}
                      style={{ width: '100%', height: 200 }}
                      resizeMode="cover"
                    />
                  </Box>
                )}

                {enableDescription && (
                  <VStack space={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Description (optionnel)
                    </Text>
                    <Input
                      placeholder="Décrire la photo..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      borderRadius="md"
                    />
                  </VStack>
                )}

                <VStack space={2}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    Tags (optionnel)
                  </Text>
                  <HStack flexWrap="wrap" space={1}>
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        bg="primary.500"
                        borderRadius="full"
                        px={2}
                        py={1}
                        flexDirection="row"
                        alignItems="center"
                      >
                        <Text fontSize="xs" color="white" mr={1}>
                          {tag}
                        </Text>
                        <Pressable onPress={() => removeTag(tag)}>
                          <Ionicons name="close" size={12} color="white" />
                        </Pressable>
                      </Badge>
                    ))}
                  </HStack>
                </VStack>

                <HStack space={2} mt={4}>
                  <Button
                    flex={1}
                    variant="outline"
                    onPress={() => setModalVisible(false)}
                    _text={{ color: 'gray.600' }}
                    borderColor="gray.300"
                  >
                    Annuler
                  </Button>
                  <Button
                    flex={1}
                    bg="primary.500"
                    onPress={uploadPhoto}
                    isLoading={uploading}
                    loadingText="Upload..."
                    _text={{ color: 'white', fontWeight: 'medium' }}
                    _pressed={{ bg: 'primary.600' }}
                  >
                    {uploading ? 'Upload...' : 'Ajouter'}
                  </Button>
                </HStack>
              </VStack>
            </ScrollView>
          </Box>
        </Box>
      </Modal>
    </VStack>
  );
}