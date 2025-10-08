import React from 'react';
import { Avatar as NBAvatar, VStack, Text, HStack } from 'native-base';

interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallbackText?: string;
  badge?: React.ReactNode;
  borderColor?: string;
  borderWidth?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  fallbackText,
  badge,
  borderColor = 'gray.300',
  borderWidth = 0,
}) => {
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return fallbackText || '?';
  };

  return (
    <VStack position="relative" alignItems="center">
      <NBAvatar
        source={source}
        size={size}
        borderColor={borderColor}
        borderWidth={borderWidth}
      >
        {getInitials()}
      </NBAvatar>
      {badge && (
        <VStack
          position="absolute"
          top={-2}
          right={-2}
          bg="white"
          borderRadius="full"
          p={1}
        >
          {badge}
        </VStack>
      )}
    </VStack>
  );
};
