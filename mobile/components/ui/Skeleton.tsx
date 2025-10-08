import React from 'react';
import { Skeleton as NativeBaseSkeleton, VStack } from 'native-base';

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  lines?: number;
  spacing?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width = '100%',
  height = 20,
  borderRadius = 4,
  lines = 1,
  spacing = 2,
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <VStack space={spacing}>
        {Array.from({ length: lines }).map((_, index) => (
          <NativeBaseSkeleton
            key={index}
            variant="rect"
            width={index === lines - 1 ? '75%' : '100%'}
            height={height}
            borderRadius={borderRadius}
            startColor="gray.200"
            endColor="gray.300"
          />
        ))}
      </VStack>
    );
  }

  return (
    <NativeBaseSkeleton
      variant={variant}
      width={width}
      height={height}
      borderRadius={variant === 'circle' ? undefined : borderRadius}
      startColor="gray.200"
      endColor="gray.300"
    />
  );
};
