import React from 'react';
import { Fab as NBFab } from 'native-base';
import { Feather } from '@expo/vector-icons';

interface FabProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label?: string;
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
  loading?: boolean;
  renderInPortal?: boolean;
}

export const Fab: React.FC<FabProps> = ({
  icon,
  onPress,
  label,
  placement = 'bottom-right',
  size = 'md',
  colorScheme = 'primary',
  disabled = false,
  loading = false,
  renderInPortal = true,
}) => {
  return (
    <NBFab
      icon={<Feather name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      label={label}
      placement={placement}
      size={size}
      colorScheme={colorScheme}
      onPress={onPress}
      isDisabled={disabled || loading}
      renderInPortal={renderInPortal}
      _pressed={{ opacity: 0.8 }}
    />
  );
};
