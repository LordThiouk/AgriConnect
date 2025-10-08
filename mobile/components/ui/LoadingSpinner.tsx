import React from 'react';
import { VStack, Spinner, Text, Box } from 'native-base';

interface LoadingSpinnerProps {
  size?: 'sm' | 'lg';
  text?: string;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  text,
  colorScheme = 'primary',
  overlay = false,
}) => {
  const content = (
    <VStack space={3} alignItems="center">
      <Spinner size={size} colorScheme={colorScheme} />
      {text && (
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {text}
        </Text>
      )}
    </VStack>
  );

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(255, 255, 255, 0.8)"
        justifyContent="center"
        alignItems="center"
        zIndex={1000}
      >
        {content}
      </Box>
    );
  }

  return (
    <VStack flex={1} justifyContent="center" alignItems="center" p={8}>
      {content}
    </VStack>
  );
};
