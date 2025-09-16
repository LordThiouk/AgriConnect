import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FormField from '../FormField';
import CompatiblePicker from '../CompatiblePicker';
import DateField from '../DateField';
import { Cooperative, OrganizationalData, ProducerData, EquipmentData, SEX_OPTIONS, LITERACY_OPTIONS, LANGUAGE_OPTIONS } from '../../types/fiche-creation';

export type Step1FormProps = {
  value: OrganizationalData;
  cooperatives: Cooperative[];
  onChange: (next: Partial<OrganizationalData>) => void;
  errors?: Record<string, string>;

  producerValue: ProducerData;
  onChangeProducer: (next: Partial<ProducerData>) => void;
  errorsProducer?: Record<string, string>;

  equipmentValue: EquipmentData;
  onChangeEquipment: (next: Partial<EquipmentData>) => void;
  errorsEquipment?: Record<string, string>;
};

const Step1Form: React.FC<Step1FormProps> = ({
  value,
  cooperatives,
  onChange,
  errors,
  producerValue,
  onChangeProducer,
  errorsProducer,
  equipmentValue,
  onChangeEquipment,
  errorsEquipment,
}) => {
  return (
    <View>
      {/* Données organisationnelles */}
      <FormField
        label="Nom de la fiche *"
        value={value?.name || ''}
        onChangeText={(text) => onChange({ name: text })}
        placeholder="Ex: Fiche John Doe 2025"
        error={errors?.name}
      />

      <FormField
        label="Date de recensement *"
        value={value?.censusDate || ''}
        onChangeText={(text) => onChange({ censusDate: text })}
        placeholder="YYYY-MM-DD"
        error={errors?.censusDate}
      />

      <Text style={{ marginBottom: 6 }}>Coopérative *</Text>
      <CompatiblePicker
        selectedValue={value?.cooperativeId || ''}
        onValueChange={(v) => v && onChange({ cooperativeId: v })}
        items={(cooperatives || []).map(c => ({ label: c.name, value: c.id }))}
      />

      {/* Localisation requise */}
      <FormField
        label="Région *"
        value={value?.region || ''}
        onChangeText={(text) => onChange({ region: text })}
        placeholder="Ex: Kaolack"
        error={errors?.region}
      />
      <FormField
        label="Département *"
        value={value?.department || ''}
        onChangeText={(text) => onChange({ department: text })}
        placeholder="Ex: Nioro"
        error={errors?.department}
      />
      <FormField
        label="Commune *"
        value={value?.commune || ''}
        onChangeText={(text) => onChange({ commune: text })}
        placeholder="Ex: Medina Sabakh"
        error={errors?.commune}
      />
      <FormField
        label="Village *"
        value={value?.village || ''}
        onChangeText={(text) => onChange({ village: text })}
        placeholder="Ex: Keur Massar"
        error={errors?.village}
      />
      <FormField
        label="Secteur *"
        value={value?.sector || ''}
        onChangeText={(text) => onChange({ sector: text })}
        placeholder="Ex: Secteur 1"
        error={errors?.sector}
      />

      {/* Chef d'Exploitation */}
      <Text style={{ fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Chef d&apos;Exploitation</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <FormField
          label="Prénom *"
          value={producerValue?.firstName || ''}
          onChangeText={(text) => onChangeProducer({ firstName: text })}
          placeholder="Prénom"
        />
        <FormField
          label="Nom *"
          value={producerValue?.lastName || ''}
          onChangeText={(text) => onChangeProducer({ lastName: text })}
          placeholder="Nom"
        />
      </View>

      <Text style={{ marginTop: 12, marginBottom: 6 }}>Statut *</Text>
      <CompatiblePicker
        selectedValue={producerValue?.status || ''}
        onValueChange={(v) => v && onChangeProducer({ status: v as ProducerData['status'] })}
        items={[{ label: "Chef d'exploitation", value: "Chef d'exploitation" }, { label: 'Producteur', value: 'Producteur' }]}
      />

      <DateField
        label="Date de naissance"
        value={producerValue?.birthDate || ''}
        onChange={(text) => onChangeProducer({ birthDate: text })}
        placeholder="YYYY-MM-DD"
        containerStyle={undefined}
      />

      <Text style={{ marginTop: 12, marginBottom: 6 }}>Sexe</Text>
      <CompatiblePicker
        selectedValue={producerValue?.sex || ''}
        onValueChange={(v) => onChangeProducer({ sex: v as ProducerData['sex'] })}
        items={(SEX_OPTIONS || []).map(g => ({ label: g, value: g }))}
      />

      <FormField
        label="Numéro CNI"
        value={producerValue?.cniNumber || ''}
        onChangeText={(text) => onChangeProducer({ cniNumber: text })}
        placeholder="Numéro de CNI"
      />

      <FormField
        label="Numéro de téléphone"
        value={(producerValue as any)?.phone || ''}
        onChangeText={(text) => onChangeProducer({ ...(producerValue as any), phone: text } as any)}
        placeholder="Numéro de téléphone"
        keyboardType="phone-pad"
      />

      <Text style={{ marginTop: 12, marginBottom: 6 }}>Niveau d&apos;alphabétisation</Text>
      <CompatiblePicker
        selectedValue={producerValue?.literacy || ''}
        onValueChange={(v) => onChangeProducer({ literacy: v as ProducerData['literacy'] })}
        items={(LITERACY_OPTIONS || []).map(l => ({ label: l, value: l }))}
      />

      {/* Langues parlées (multi-sélection) */}
      <Text style={{ fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Langues parlées (au moins une)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(LANGUAGE_OPTIONS || []).map((lang) => {
          const selected = (producerValue?.languages || []).includes(lang);
          return (
            <TouchableOpacity
              key={lang}
              onPress={() => {
                const current = new Set(producerValue?.languages || []);
                if (current.has(lang)) current.delete(lang); else current.add(lang);
                onChangeProducer({ languages: Array.from(current) as ProducerData['languages'] });
              }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: selected ? '#3d944b' : '#d1d5db',
                backgroundColor: selected ? '#e6f4ea' : 'white',
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: selected ? '#2f6f38' : '#374151' }}>{lang}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Inventaire matériel */}
      <Text style={{ fontWeight: '600', marginTop: 24, marginBottom: 8 }}>Inventaire Matériel</Text>
      <Text style={{ marginBottom: 6 }}>Pulvérisateurs</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <FormField
          label="Bon état (nombre)"
          value={equipmentValue?.sprayers?.goodCondition?.toString() || ''}
          onChangeText={(text) => onChangeEquipment({ sprayers: { ...(equipmentValue?.sprayers || {}), goodCondition: parseInt(text) || 0 } })}
          keyboardType="numeric"
        />
        <FormField
          label="Réparable (nombre)"
          value={equipmentValue?.sprayers?.repairable?.toString() || ''}
          onChangeText={(text) => onChangeEquipment({ sprayers: { ...(equipmentValue?.sprayers || {}), repairable: parseInt(text) || 0 } })}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
};

export default Step1Form;
