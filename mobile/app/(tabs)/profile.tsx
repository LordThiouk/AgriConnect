import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer, FormContainer, FormField, FormFooter, FormInput } from '../../components/ui';
import { useMyProfile } from '../../lib/hooks';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Icon, Button, Image } from 'native-base';
import * as ImagePicker from 'expo-image-picker';
import { useMediaByEntity, useUploadMedia } from '../../lib/hooks/useMedia';
import { ProfilesServiceInstance } from '../../lib/services/domain/profiles';

const ProfileScreen: React.FC = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const { data: myProfile, refetch: refetchProfile } = useMyProfile();
  console.log('🔎 [PROFILE] myProfile:', myProfile);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userRole = (myProfile?.role as string) || (user?.user_metadata?.role as string);
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [commune, setCommune] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { data: mediaFiles, refetch: refetchMedia } = useMediaByEntity('agent', myProfile?.id || '', { enabled: !!myProfile?.id, onSuccess: (d) => console.log('📸 [PROFILE] media hook success, count:', Array.isArray(d) ? d.length : 'n/a'), onError: (e) => console.log('❌ [PROFILE] media hook error:', e?.message) });
  console.log('🔎 [PROFILE] media entityId:', myProfile?.id, 'enabled:', !!myProfile?.id);
  const { uploadMedia } = useUploadMedia({ onSuccess: () => refetchMedia() });
  const photoUrl = mediaFiles && mediaFiles.length > 0 ? (mediaFiles[0] as any).url || null : null;

  useEffect(() => {
    if (!isAuthenticated) {
      // Assurer la redirection hors des onglets après déconnexion
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
              // La redirection est aussi assurée par l'effet ci‑dessus
              router.replace('/(auth)/login');
            } finally {
              setIsSigningOut(false);
            }
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'agent': return 'Agent de Terrain';
      case 'producer': return 'Producteur';
      case 'admin': return 'Administrateur';
      case 'supervisor': return 'Superviseur';
      default: return 'Utilisateur';
    }
  };

  const profileSections = [
    {
      title: 'Informations Personnelles',
      items: [
        { label: 'Nom complet', value: myProfile?.display_name || user?.user_metadata?.full_name || 'Non défini', icon: 'person' },
        { label: 'Téléphone', value: myProfile?.phone || user?.phone || 'Non défini', icon: 'call' },
        { label: 'Rôle', value: getRoleDisplayName(userRole || ''), icon: 'shield' },
        { label: 'Région', value: myProfile?.region || '—', icon: 'location' },
        { label: 'Département', value: myProfile?.department || '—', icon: 'map' },
        { label: 'Commune', value: myProfile?.commune || '—', icon: 'pin' },
      ]
    }
  ];

  // actions de sécurité retirées dans cette version

  if (editOpen) {
    return (
      <ScreenContainer title="Profil">
        <FormContainer title="Modifier mes informations" onBack={() => setEditOpen(false)}>
          <VStack space={3}>
            <FormField label="Photo de profil">
              <HStack space={3} alignItems="center">
                <Box w={16} h={16} rounded="full" bg="coolGray.100" alignItems="center" justifyContent="center" overflow="hidden">
                  {photoUrl ? (
                    <Image alt="avatar" source={{ uri: photoUrl }} w="full" h="full" />
                  ) : (
                    <Icon as={Ionicons} name="person" size="lg" color="coolGray.400" />
                  )}
                </Box>
                <Button variant="outline" onPress={async () => {
                  try {
                    if (!myProfile?.id) return;
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (perm.status !== 'granted') {
                      Alert.alert('Permission requise', 'Autorisez l’accès aux photos.');
                      return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                    if (result.canceled || !result.assets?.length) return;
                    const asset = result.assets[0];
                    const response = await fetch(asset.uri);
                    const arrayBuffer = await response.arrayBuffer();
                    await uploadMedia({
                      entityType: 'agent',
                      entityId: myProfile.id,
                      file: new Uint8Array(arrayBuffer),
                      fileName: asset.fileName || 'profile.jpg',
                      description: 'Photo de profil'
                    } as any);
                    await refetchMedia();
                    Alert.alert('Succès', 'Photo de profil mise à jour.');
                  } catch (e: any) {
                    Alert.alert('Erreur', e?.message || 'Échec de l’upload');
                  }
                }}>Choisir une image</Button>
              </HStack>
            </FormField>
            <FormField label="Nom complet" required>
              <FormInput value={displayName} onChangeText={setDisplayName} placeholder="Nom complet" />
            </FormField>
            <FormField label="Région">
              <FormInput value={region} onChangeText={setRegion} placeholder="Région" />
            </FormField>
            <FormField label="Département">
              <FormInput value={department} onChangeText={setDepartment} placeholder="Département" />
            </FormField>
            <FormField label="Commune">
              <FormInput value={commune} onChangeText={setCommune} placeholder="Commune" />
            </FormField>
          </VStack>
          <FormFooter
            onCancel={() => setEditOpen(false)}
            onSave={async () => {
              try {
                setSaving(true);
                console.log('💾 [PROFILE] Saving profile with values:', { displayName, region, department, commune });
                await ProfilesServiceInstance.updateMyProfile({
                  display_name: displayName || null,
                  region: region || null,
                  department: department || null,
                  commune: commune || null,
                } as any);
                console.log('✅ [PROFILE] Update succeeded, refetching profile');
                await refetchProfile();
                setEditOpen(false);
                Alert.alert('Succès', 'Profil mis à jour');
              } catch (e: any) {
                console.log('❌ [PROFILE] Update error:', e?.message, e);
                Alert.alert('Erreur', e?.message || 'Échec de la mise à jour');
              } finally {
                setSaving(false);
              }
            }}
            loading={saving}
          />
        </FormContainer>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Profil">
      <ScrollView flex={1} bg="gray.50">
      {/* En-tête du profil */}
      <Box bg="primary.500" p={5} alignItems="center">
        <VStack alignItems="center" space={3}>
          <Pressable onPress={async () => {
            try {
              if (!myProfile?.id) return;
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (perm.status !== 'granted') {
                Alert.alert('Permission requise', 'Autorisez l’accès aux photos.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
              if (result.canceled || !result.assets?.length) return;
              const asset = result.assets[0];
              const response = await fetch(asset.uri);
              const arrayBuffer = await response.arrayBuffer();
              await uploadMedia({
                entityType: 'agent',
                entityId: myProfile.id,
                file: new Uint8Array(arrayBuffer),
                fileName: asset.fileName || 'profile.jpg',
                description: 'Photo de profil'
              } as any);
              Alert.alert('Succès', 'Photo de profil mise à jour.');
            } catch (e: any) {
              Alert.alert('Erreur', e?.message || 'Échec de l’upload');
            }
          }}>
            <Box w={20} h={20} rounded="full" bg="primary.400" alignItems="center" justifyContent="center" overflow="hidden">
              {photoUrl ? (
                <Image alt="avatar" source={{ uri: photoUrl }} w="full" h="full" />
              ) : (
                <Icon as={Ionicons} name="person" size="2xl" color="white" />
              )}
            </Box>
          </Pressable>
          <Text fontSize="xl" fontWeight="bold" color="white">
            {myProfile?.display_name || user?.user_metadata?.full_name || user?.email || 'Utilisateur'}
          </Text>
          <Text fontSize="md" color="white" opacity={0.8}>
            {getRoleDisplayName(userRole || '')}
          </Text>
          <Button size="sm" variant="solid" colorScheme="primary" onPress={() => {
            console.log('🧭 [PROFILE] Open edit modal pressed');
            setDisplayName(myProfile?.display_name || '');
            setRegion(myProfile?.region || '');
            setDepartment(myProfile?.department || '');
            setCommune(myProfile?.commune || '');
            console.log('🧭 [PROFILE] Prefill values:', { displayName: myProfile?.display_name, region: myProfile?.region, department: myProfile?.department, commune: myProfile?.commune });
            setEditOpen(true);
          }}>Modifier mes infos</Button>
        </VStack>
      </Box>

      {/* Sections du profil */}
      {profileSections.map((section, sectionIndex) => (
        <Box key={sectionIndex} mt={5} px={5}>
          <Text fontSize="lg" fontWeight="bold" color="coolGray.900" mb={3}>{section.title}</Text>
          <Box bg="white" rounded="xl" shadow={1}>
            {section.items.map((item, itemIndex) => (
              <HStack key={itemIndex} alignItems="center" justifyContent="space-between" px={4} py={3} borderBottomWidth={itemIndex < section.items.length - 1 ? 1 : 0} borderBottomColor="coolGray.100">
                <HStack alignItems="center" flex={1} space={3}>
                  <Box w={10} h={10} rounded="full" bg="coolGray.100" alignItems="center" justifyContent="center">
                    <Icon as={Ionicons} name={item.icon as any} size="sm" color="coolGray.500" />
                  </Box>
                  <VStack flex={1}>
                    <Text fontSize="md" fontWeight="medium" color="coolGray.900">{item.label}</Text>
                    <Text fontSize="sm" color="coolGray.600">{item.value}</Text>
                  </VStack>
                </HStack>
              </HStack>
            ))}
          </Box>
        </Box>
      ))}

      {/* Bouton de déconnexion */}
      <Box mt={7} px={5}>
        <Pressable onPress={handleSignOut} isDisabled={isSigningOut}>
          <HStack alignItems="center" justifyContent="center" bg="white" px={4} py={3} rounded="xl" borderWidth={1} borderColor="error.500" shadow={1}>
            <Icon as={Ionicons} name="log-out-outline" size="sm" color="error.500" />
            <Text ml={2} fontSize="md" fontWeight="semibold" color="error.500">{isSigningOut ? 'Déconnexion…' : 'Se Déconnecter'}</Text>
          </HStack>
        </Pressable>
      </Box>

      {/* Informations de l'application */}
      <Box mt={7} px={5} alignItems="center" mb={5}>
        <Text fontSize="xs" color="coolGray.400">AgriConnect v1.0.0</Text>
        <Text fontSize="xs" color="coolGray.400">© 2025 AgriConnect</Text>
      </Box>
      </ScrollView>

      {/* Full-screen edit handled by FormContainer when editOpen is true */}
    </ScreenContainer>
  );
};

// NativeBase theme used for all styles above

export default ProfileScreen;
