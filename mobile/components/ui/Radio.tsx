import React from 'react';
import { VStack, HStack, Text, Pressable } from 'native-base';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioProps {
  options: RadioOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  direction?: 'column' | 'row';
  isInvalid?: boolean;
}

export const Radio: React.FC<RadioProps> = ({
  options,
  selectedValue,
  onChange,
  disabled = false,
  colorScheme = 'primary',
  size = 'md',
  direction = 'column',
  isInvalid = false,
}) => {
  const Container = direction === 'row' ? HStack : VStack;
  const spacing = direction === 'row' ? 4 : 2;

  const getRadioColor = () => {
    switch (colorScheme) {
      case 'primary': return 'primary.500';
      case 'secondary': return 'secondary.400';
      case 'success': return 'success.500';
      case 'error': return 'error.500';
      case 'warning': return 'warning.500';
      case 'info': return 'info.500';
      default: return 'primary.500';
    }
  };

  const getRadioSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  return (
    <Container space={spacing}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => !disabled && onChange(option.value)}
          opacity={disabled ? 0.6 : 1}
          _pressed={{ opacity: 0.7 }}
        >
          <HStack alignItems="center" space={3}>
            {/* Radio Circle */}
            <VStack
              w={getRadioSize()}
              h={getRadioSize()}
              borderRadius="full"
              borderWidth={2}
              borderColor={selectedValue === option.value ? getRadioColor() : 'gray.400'}
              bg={selectedValue === option.value ? getRadioColor() : 'transparent'}
              justifyContent="center"
              alignItems="center"
            >
              {selectedValue === option.value && (
                <VStack
                  w={getRadioSize() / 2}
                  h={getRadioSize() / 2}
                  borderRadius="full"
                  bg="white"
                />
              )}
            </VStack>
            
            <VStack flex={1}>
              <Text
                fontSize="md"
                color={disabled ? 'gray.400' : 'gray.700'}
                fontWeight="medium"
              >
                {option.label}
              </Text>
              {option.description && (
                <Text
                  fontSize="sm"
                  color={disabled ? 'gray.300' : 'gray.500'}
                  mt={1}
                >
                  {option.description}
                </Text>
              )}
            </VStack>
          </HStack>
        </Pressable>
        ))}
    </Container>
  );
};
