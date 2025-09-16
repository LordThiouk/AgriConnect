import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import FormField from '../FormField';
import CompatiblePicker from '../CompatiblePicker';
import CropFormView from './CropForm';
import { ParcelData, PARCEL_TYPOLOGY, PRODUCER_SIZE, COTTON_VARIETIES, CropData } from '../../types/fiche-creation';

export type ParcelFormProps = {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: ParcelData) => void;
  initialData?: ParcelData | null;
};

const ParcelForm: React.FC<ParcelFormProps> = ({ isVisible, onClose, onSave, initialData }) => {
  const [parcel, setParcel] = useState<Partial<ParcelData>>(initialData || {});
  const [isCropModalVisible, setCropModalVisible] = useState(false);
  const [currentCrop, setCurrentCrop] = useState<CropData | null>(null);

  useEffect(() => {
    setParcel(initialData || {});
  }, [initialData]);

  const handleInputChange = (field: keyof ParcelData, value: any) => {
    setParcel(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewCrop = () => {
    const newCrop: CropData = {
      id: `new_crop_${Date.now()}`,
      type: 'Coton',
      variety: '',
      sowingDate: new Date().toISOString().split('T')[0],
      area: 0,
    };
    setCurrentCrop(newCrop);
    setCropModalVisible(true);
  };

  const handleEditCrop = (crop: CropData) => {
    setCurrentCrop(crop);
    setCropModalVisible(true);
  };

  const handleSaveCrop = (cropData: CropData) => {
    setParcel(prevParcel => {
      const existingCrop = prevParcel.crops?.find(c => c.id === cropData.id);
      let updatedCrops: CropData[];
      if (existingCrop) {
        updatedCrops = (prevParcel.crops || []).map(c => c.id === cropData.id ? cropData : c);
      } else {
        updatedCrops = [...(prevParcel.crops || []), cropData];
      }
      return { ...prevParcel, crops: updatedCrops } as ParcelData;
    });
    setCropModalVisible(false);
    setCurrentCrop(null);
  };

  const handleDeleteCrop = (cropId: string) => {
    setParcel(prevParcel => {
      const updatedCrops = (prevParcel.crops || []).filter(c => c.id !== cropId);
      return { ...prevParcel, crops: updatedCrops } as ParcelData;
    });
  };

  const handleSave = () => {
    const trimmedName = (parcel.name || '').trim();
    if (!trimmedName) {
      alert('Le nom de la parcelle est obligatoire.');
      return;
    }
    const safeTotalArea = typeof parcel.totalArea === 'number' && !isNaN(parcel.totalArea) ? parcel.totalArea : 0.01;
    const toSave = {
      ...parcel,
      name: trimmedName,
      totalArea: Math.max(0.01, safeTotalArea),
      typology: parcel.typology || 'A',
      producerSize: parcel.producerSize || 'Standard (< 3 ha)',
      cottonVariety: parcel.cottonVariety || 'CE',
      plantingWave: parcel.plantingWave || '1 vague',
    } as ParcelData;
    onSave(toSave);
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: 50 }}>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 24 }}>
            {initialData?.id?.startsWith?.('new_') ? 'Ajouter une parcelle' : 'Modifier la parcelle'}
          </Text>

          <FormField
            label="Nom de la parcelle *"
            value={parcel.name || ''}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Ex: Champ du fond"
          />

          <FormField
            label="Surface totale (ha)"
            value={parcel.totalArea?.toString() || ''}
            onChangeText={(text) => {
              const num = Number((text || '').replace(',', '.'));
              handleInputChange('totalArea', isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
            placeholder="Ex: 2.5"
          />

          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Typologie</Text>
          <CompatiblePicker
            selectedValue={parcel.typology}
            onValueChange={(value) => handleInputChange('typology', value)}
            items={PARCEL_TYPOLOGY.map(item => ({ label: item, value: item }))}
          />

          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginTop: 16, marginBottom: 8 }}>Taille Producteur</Text>
          <CompatiblePicker
            selectedValue={parcel.producerSize}
            onValueChange={(value) => handleInputChange('producerSize', value)}
            items={PRODUCER_SIZE.map(item => ({ label: item, value: item }))}
          />

          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginTop: 16, marginBottom: 8 }}>Variété Coton</Text>
          <CompatiblePicker
            selectedValue={parcel.cottonVariety}
            onValueChange={(value) => handleInputChange('cottonVariety', value)}
            items={COTTON_VARIETIES.map(item => ({ label: item, value: item }))}
          />

          <FormField
            label="Vague de plantation"
            value={parcel.plantingWave || ''}
            onChangeText={(text) => handleInputChange('plantingWave', text)}
            placeholder="Ex: 1ère vague"
          />

          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d944b' }}>Cultures</Text>
              <TouchableOpacity style={{ backgroundColor: '#3d944b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }} onPress={handleAddNewCrop}>
                <Text style={{ color: '#fff' }}>+ Ajouter culture</Text>
              </TouchableOpacity>
            </View>

            {parcel.crops?.length ? (
              <View style={{ gap: 12 }}>
                {(parcel.crops || []).map(crop => (
                  <View key={crop.id} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d944b', flex: 1 }}>{crop.type} - {crop.variety}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={{ backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }} onPress={() => handleEditCrop(crop)}>
                          <Text style={{ color: '#fff' }}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }} onPress={() => handleDeleteCrop(crop.id)}>
                          <Text style={{ color: '#fff' }}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={{ color: '#374151' }}>Surface: {crop.area} ha</Text>
                    <Text style={{ color: '#374151' }}>Date de semis: {crop.sowingDate}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: '#9ca3af' }}>Aucune culture ajoutée.</Text>
            )}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: Colors.gray.light, backgroundColor: Colors.white }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, alignItems: 'center' }} onPress={onClose}>
            <Text style={{ color: '#374151', fontWeight: '600', fontSize: 16 }}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center' }} onPress={handleSave}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Crop modal */}
      <Modal visible={isCropModalVisible} animationType="fade" transparent onRequestClose={() => setCropModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'stretch', width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.primary, marginBottom: 16 }}>Ajouter/Modifier Culture</Text>
            {currentCrop && (
              <CropFormView value={currentCrop} onChange={(next) => setCurrentCrop(next)} />
            )}
            <View style={{ flexDirection: 'row', paddingTop: 12, gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => setCropModalVisible(false)}>
                <Text style={{ color: '#374151' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => currentCrop && handleSaveCrop(currentCrop)}>
                <Text style={{ color: '#fff' }}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default ParcelForm;
