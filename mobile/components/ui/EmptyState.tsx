import React from 'react';
import { VStack, Text, Button, Box } from 'native-base';
import { Feather } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  size = 'md',
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 40;
      case 'lg':
        return 80;
      default:
        return 60;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return { title: 'md', description: 'sm' };
      case 'lg':
        return { title: 'xl', description: 'lg' };
      default:
        return { title: 'lg', description: 'md' };
    }
  };

  const textSizes = getTextSize();
  const iconSize = getIconSize();

  return (
    <VStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      p={8}
      space={4}
    >
      <Box
        bg="gray.100"
        borderRadius="full"
        p={4}
        alignItems="center"
        justifyContent="center"
      >
        <Feather name={icon} size={iconSize} color="gray.500" />
      </Box>
      
      <VStack space={2} alignItems="center">
        <Text
          fontSize={textSizes.title}
          fontWeight="semibold"
          color="gray.800"
          textAlign="center"
        >
          {title}
        </Text>
        
        {description && (
          <Text
            fontSize={textSizes.description}
            color="gray.600"
            textAlign="center"
            maxW="300px"
          >
            {description}
          </Text>
        )}
      </VStack>
      
      {actionLabel && onAction && (
        <Button
          variant="outline"
          colorScheme="primary"
          onPress={onAction}
          mt={2}
        >
          {actionLabel}
        </Button>
      )}
    </VStack>
  );
};
