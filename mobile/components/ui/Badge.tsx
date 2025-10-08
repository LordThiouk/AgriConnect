import React from 'react';
import { Badge as NBBadge, Text, HStack } from 'native-base';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'solid' | 'subtle' | 'outline';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  bg?: string;
  borderRadius?: string;
  px?: number;
  py?: number;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'subtle',
  colorScheme = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  bg,
  borderRadius,
  px,
  py,
}) => {
  const getSizeProps = () => {
    switch (size) {
      case 'sm':
        return { px: 2, py: 1 };
      case 'lg':
        return { px: 4, py: 2 };
      default:
        return { px: 3, py: 1.5 };
    }
  };

  const sizeProps = getSizeProps();

  return (
    <NBBadge
      variant={variant}
      colorScheme={colorScheme}
      bg={bg}
      borderRadius={borderRadius || "full"}
      px={px || sizeProps.px}
      py={py || sizeProps.py}
    >
      <HStack alignItems="center" space={1}>
        {leftIcon}
        <Text fontSize={size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'} fontWeight="medium">
          {children}
        </Text>
        {rightIcon}
      </HStack>
    </NBBadge>
  );
};
