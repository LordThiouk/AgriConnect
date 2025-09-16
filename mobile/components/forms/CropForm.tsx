import React from 'react';
import { View } from 'react-native';
import FormField from '../FormField';
import CompatiblePicker from '../CompatiblePicker';
import { CROP_TYPES, CropData } from '../../types/fiche-creation';

export type CropFormProps = {
  value: CropData;
  onChange: (next: CropData) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
};

const CropForm: React.FC<CropFormProps> = ({ value, onChange, errors, disabled }) => {
  return (
    <View>
      <CompatiblePicker
        label="Type de culture"
        selectedValue={value.type}
        onValueChange={(val) => onChange({ ...value, type: val })}
        items={CROP_TYPES.map((t) => ({ label: t, value: t }))}
        error={errors?.type}
        enabled={!disabled}
      />

      <FormField
        label="Variété"
        value={value.variety || ''}
        onChangeText={(text) => onChange({ ...value, variety: text })}
        placeholder="Variété"
        error={errors?.variety}
        editable={!disabled}
      />

      <FormField
        label="Date de semis"
        value={value.sowingDate || ''}
        onChangeText={(text) => onChange({ ...value, sowingDate: text })}
        placeholder="AAAA-MM-JJ"
        error={errors?.sowingDate}
        editable={!disabled}
      />

      <FormField
        label="Surface (ha)"
        value={String(value.area ?? 0)}
        onChangeText={(text) => {
          const num = Number(text.replace(',', '.'));
          onChange({ ...value, area: isNaN(num) ? 0 : num });
        }}
        keyboardType="numeric"
        placeholder="0.00"
        error={errors?.area}
        editable={!disabled}
      />

      <FormField
        label="Notes"
        value={value.notes || ''}
        onChangeText={(text) => onChange({ ...value, notes: text })}
        placeholder="Notes facultatives"
        error={errors?.notes}
        editable={!disabled}
        multiline
      />
    </View>
  );
};

export default CropForm;
