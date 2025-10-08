import React from 'react';
import { Button, Text, HStack, Spinner } from 'native-base';

interface FormButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  flex?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  bg?: string;
  _pressed?: { bg: string };
}

export const FormButton: React.FC<FormButtonProps> = ({
  onPress,
  children,
  variant = 'solid',
  size = 'md',
  loading = false,
  disabled = false,
  flex = 1,
  leftIcon,
  rightIcon,
  bg,
  _pressed,
}) => {
  return (
    <Button
      variant={variant}
      size="lg"
      onPress={onPress}
      isDisabled={disabled || loading}
      flex={flex}
      colorScheme="primary"
      bg={bg}
      _pressed={_pressed || {
        opacity: 0.8,
      }}
    >
      <HStack alignItems="center" space={2}>
        {loading ? (
          <Spinner size="sm" color="white" />
        ) : (
          <>
            {leftIcon}
            <Text color="white" fontWeight="semibold">{children}</Text>
            {rightIcon}
          </>
        )}
      </HStack>
    </Button>
  );
};
