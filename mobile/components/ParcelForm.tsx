import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  CROP_TYPES,
  COTTON_VARIETIES,
  PARCEL_TYPOLOGY,
  PRODUCER_SIZE,
  ParcelData,
  CropData,
  ParcelFormSchema, // Importer le nouveau schéma
} from '../types/fiche-creation';
import FormField from './FormField';
import CompatiblePicker from './CompatiblePicker';
import { Colors } from '../constants/Colors';
import DateField from './DateField';

interface ParcelFormProps {
  parcel?: ParcelData;
  onSave: (parcel: Omit<ParcelData, 'id'>) => void;
  onCancel: () => void;
  onGetLocation: () => void;
}

export const ParcelForm: React.FC<ParcelFormProps> = ({
  parcel,
  onSave,
  onCancel,
  onGetLocation,
}) => {
  const [formData, setFormData] = useState<Omit<ParcelData, 'id'>>(
    parcel || {
      name: '',
      totalArea: 0,
      plantingWave: '',
      typology: PARCEL_TYPOLOGY[0],
      producerSize: PRODUCER_SIZE[0],
      cottonVariety: COTTON_VARIETIES[0],
      responsible: {},
      crops: [],
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const result = ParcelFormSchema.safeParse(formData); // Utiliser le nouveau schéma
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  const updateField = (field: keyof Omit<ParcelData, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCrop = () => {
    setFormData(prev => ({
      ...prev,
      crops: [
        ...prev.crops,
        {
          id: Date.now().toString(),
          type: CROP_TYPES[0],
          variety: '',
          sowingDate: '',
          area: 0,
        },
      ],
    }));
  };

  const updateCrop = (id: string, field: keyof CropData, value: any) => {
    setFormData(prev => ({
      ...prev,
      crops: prev.crops.map(crop =>
        crop.id === id ? { ...crop, [field]: value } : crop
      ),
    }));
  };

  const removeCrop = (id: string) => {
    Alert.alert(
      'Supprimer la culture',
      'Êtes-vous sûr de vouloir supprimer cette culture ? ',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: () =>
            setFormData(prev => ({
              ...prev,
              crops: prev.crops.filter(crop => crop.id !== id),
            })),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.safeArea}>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {parcel ? 'Modifier la Parcelle' : 'Nouvelle Parcelle'}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identification</Text>
        <FormField
          label="Nom de la parcelle *"
          value={formData.name}
          onChangeText={text => updateField('name', text)}
          placeholder="Ex: PARC001"
          error={errors.name}
        />
        <FormField
          label="Surface totale (ha) *"
          value={formData.totalArea.toString()}
          onChangeText={text => updateField('totalArea', parseFloat(text) || 0)}
          keyboardType="numeric"
          placeholder="Ex: 2.5"
          error={errors.totalArea}
        />
        <FormField
          label="Vague de plantation"
          value={formData.plantingWave}
          onChangeText={text => updateField('plantingWave', text)}
          placeholder="Ex: Vague 1"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classification</Text>
        <Text style={styles.label}>Typologie</Text>
        <CompatiblePicker
          selectedValue={formData.typology}
          onValueChange={value => updateField('typology', value)}
          items={PARCEL_TYPOLOGY.map(t => ({ label: t, value: t }))}
        />
        <Text style={styles.label}>Taille producteur</Text>
        <CompatiblePicker
          selectedValue={formData.producerSize}
          onValueChange={value => updateField('producerSize', value)}
          items={PRODUCER_SIZE.map(s => ({ label: s, value: s }))}
        />
        <Text style={styles.label}>Variété coton</Text>
        <CompatiblePicker
          selectedValue={formData.cottonVariety}
          onValueChange={value => updateField('cottonVariety', value)}
          items={COTTON_VARIETIES.map(v => ({ label: v, value: v }))}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cultures</Text>
          <TouchableOpacity style={styles.addButton} onPress={addCrop}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {formData.crops.map((crop, index) => (
          <View key={crop.id} style={styles.cropContainer}>
            <Text style={styles.cropTitle}>Culture #{index + 1}</Text>
            <CompatiblePicker
              selectedValue={crop.type}
              onValueChange={value => updateCrop(crop.id, 'type', value)}
              items={CROP_TYPES.map(c => ({ label: c, value: c }))}
            />
            <FormField
              label="Variété"
              value={crop.variety}
              onChangeText={text => updateCrop(crop.id, 'variety', text)}
            />
            <DateField
              label="Date de semis"
              value={crop.sowingDate}
              onChange={(text) => updateCrop(crop.id, 'sowingDate', text)}
              placeholder="YYYY-MM-DD"
            />
            <FormField
              label="Surface (ha)"
              value={crop.area.toString()}
              onChangeText={text =>
                updateCrop(crop.id, 'area', parseFloat(text) || 0)
              }
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeCrop(crop.id)}
            >
              <Text style={styles.removeButtonText}>Supprimer la culture</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: Colors.lightGrey,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    cancelButtonText: {
        color: Colors.darkGrey,
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: Colors.white,
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: Colors.darkGrey,
        marginBottom: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 6,
    },
    addButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    cropContainer: {
        backgroundColor: Colors.lightGrey,
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cropTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 10,
    },
    removeButton: {
        backgroundColor: Colors.red,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 10,
    },
    removeButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
