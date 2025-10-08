import React from 'react';
import { Checkbox as NBCheckbox, VStack, Text } from 'native-base';

interface CheckboxProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  isChecked,
  onChange,
  label,
  description,
  disabled = false,
  colorScheme = 'primary',
  size = 'md',
  isInvalid = false,
}) => {
  return (
    <NBCheckbox
      isChecked={isChecked}
      onChange={onChange}
      isDisabled={disabled}
      colorScheme={colorScheme}
      size={size}
      isInvalid={isInvalid}
      value="checkbox"
    >
      {(label || description) && (
        <VStack ml={3} flex={1}>
          {label && (
            <Text
              fontSize="md"
              color={disabled ? 'gray.400' : 'gray.700'}
              fontWeight="medium"
            >
              {label}
            </Text>
          )}
          {description && (
            <Text
              fontSize="sm"
              color={disabled ? 'gray.300' : 'gray.500'}
              mt={label ? 1 : 0}
            >
              {description}
            </Text>
          )}
        </VStack>
      )}
    </NBCheckbox>
  );
};
