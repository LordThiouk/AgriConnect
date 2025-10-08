import React from 'react';
import { Box, HStack, Text, Pressable } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  onPress: () => void;
  label?: string;
  variant?: 'ghost' | 'outline' | 'solid' | 'text';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  showIcon?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: number | string;
  margin?: number | string;
}

const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  label = 'Retour',
  variant = 'ghost',
  size = 'md',
  icon = 'arrow-back',
  showIcon = true,
  showLabel = true,
  disabled = false,
  loading = false,
  color,
  backgroundColor,
  borderRadius = 'md',
  padding,
  margin = 0,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          iconSize: 16,
          fontSize: 'xs',
          paddingHorizontal: 8,
          paddingVertical: 4,
          minHeight: 32,
        };
      case 'lg':
        return {
          iconSize: 24,
          fontSize: 'md',
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 48,
        };
      default:
        return {
          iconSize: 20,
          fontSize: 'sm',
          paddingHorizontal: 12,
          paddingVertical: 6,
          minHeight: 40,
        };
    }
  };

  const styles = getSizeStyles();

  const getVariantStyles = () => {
    const baseColor = color || 'primary.500';
    const baseBg = backgroundColor;

    switch (variant) {
      case 'solid':
        return {
          bg: baseBg || baseColor,
          borderWidth: 0,
          textColor: 'white',
          iconColor: 'white',
          _pressed: { bg: `${baseColor.replace('.500', '.600')}` },
        };
      case 'outline':
        return {
          bg: 'transparent',
          borderWidth: 1,
          borderColor: baseColor,
          textColor: baseColor,
          iconColor: baseColor,
          _pressed: { bg: `${baseColor.replace('.500', '.50')}` },
        };
      case 'text':
        return {
          bg: 'transparent',
          borderWidth: 0,
          textColor: baseColor,
          iconColor: baseColor,
          _pressed: { bg: `${baseColor.replace('.500', '.50')}` },
        };
      default: // ghost
        return {
          bg: baseBg || 'gray.100',
          borderWidth: 0,
          textColor: baseColor,
          iconColor: baseColor,
          _pressed: { bg: baseBg || 'gray.200' },
        };
    }
  };

  const variantStyles = getVariantStyles();

  const buttonContent = (
    <HStack
      alignItems="center"
      justifyContent="center"
      space={showIcon && showLabel ? 2 : 0}
    >
      {showIcon && (
        <Ionicons
          name={icon}
          size={styles.iconSize}
          color={variantStyles.iconColor}
        />
      )}
      {showLabel && (
        <Text
          fontSize={styles.fontSize}
          color={variantStyles.textColor}
          fontWeight="medium"
        >
          {label}
        </Text>
      )}
    </HStack>
  );

  if (disabled || loading) {
    return (
      <Box
        bg={variantStyles.bg}
        borderWidth={variantStyles.borderWidth}
        borderColor={variantStyles.borderColor}
        borderRadius={borderRadius}
        p={padding || `${styles.paddingVertical}px ${styles.paddingHorizontal}px`}
        m={margin}
        minH={styles.minHeight}
        opacity={0.5}
        alignItems="center"
        justifyContent="center"
      >
        {buttonContent}
      </Box>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      _pressed={variantStyles._pressed}
      bg={variantStyles.bg}
      borderWidth={variantStyles.borderWidth}
      borderColor={variantStyles.borderColor}
      borderRadius={borderRadius}
      p={padding || `${styles.paddingVertical}px ${styles.paddingHorizontal}px`}
      m={margin}
      minH={styles.minHeight}
      alignItems="center"
      justifyContent="center"
      shadow={variant === 'solid' ? 1 : 0}
    >
      {buttonContent}
    </Pressable>
  );
};

// Composants spécialisés pour différents cas d'usage

// Bouton retour simple pour les headers
interface HeaderBackButtonProps {
  onPress: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const HeaderBackButton: React.FC<HeaderBackButtonProps> = ({
  onPress,
  color = 'white',
  size = 'md',
}) => {
  return (
    <BackButton
      onPress={onPress}
      variant="ghost"
      size={size}
      showLabel={false}
      color={color}
      backgroundColor="rgba(255,255,255,0.1)"
      borderRadius="lg"
      padding={2}
    />
  );
};

// Bouton retour pour les formulaires
interface FormBackButtonProps {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}

export const FormBackButton: React.FC<FormBackButtonProps> = ({
  onPress,
  label = 'Annuler',
  disabled = false,
}) => {
  return (
    <BackButton
      onPress={onPress}
      variant="outline"
      size="md"
      label={label}
      color="gray.600"
      disabled={disabled}
    />
  );
};

// Bouton retour pour les modales
interface ModalBackButtonProps {
  onPress: () => void;
  color?: string;
}

export const ModalBackButton: React.FC<ModalBackButtonProps> = ({
  onPress,
  color = 'gray.600',
}) => {
  return (
    <BackButton
      onPress={onPress}
      variant="text"
      size="md"
      showLabel={false}
      icon="close"
      color={color}
      padding={2}
    />
  );
};

export default BackButton;
