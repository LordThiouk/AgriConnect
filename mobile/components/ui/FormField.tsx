import React from 'react';
import { Text, VStack, Box } from 'native-base';

interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

const FormFieldComponent: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helperText,
  error,
  children,
}) => {
  return (
    <VStack space={2} mb={4} w="100%">
      <Text fontSize="md" fontWeight="semibold" color="gray.600">
        {label}
        {required && <Text color="error.500" ml={1}>*</Text>}
      </Text>
      
      <Box w="100%">
        {children}
      </Box>
      
      {helperText && !error && (
        <Text fontSize="sm" color="gray.500">
          {helperText}
        </Text>
      )}
      
      {error && (
        <Text fontSize="sm" color="error.500">
          {error}
        </Text>
      )}
    </VStack>
  );
};

FormFieldComponent.displayName = 'FormField';

export const FormField = React.memo(FormFieldComponent);
