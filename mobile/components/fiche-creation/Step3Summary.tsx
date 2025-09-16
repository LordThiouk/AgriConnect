import React from 'react';
import { View, Text } from 'react-native';
import { Cooperative, OrganizationalData, ProducerData, ParcelData } from '../../types/fiche-creation';
import { FicheCreationService } from '../../lib/services/fiche-creation';

export type Step3SummaryProps = {
  organizationalData: OrganizationalData;
  producerData: ProducerData;
  parcels: ParcelData[];
  cooperatives: Cooperative[];
};

const Step3Summary: React.FC<Step3SummaryProps> = ({ organizationalData, producerData, parcels, cooperatives }) => {
  const coopName = cooperatives.find(c => c.id === organizationalData?.cooperativeId)?.name;
  return (
    <View>
      <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d944b', marginBottom: 8 }}>Données Organisationnelles</Text>
        <Text>Nom: {organizationalData?.name}</Text>
        <Text>Localisation: {organizationalData?.village}, {organizationalData?.commune}</Text>
        <Text>Coopérative: {coopName}</Text>
      </View>
      <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d944b', marginBottom: 8 }}>Chef d&apos;Exploitation</Text>
        <Text>Nom: {producerData?.firstName} {producerData?.lastName}</Text>
        <Text>Âge: {producerData?.age ?? FicheCreationService.calculateAge(producerData?.birthDate, organizationalData?.censusDate)}</Text>
        <Text>Sexe: {producerData?.sex}</Text>
      </View>
      <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d944b', marginBottom: 8 }}>Parcelles ({parcels.length})</Text>
        {parcels.map((p, idx) => (
          <View key={p.id} style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>Parcelle {idx + 1}: {p.name}</Text>
            <Text>Surface: {p.totalArea} ha</Text>
            <Text>Cultures: {p.crops.length}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Step3Summary;
