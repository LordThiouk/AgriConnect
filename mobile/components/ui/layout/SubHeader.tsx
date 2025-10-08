import React from 'react';
import { Box, HStack, Text, Pressable, useTheme, VStack } from 'native-base';

import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { ComponentAnimations } from '../../../lib/animations';

interface SubHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  actions?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'transparent';
  animationEnabled?: boolean;
  compact?: boolean;
}

const SubHeader: React.FC<SubHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  actions,
  variant = 'primary',
  animationEnabled = true,
  compact = false,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { getBackRoute, canGoBack } = useSmartNavigation();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      const backRoute = getBackRoute();
      if (typeof backRoute === 'string') {
        router.push(backRoute);
      } else {
        router.back();
      }
    }
  };
  
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return 'gray.50';
      case 'transparent':
        return 'transparent';
      default:
        return 'white';
    }
  };
  
  const getBorderColor = () => {
    switch (variant) {
      case 'secondary':
        return 'gray.200';
      case 'transparent':
        return 'transparent';
      default:
        return 'gray.200';
    }
  };
  
  return (
    <Animated.View
      entering={animationEnabled ? ComponentAnimations.subHeaderSlideIn : undefined}
    >
      <Box
        bg={getBackgroundColor()}
        px={compact ? 3 : 4}
        py={0}
        borderBottomWidth={variant === 'transparent' ? 0 : 1}
        borderBottomColor={getBorderColor()}
        shadow={0}
        top={0}// Position juste en dessous du Header
        left={0}
        right={0}
        zIndex={999}
      >
          <HStack alignItems="center" justifyContent="space-between" minHeight={compact ? 10 : 44}>
            {/* Bouton Retour + Titre */}
            <HStack alignItems="center" space={compact ? 2 : 3} flex={1}>
              {showBackButton && canGoBack() && (
                <Pressable
                  onPress={handleBackPress}
                  p={compact ? 1 : 1.5}
                  borderRadius="md"
                  _pressed={{ bg: 'gray.100' }}
                  _hover={{ bg: 'gray.50' }}
                >
                  <Ionicons 
                    name="arrow-back" 
                    size={compact ? 20 : 24} 
                    color={theme.colors.primary[500]} 
                  />
                </Pressable>
              )}
              
              <VStack flex={1} space={0}>
                <Text 
                  fontSize={compact ? 'md' : 'lg'} 
                  fontWeight="bold" 
                  color="gray.800"
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text 
                    fontSize={compact ? 'xs' : 'sm'} 
                    color="gray.600"
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                )}
              </VStack>
            </HStack>
            
            {/* Actions */}
            {actions && (
              <HStack space={compact ? 1 : 2} alignItems="center">
                {actions}
              </HStack>
            )}
          </HStack>
        </Box>
      </Animated.View>
  );
};

export default SubHeader;
