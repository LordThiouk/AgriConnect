import React from 'react';
import { StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { Box, HStack, VStack, Text, IconButton, Badge, useTheme } from 'native-base';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showProfileButton?: boolean;
  showNotifications?: boolean;
  onBackPress?: () => void;
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  actions?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'transparent';
  hasSubHeader?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title = 'AgriConnect',
  subtitle,
  showBackButton = false,
  showProfileButton = true,
  showNotifications = true,
  onBackPress,
  onProfilePress,
  onNotificationsPress,
  actions,
  variant = 'primary',
  hasSubHeader = false,
}) => {
  const router = useRouter();
  const { userRole } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/profile');
    }
  };

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      // Default behavior
      console.log('Notifications pressed');
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'agent':
        return 'Agent';
      case 'producer':
        return 'Producteur';
      case 'admin':
        return 'Administrateur';
      case 'supervisor':
        return 'Superviseur';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'agent':
        return 'person';
      case 'producer':
        return 'leaf';
      case 'admin':
        return 'shield';
      case 'supervisor':
        return 'eye';
      default:
        return 'person';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: 'secondary.400',
          statusBarStyle: 'light-content' as const,
          textColor: 'white',
          subtitleColor: 'secondary.100',
        };
      case 'transparent':
        return {
          bg: 'transparent',
          statusBarStyle: 'dark-content' as const,
          textColor: 'gray.800',
          subtitleColor: 'gray.600',
        };
      default:
        return {
          bg: 'primary.500',
          statusBarStyle: 'light-content' as const,
          textColor: 'white',
          subtitleColor: 'primary.100',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <>
      <StatusBar barStyle={styles.statusBarStyle} backgroundColor={styles.bg} translucent />
      <Box
        bg={styles.bg}
        px={4}
        py={hasSubHeader ? 0 : 2}
        pb={hasSubHeader ? 0 : 2}
        pt={insets.top + 10} // Couvre complètement le notch + padding
        shadow={variant !== 'transparent' ? 2 : 0}
        minH={hasSubHeader ? insets.top + 34 : insets.top + 44} // Hauteur minimale pour couvrir tout l'espace
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
      >
        <HStack justifyContent="space-between" alignItems="center">
          <HStack alignItems="center" flex={1}>
            {showBackButton && (
              <IconButton
                icon={<Ionicons name="arrow-back" size={24} color={styles.textColor} />}
                onPress={handleBackPress}
                variant="ghost"
                _pressed={{ opacity: 0.7 }}
                mr={3}
              />
            )}
            
            <VStack flex={1}>
              <Text fontSize="lg" fontWeight="bold" color={styles.textColor}>
                {title}
              </Text>
              {subtitle && (
                <Text fontSize="sm" color={styles.subtitleColor} mt={0.5}>
                  {subtitle}
                </Text>
              )}
              {userRole && !subtitle && (
                <HStack alignItems="center" mt={0.5}>
                  <Ionicons 
                    name={getRoleIcon(userRole) as any} 
                    size={12} 
                    color={styles.subtitleColor} 
                  />
                  <Text fontSize="xs" color={styles.subtitleColor} ml={1} fontWeight="medium">
                    {getRoleDisplayName(userRole)}
                  </Text>
                </HStack>
              )}
            </VStack>
          </HStack>

          <HStack alignItems="center" space={2}>
            {actions && (
              <Box>
                {actions}
              </Box>
            )}

            {showNotifications && (
              <Box position="relative">
                <IconButton
                  icon={<Ionicons name="notifications" size={22} color={styles.textColor} />}
                  onPress={handleNotificationsPress}
                  variant="ghost"
                  _pressed={{ opacity: 0.7 }}
                />
                <Badge
                  position="absolute"
                  top={-1}
                  right={-1}
                  bg={theme.colors.error?.[500] || '#ef4444'}
                  borderRadius="full"
                  minW={5}
                  h={5}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color="white"
                    textAlign="center"
                    lineHeight={12}
                  >
                    3
                  </Text>
                </Badge>
              </Box>
            )}

            {showProfileButton && (
              <IconButton
                icon={<Ionicons name="person-circle" size={24} color={styles.textColor} />}
                onPress={handleProfilePress}
                variant="ghost"
                _pressed={{ opacity: 0.7 }}
              />
            )}
          </HStack>
        </HStack>
      </Box>
    </>
  );
};

export default Header;
