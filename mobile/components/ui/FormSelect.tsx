import React, { useState } from 'react';
import { HStack, Text, Box, Pressable, useTheme } from 'native-base';
// import { FormField } from './FormField'; // Non utilisé dans ce composant
import { Feather } from '@expo/vector-icons';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  placeholder = 'Sélectionner une option',
  value,
  onValueChange,
  options,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  const selectedOption = options.find(option => option.value === value);

  return (
      <Box>
        {label && (
          <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
            {label}
          </Text>
        )}
        <Pressable
          onPress={() => !disabled && setIsOpen(!isOpen)}
          bg="white"
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="md"
          minH={42}
          px={3}
          py={2}
          opacity={disabled ? 0.6 : 1}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <Text 
              color={selectedOption ? 'gray.800' : 'gray.500'}
              fontSize="sm"
              flex={1}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
            <Feather 
              name={isOpen ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#6b7280" 
            />
          </HStack>
        </Pressable>

        {isOpen && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            bg="white"
            borderWidth={1}
            borderColor="gray.300"
            borderRadius="md"
            shadow={3}
            zIndex={9999}
            maxH={300}
            mt={1}
          >
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
                px={3}
                py={2}
                borderBottomWidth={option === options[options.length - 1] ? 0 : 1}
                borderBottomColor="gray.200"
                _hover={{ bg: 'gray.50' }}
              >
                <Text 
                  color={value === option.value ? theme.colors.primary?.[500] || '#3D944B' : 'gray.800'}
                  fontSize="sm"
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </Box>
        )}
      </Box>
  );
};