import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
  CROP_TYPES,
  COTTON_VARIETIES,
  PARCEL_TYPOLOGY,
  PRODUCER_SIZE,
  ParcelData,
  CropData,
  ParcelFormSchema,
} from '../lib/types/core/fiche-creation';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  ScrollView, 
  Pressable
} from 'native-base';
import { FormField, FormInput, FormSelect, FormDatePicker, FormFooter, Card } from './ui';

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
      responsible: {
        lastName: '',
        firstName: '',
        status: 'Chef d\'exploitation',
        sex: 'Homme',
        birthDate: '',
        cniNumber: '',
        phone: '',
        languages: 'Wolof',
        isYoungProducer: false,
        isWomenProducer: false,
        literacyLevel: 'Analphabète',
      },
      crops: [],
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const result = ParcelFormSchema.safeParse(formData);
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
    } else {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
    }
  };

  const addCrop = () => {
    const newCrop: CropData = {
      id: Date.now().toString(),
      type: 'Coton',
      variety: '',
      sowingDate: '',
      area: 0,
    };
    setFormData(prev => ({
      ...prev,
      crops: [...prev.crops, newCrop],
    }));
  };

  const updateCrop = (cropId: string, field: keyof CropData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      crops: prev.crops.map(crop =>
        crop.id === cropId ? { ...crop, [field]: value } : crop
      ),
    }));
  };

  const removeCrop = (cropId: string) => {
    setFormData(prev => ({
      ...prev,
      crops: prev.crops.filter(crop => crop.id !== cropId),
    }));
  };

  return (
    <ScrollView flex={1} bg="gray.50">
      <VStack space={4} p={4}>
        {/* Informations générales */}
        <Card>
          <VStack space={4}>
            <Text fontSize="lg" fontWeight="bold" color="primary.500">
              Informations générales
            </Text>
            
            <FormField label="Nom de la parcelle" required>
              <FormInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Nom de la parcelle"
              />
            </FormField>

            <FormField label="Surface totale (ha)" required>
              <FormInput
                value={formData.totalArea.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, totalArea: parseFloat(text) || 0 }))}
                placeholder="0.0"
                keyboardType="numeric"
              />
            </FormField>

            <FormField label="Vague de plantation">
              <FormInput
                value={formData.plantingWave}
                onChangeText={(text) => setFormData(prev => ({ ...prev, plantingWave: text }))}
                placeholder="Ex: 1ère vague"
              />
            </FormField>

            <FormField label="Typologie de parcelle">
              <FormSelect
                value={formData.typology}
                onValueChange={(value) => setFormData(prev => ({ ...prev, typology: value }))}
                options={PARCEL_TYPOLOGY.map(typ => ({ value: typ, label: typ }))}
                placeholder="Sélectionner une typologie"
              />
            </FormField>

            <FormField label="Taille du producteur">
              <FormSelect
                value={formData.producerSize}
                onValueChange={(value) => setFormData(prev => ({ ...prev, producerSize: value }))}
                options={PRODUCER_SIZE.map(size => ({ value: size, label: size }))}
                placeholder="Sélectionner une taille"
              />
            </FormField>

            <FormField label="Variété de coton">
              <FormSelect
                value={formData.cottonVariety}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cottonVariety: value }))}
                options={COTTON_VARIETIES.map(variety => ({ value: variety, label: variety }))}
                placeholder="Sélectionner une variété"
              />
            </FormField>

            <Pressable
              onPress={onGetLocation}
              bg="primary.500"
              p={3}
              borderRadius="md"
              _pressed={{ opacity: 0.8 }}
            >
              <Text color="white" textAlign="center" fontWeight="medium">
                📍 Obtenir la localisation GPS
              </Text>
            </Pressable>
          </VStack>
        </Card>

        {/* Responsable de la parcelle */}
        <Card>
          <VStack space={4}>
            <Text fontSize="lg" fontWeight="bold" color="primary.500">
              Responsable de la parcelle
            </Text>
            
            <HStack space={2}>
              <Box flex={1}>
                <FormField label="Nom" required>
                  <FormInput
                    value={formData.responsible.lastName}
                    onChangeText={(text) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, lastName: text }
                    }))}
                    placeholder="Nom de famille"
                  />
                </FormField>
              </Box>
              <Box flex={1}>
                <FormField label="Prénom" required>
                  <FormInput
                    value={formData.responsible.firstName}
                    onChangeText={(text) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, firstName: text }
                    }))}
                    placeholder="Prénom"
                  />
                </FormField>
              </Box>
            </HStack>

            <HStack space={2}>
              <Box flex={1}>
                <FormField label="Statut">
                  <FormSelect
                    value={formData.responsible.status}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, status: value }
                    }))}
                    options={[
                      { value: 'Chef d\'exploitation', label: 'Chef d\'exploitation' },
                      { value: 'Producteur', label: 'Producteur' }
                    ]}
                    placeholder="Sélectionner un statut"
                  />
                </FormField>
              </Box>
              <Box flex={1}>
                <FormField label="Sexe">
                  <FormSelect
                    value={formData.responsible.sex}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, sex: value }
                    }))}
                    options={[
                      { value: 'Homme', label: 'Homme' },
                      { value: 'Femme', label: 'Femme' }
                    ]}
                    placeholder="Sélectionner le sexe"
                  />
                </FormField>
              </Box>
            </HStack>

            <FormField label="Date de naissance">
              <FormDatePicker
                value={formData.responsible.birthDate}
                onChange={(text) => setFormData(prev => ({ 
                  ...prev, 
                  responsible: { ...prev.responsible, birthDate: text }
                }))}
              />
            </FormField>

            <HStack space={2}>
              <Box flex={1}>
                <FormField label="N° CNI">
                  <FormInput
                    value={formData.responsible.cniNumber}
                    onChangeText={(text) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, cniNumber: text }
                    }))}
                    placeholder="N° CNI"
                  />
                </FormField>
              </Box>
              <Box flex={1}>
                <FormField label="Téléphone">
                  <FormInput
                    value={formData.responsible.phone}
                    onChangeText={(text) => setFormData(prev => ({ 
                      ...prev, 
                      responsible: { ...prev.responsible, phone: text }
                    }))}
                    placeholder="Numéro de téléphone"
                  />
                </FormField>
              </Box>
            </HStack>
          </VStack>
        </Card>

        {/* Cultures */}
        <Card>
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="lg" fontWeight="bold" color="primary.500">
                Cultures
              </Text>
              <Pressable
                onPress={addCrop}
                bg="primary.500"
                px={3}
                py={2}
                borderRadius="md"
                _pressed={{ opacity: 0.8 }}
              >
                <Text color="white" fontWeight="medium">+ Ajouter</Text>
              </Pressable>
            </HStack>

            {formData.crops.map((crop, index) => (
              <Box key={crop.id} bg="gray.100" p={4} borderRadius="md">
                <VStack space={3}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="medium">Culture {index + 1}</Text>
                    <Pressable
                      onPress={() => removeCrop(crop.id)}
                      bg="red.500"
                      px={2}
                      py={1}
                      borderRadius="sm"
                      _pressed={{ opacity: 0.8 }}
                    >
                      <Text color="white" fontSize="sm">Supprimer</Text>
                    </Pressable>
                  </HStack>

                  <FormField label="Type de culture">
                    <FormSelect
                      value={crop.type}
                      onValueChange={(value) => updateCrop(crop.id, 'type', value)}
                      options={CROP_TYPES.map(type => ({ value: type, label: type }))}
                      placeholder="Sélectionner un type"
                    />
                  </FormField>

                  <FormField label="Variété">
                    <FormInput
                      value={crop.variety}
                      onChangeText={(text) => updateCrop(crop.id, 'variety', text)}
                      placeholder="Variété"
                    />
                  </FormField>

                  <FormField label="Date de semis">
                    <FormDatePicker
                      value={crop.sowingDate}
                      onChange={(text) => updateCrop(crop.id, 'sowingDate', text)}
                    />
                  </FormField>

                  <FormField label="Surface (ha)">
                    <FormInput
                      value={crop.area.toString()}
                      onChangeText={(text) => updateCrop(crop.id, 'area', parseFloat(text) || 0)}
                      placeholder="0.0"
                      keyboardType="numeric"
                    />
                  </FormField>
                </VStack>
              </Box>
            ))}

            {formData.crops.length === 0 && (
              <Box bg="gray.100" p={4} borderRadius="md">
                <Text color="gray.500" textAlign="center">
                  Aucune culture ajoutée
                </Text>
              </Box>
            )}
          </VStack>
        </Card>
      </VStack>

      <FormFooter 
        onCancel={onCancel}
        onSave={handleSave}
      />
    </ScrollView>
  );
};