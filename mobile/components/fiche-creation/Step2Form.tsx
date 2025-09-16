import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ParcelData } from '../../types/fiche-creation';

export type Step2FormProps = {
  parcels: ParcelData[];
  onAddParcel: () => void;
  onEditParcel: (parcel: ParcelData) => void;
  onRemoveParcel: (parcelId: string) => void;
};

const Step2Form: React.FC<Step2FormProps> = ({ parcels, onAddParcel, onEditParcel, onRemoveParcel }) => {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Parcelles & Cultures</Text>
        <TouchableOpacity onPress={onAddParcel} style={{ backgroundColor: '#3d944b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }}>
          <Text style={{ color: '#fff' }}>+ Ajouter parcelle</Text>
        </TouchableOpacity>
      </View>

      {parcels.length === 0 ? (
        <Text style={{ color: '#9ca3af' }}>Aucune parcelle ajoutée</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {parcels.map((parcel) => (
            <View key={parcel.id} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d944b', flex: 1 }}>{parcel.name || 'Parcelle sans nom'}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => onEditParcel(parcel)} style={{ backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: '#fff' }}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onRemoveParcel(parcel.id)} style={{ backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: '#fff' }}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ color: '#374151' }}>Surface: {parcel.totalArea} ha</Text>
              <Text style={{ color: '#374151' }}>Cultures: {parcel.crops.length}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default Step2Form;
