import React, { useState } from 'react';
import { Text, HStack, Pressable, useTheme } from 'native-base';
// import { FormField } from './FormField'; // Non utilisé dans ce composant
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FormDatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) {
      onChange(date.toISOString().split('T')[0]);
    }
  };

  const handleDatePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  return (
    <>
      {label && (
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
          {label}
          {required && <Text color="red.500"> *</Text>}
        </Text>
      )}
      <Pressable
        onPress={handleDatePress}
        bg="white"
        borderWidth={1}
        borderColor="gray.300"
        borderRadius="md"
        minH={42}
        px={3}
        py={2}
        opacity={disabled ? 0.6 : 1}
      >
          <HStack alignItems="center" space={3} flex={1}>
            <Feather name="calendar" size={20} color={theme.colors.gray?.[500] || '#6B7280'} />
            <Text color={value ? 'gray.800' : 'gray.500'} flex={1} fontSize="sm">
              {value ? formatDate(value) : 'Sélectionner une date'}
            </Text>
          </HStack>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          locale="fr-FR"
        />
      )}
    </>
  );
};