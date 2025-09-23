import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet,
  Platform 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  placeholder?: string;
  disabled?: boolean;
  style?: any;
}

export default function CustomDateTimePicker({ 
  value, 
  onChange, 
  mode = 'datetime',
  placeholder = "Sélectionner...",
  disabled = false,
  style 
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (mode === 'time') {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }
    
    if (selectedDate) {
      if (mode === 'datetime') {
        if (currentMode === 'date') {
          setTempDate(selectedDate);
          setCurrentMode('time');
        } else {
          const newDate = new Date(tempDate);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setTempDate(newDate);
          onChange(newDate);
          setIsOpen(false);
        }
      } else {
        onChange(selectedDate);
        if (Platform.OS === 'ios') {
          setIsOpen(false);
        }
      }
    }
  };

  const handleOpen = () => {
    if (disabled) return;
    setTempDate(value);
    setCurrentMode(mode === 'datetime' ? 'date' : mode);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.picker,
          disabled && styles.disabled
        ]}
        onPress={handleOpen}
        disabled={disabled}
      >
        <View style={styles.pickerContent}>
          <Feather 
            name={mode === 'date' ? 'calendar' : mode === 'time' ? 'clock' : 'calendar'} 
            size={20} 
            color="#3D944B" 
          />
          <Text style={[
            styles.pickerText,
            !value && styles.placeholderText
          ]}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {currentMode === 'date' ? 'Sélectionner la date' : 'Sélectionner l\'heure'}
                </Text>
                <TouchableOpacity onPress={handleCancel}>
                  <Feather name="x" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode={currentMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date(2020, 0, 1)}
                  maximumDate={new Date(2030, 11, 31)}
                  textColor="#111827"
                  themeVariant="light"
                />
              </View>

              {Platform.OS === 'ios' && mode === 'datetime' && (
                <View style={styles.modeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      currentMode === 'date' && styles.activeModeButton
                    ]}
                    onPress={() => setCurrentMode('date')}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      currentMode === 'date' && styles.activeModeButtonText
                    ]}>
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      currentMode === 'time' && styles.activeModeButton
                    ]}
                    onPress={() => setCurrentMode('time')}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      currentMode === 'time' && styles.activeModeButtonText
                    ]}>
                      Heure
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  picker: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  pickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  pickerContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  activeModeButton: {
    backgroundColor: '#3D944B',
    borderColor: '#3D944B',
  },
  modeButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3D944B',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
