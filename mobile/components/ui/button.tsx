import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'default',
  className = '',
  disabled = false,
}) => {
  const baseButtonStyles: ViewStyle = {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  const baseTextStyles: TextStyle = {
    fontSize: 16,
    fontWeight: '600',
  };

  const variantStyles: {
    [key in NonNullable<ButtonProps['variant']>]: { button: ViewStyle; text: TextStyle };
  } = {
    default: {
      button: { backgroundColor: '#3D944B' }, // AgriConnect Green
      text: { color: '#FFFFFF' },
    },
    destructive: {
      button: { backgroundColor: '#FF6B6B' }, // Red
      text: { color: '#FFFFFF' },
    },
    outline: {
      button: { borderWidth: 1, borderColor: '#3D944B' },
      text: { color: '#3D944B' },
    },
    ghost: {
      button: { backgroundColor: 'transparent' },
      text: { color: '#3D944B' },
    },
  };

  const buttonStyle = [baseButtonStyles, variantStyles[variant].button];
  const textStyle = [baseTextStyles, variantStyles[variant].text];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={buttonStyle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
};

export { Button };
