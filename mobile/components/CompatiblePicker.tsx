import React from 'react';
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';

interface PickerItem {
  label: string;
  value: string;
}

interface CompatiblePickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: PickerItem[];
  placeholder?: string;
  style?: any;
}

const CompatiblePicker: React.FC<CompatiblePickerProps> = ({
  selectedValue,
  onValueChange,
  items,
  placeholder = "Sélectionner...",
  style
}) => {
  if (Platform.OS === 'web') {
    // Version web avec select HTML
    return (
      <View style={[styles.webContainer, style]}>
        <select
          value={selectedValue}
          onChange={(e) => onValueChange(e.target.value)}
          style={styles.webSelect}
        >
          <option value="">{placeholder}</option>
          {items.map((item, index) => (
            <option key={index} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </View>
    );
  }

  // Version mobile avec TouchableOpacity + Modal pour éviter les conflits natifs
  const [modalVisible, setModalVisible] = React.useState(false);
  const selectedItem = items.find((item) => item.value === selectedValue);

  return (
    <>
      <TouchableOpacity
        style={[styles.mobileContainer, styles.mobileButton, style]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.mobileButtonText}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.mobileButtonArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{placeholder}</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedValue === item.value && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedValue === item.value &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 48,
  },
  webSelect: {
    width: '100%',
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    fontSize: 16,
    color: '#374151',
  } as any, // Style web spécifique
  mobileContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 48,
    justifyContent: 'center',
  },
  mobileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  mobileButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  mobileButtonArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Styles pour le Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#f0f9ff', // Un bleu très clair pour l'élément sélectionné
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: '#0284c7', // Bleu pour le texte sélectionné
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#e5e7eb', // Gris clair pour le bouton fermer
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompatiblePicker;
