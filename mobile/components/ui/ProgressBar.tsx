import React from 'react';
import { Progress, HStack, Text, VStack, Box } from 'native-base';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  borderRadius?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  colorScheme = 'primary',
  showLabel = false,
  label,
  showPercentage = true,
  height,
  borderRadius = 4,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getSizeProps = () => {
    switch (size) {
      case 'sm':
        return { height: height || 2 };
      case 'lg':
        return { height: height || 6 };
      default:
        return { height: height || 3 };
    }
  };

  const sizeProps = getSizeProps();

  return (
    <VStack space={1} w="100%">
      {(showLabel || showPercentage) && (
        <HStack justifyContent="space-between" alignItems="center">
          {showLabel && (
            <Text fontSize="sm" color="gray.600">
              {label || 'Progression'}
            </Text>
          )}
          {showPercentage && (
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {Math.round(percentage)}%
            </Text>
          )}
        </HStack>
      )}
      
      <Box position="relative" w="100%">
        <Progress
          value={percentage}
          colorScheme={colorScheme}
          bg="gray.200"
          {...sizeProps}
          _filledTrack={{
            borderRadius,
          }}
        />
      </Box>
    </VStack>
  );
};
