import React from 'react';
import { Button as NBButton, Text, HStack, Spinner } from 'native-base';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  width?: string | number;
  fullWidth?: boolean;
  bg?: string;
  _pressed?: any;
  borderColor?: string;
  _text?: any;
  flex?: number;
  h?: number;
  mt?: number;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'solid',
  size = 'md',
  colorScheme = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  width,
  fullWidth = false,
  bg,
  _pressed,
  borderColor,
  _text,
  flex,
  h,
  mt,
}) => {
  return (
    <NBButton
      variant={variant}
      size={size}
      colorScheme={colorScheme}
      onPress={onPress}
      isDisabled={disabled || loading}
      width={fullWidth ? '100%' : width}
      bg={bg}
      _pressed={_pressed || { opacity: 0.8 }}
      borderColor={borderColor}
      _text={_text}
      flex={flex}
      h={h}
      mt={mt}
    >
      <HStack alignItems="center" space={2}>
        {loading ? (
          <Spinner size="sm" color="white" />
        ) : (
          <>
            {leftIcon}
            <Text 
              color={variant === 'solid' ? 'white' : `${colorScheme}.500`} 
              fontWeight="semibold"
              fontSize={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
            >
              {children}
            </Text>
            {rightIcon}
          </>
        )}
      </HStack>
    </NBButton>
  );
};

export { Button };
