import React from 'react';
import { Box, Text, VStack, HStack } from 'native-base';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  p?: number;
  m?: number;
  mb?: number;
  bg?: string;
  borderRadius?: number;
  shadow?: number;
  borderWidth?: number;
  borderColor?: string;
  variant?: 'elevated' | 'outline' | 'filled';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  p = 4,
  m = 2,
  mb,
  bg = 'white',
  borderRadius = 8,
  shadow = 2,
  borderWidth = 0,
  borderColor = 'gray.200',
  variant = 'elevated',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          borderWidth: 1,
          borderColor: 'gray.300',
          shadow: 0,
        };
      case 'filled':
        return {
          bg: 'gray.50',
          shadow: 0,
          borderWidth: 0,
        };
      default:
        return {
          shadow,
          bg,
          borderWidth,
          borderColor,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Box
      m={m}
      mb={mb}
      p={p}
      bg={variantStyles.bg}
      borderRadius={borderRadius}
      shadow={variantStyles.shadow}
      borderWidth={variantStyles.borderWidth}
      borderColor={variantStyles.borderColor}
    >
      {(title || subtitle || headerAction) && (
        <HStack justifyContent="space-between" alignItems="flex-start" mb={3}>
          <VStack flex={1}>
            {title && (
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text fontSize="sm" color="gray.600" mt={1}>
                {subtitle}
              </Text>
            )}
          </VStack>
          {headerAction && <Box>{headerAction}</Box>}
        </HStack>
      )}
      {children}
    </Box>
  );
};
