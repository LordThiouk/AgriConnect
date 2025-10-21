import React, { useState } from 'react';
import { Text, HStack, Pressable, useTheme } from 'native-base';
// import { FormField } from './FormField'; // Non utilisé dans ce composant
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

interface FormDatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  mode?: 'date' | 'time' | 'datetime';
  minuteInterval?: number;
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  placeholder?: string;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  mode = 'date',
  minuteInterval,
  display = 'default',
  placeholder = 'Sélectionner une date',
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (mode === 'time') {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (mode === 'datetime') {
      return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR');
  };

  const commitValue = (dateObj: Date) => {
    if (mode === 'date') {
      // Preserve existing behavior: keep only date part
      onChange(dateObj.toISOString().split('T')[0]);
      return;
    }
    if (mode === 'time') {
      // Merge time into existing date (or today if empty)
      const base = value ? new Date(value) : new Date();
      base.setHours(dateObj.getHours(), dateObj.getMinutes(), 0, 0);
      onChange(base.toISOString());
      return;
    }
    // datetime: full ISO
    onChange(dateObj.toISOString());
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    // Android passes 'dismissed' type
    if (event?.type === 'dismissed') {
      setShowPicker(false);
      setTempDate(null);
      return;
    }

    if (!selectedDate) {
      setShowPicker(false);
      setTempDate(null);
      return;
    }

    if (mode === 'datetime') {
      if (pickerMode === 'date') {
        // store date and open time next
        const onlyDate = new Date(selectedDate);
        onlyDate.setHours(0, 0, 0, 0);
        setTempDate(onlyDate);
        setPickerMode('time');
        // iOS closes the modal automatically → re-open for time step
        if (Platform.OS === 'ios') {
          setShowPicker(false);
          setTimeout(() => setShowPicker(true), 0);
        }
        return;
      }
      // pickerMode === 'time'
      const base = tempDate || new Date();
      base.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      commitValue(base);
      setShowPicker(false);
      setTempDate(null);
      setPickerMode('date');
      return;
    }

    // date or time only
    commitValue(selectedDate);
    setShowPicker(false);
  };

  const handleDatePress = () => {
    if (!disabled) {
      if (mode === 'datetime') {
        setPickerMode('date');
      } else {
        setPickerMode(mode);
      }
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
              {value ? formatDate(value) : placeholder}
            </Text>
          </HStack>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode={pickerMode}
          display={
            Platform.OS === 'android'
              ? (pickerMode === 'time' ? 'clock' : 'calendar')
              : display
          }
          minuteInterval={minuteInterval}
          onChange={handleChange}
          locale="fr-FR"
        />
      )}
    </>
  );
};