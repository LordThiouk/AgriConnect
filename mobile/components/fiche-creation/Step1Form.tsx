import React from 'react';
import { VStack, Text, HStack } from 'native-base';
import { FormField, FormInput, FormSelect, FormDatePicker } from '../ui';
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
    <VStack space={6} p={4}>
      {/* Données organisationnelles */}
      <VStack space={4}>
        <Text fontSize="lg" fontWeight="bold" color="primary.500">
          Données organisationnelles
        </Text>

        <FormField label="Coopérative" required error={errors?.cooperativeId}>
          <FormSelect
            value={value.cooperativeId}
            onValueChange={(coopId) => onChange({ cooperativeId: coopId })}
            options={cooperatives.map(coop => ({
              value: coop.id,
              label: coop.name
            }))}
            placeholder="Sélectionner une coopérative"
          />
        </FormField>

        <FormField label="Nom de la fiche" required error={errors?.name}>
          <FormInput
            value={value.name || ''}
            onChangeText={(text) => onChange({ name: text })}
            placeholder="Ex: Fiche John Doe 2024"
          />
        </FormField>
        
        {/* Les champs creationYear et legalStatus ont été retirés du modèle de données */}

      </VStack>

      {/* Données du producteur */}
      <VStack space={4}>
        <Text fontSize="lg" fontWeight="bold" color="primary.500">
          Données du producteur
        </Text>

        <HStack space={2}>
          <FormField label="Nom" required error={errorsProducer?.lastName}>
            <FormInput
              value={producerValue.lastName || ''}
              onChangeText={(text) => onChangeProducer({ lastName: text })}
              placeholder="Nom de famille"
            />
          </FormField>

          <FormField label="Prénom" required error={errorsProducer?.firstName}>
            <FormInput
              value={producerValue.firstName || ''}
              onChangeText={(text) => onChangeProducer({ firstName: text })}
              placeholder="Prénom"
            />
          </FormField>
        </HStack>

        <FormField label="Date de naissance" error={errorsProducer?.birthDate}>
          <FormDatePicker
            value={producerValue.birthDate || ''}
            onDateChange={(date) => onChangeProducer({ birthDate: date.toISOString().split('T')[0] })}
          />
        </FormField>

        <HStack space={2}>
          <FormField label="Sexe" error={errorsProducer?.sex}>
            <FormSelect
              value={producerValue.sex || ''}
              onValueChange={(sex) => onChangeProducer({ sex: sex as any })}
              options={SEX_OPTIONS.map(option => ({
                value: option,
                label: option
              }))}
              placeholder="Sélectionner le sexe"
            />
          </FormField>

          <FormField label="Niveau d'alphabétisation" error={errorsProducer?.literacy}>
            <FormSelect
              value={producerValue.literacy || ''}
              onValueChange={(level) => onChangeProducer({ literacy: level as any })}
              options={LITERACY_OPTIONS.map(option => ({
                value: option,
                label: option
              }))}
              placeholder="Sélectionner le niveau"
            />
          </FormField>
        </HStack>

        <FormField label="Langues parlées" error={errorsProducer?.languages as any}>
          <FormSelect
            value={(producerValue.languages && producerValue.languages[0]) || ''}
            onValueChange={(lang) => onChangeProducer({ languages: [lang] as any })}
            options={LANGUAGE_OPTIONS.map(option => ({
              value: option,
              label: option
            }))}
            placeholder="Sélectionner une langue"
          />
        </FormField>

        <FormField label="Téléphone" error={errorsProducer?.phone}>
          <FormInput
            value={producerValue.phone || ''}
            onChangeText={(text) => onChangeProducer({ phone: text })}
            placeholder="Numéro de téléphone"
            keyboardType="phone-pad"
          />
        </FormField>

        {/* Le champ 'address' a été retiré du modèle de données */}
      </VStack>

      {/* Équipement */}
      <VStack space={4}>
        <Text fontSize="lg" fontWeight="bold" color="primary.500">
          Équipement
        </Text>

        <FormField label="Tracteurs" error={errorsEquipment?.farmEquipment}>
          <FormInput
            value={equipmentValue.farmEquipment?.Tracteur?.toString() || '0'}
            onChangeText={(text) => onChangeEquipment({ farmEquipment: { ...equipmentValue.farmEquipment, Tracteur: parseInt(text) || 0 } })}
            placeholder="Nombre de tracteurs"
            keyboardType="numeric"
          />
        </FormField>
        
        {/* Les champs irrigationEquipment et otherEquipment ont été restructurés */}

      </VStack>
    </VStack>
  );
};

export default Step1Form;