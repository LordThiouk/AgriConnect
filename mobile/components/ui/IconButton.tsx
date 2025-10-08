import React from 'react';
import { IconButton as NBIconButton } from 'native-base';
import { Feather } from '@expo/vector-icons';

interface IconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost' | 'subtle';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'gray';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'ghost',
  colorScheme = 'gray',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  return (
    <NBIconButton
      icon={<Feather name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      onPress={onPress}
      size={size}
      variant={variant}
      colorScheme={colorScheme}
      isDisabled={disabled || loading}
      _pressed={{ opacity: 0.7 }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    />
  );
};
