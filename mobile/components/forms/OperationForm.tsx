import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { VStack } from 'native-base';
import { FormField, FormInput, FormSelect, FormDatePicker } from '../ui';
import { operationTypes } from '../../lib/types/core/collecte';

export const operationFormSchema = z.object({
  operation_date: z.date({ required_error: 'La date est requise' }),
  operation_type: z.enum(operationTypes, { required_error: 'Le type est requis' }),
  product_used: z.string().optional(),
  description: z.string().optional(),
  crop_id: z.string({ required_error: 'L\'ID de la culture est requis' }),
  dose_per_hectare: z.number().optional(),
  total_dose: z.number().optional(),
  unit: z.string().optional(),
});

export type OperationFormData = z.infer<typeof operationFormSchema>;

interface OperationFormProps {
  onSubmit: (data: OperationFormData) => void;
  initialValues?: Partial<OperationFormData>;
  isSubmitting?: boolean;
}

const OperationForm: React.FC<OperationFormProps> = ({ onSubmit, initialValues, isSubmitting = false }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OperationFormData>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: {
      operation_date: initialValues?.operation_date || new Date(),
      operation_type: initialValues?.operation_type || 'sowing',
      product_used: initialValues?.product_used || '',
      description: initialValues?.description || '',
      crop_id: initialValues?.crop_id || '',
      dose_per_hectare: initialValues?.dose_per_hectare || 0,
      total_dose: initialValues?.total_dose || 0,
      unit: initialValues?.unit || 'kg',
    },
  });

  const getOperationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      sowing: 'Semis',
      fertilization: 'Fertilisation',
      irrigation: 'Irrigation',
      weeding: 'Désherbage',
      pesticide: 'Traitement phytosanitaire',
      tillage: 'Labour',
      scouting: 'Reconnaissance',
      harvest: 'Récolte',
    };
    return labels[type] || type;
  };

  const units = [
    { value: 'kg', label: 'Kilogramme (kg)' },
    { value: 'g', label: 'Gramme (g)' },
    { value: 'l', label: 'Litre (l)' },
    { value: 'ml', label: 'Millilitre (ml)' },
    { value: 'm2', label: 'Mètre carré (m²)' },
    { value: 'ha', label: 'Hectare (ha)' },
    { value: 'unite', label: 'Unité' },
  ];

  return (
    <VStack space={4} p={4}>
      <Controller
        control={control}
        name="operation_date"
        render={({ field: { onChange, value } }) => (
          <FormField label="Date d'opération" required>
            <FormDatePicker
              value={value ? value.toISOString().split('T')[0] : ''}
              onChange={(dateString) => onChange(new Date(dateString))}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="operation_type"
        render={({ field: { onChange, value } }) => (
          <FormField label="Type d'opération" required>
            <FormSelect
              value={value}
              onValueChange={onChange}
              options={operationTypes.map(type => ({
                value: type,
                label: getOperationTypeLabel(type)
              }))}
              placeholder="Sélectionner un type"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="product_used"
        render={({ field: { onChange, value } }) => (
          <FormField label="Produit utilisé">
            <FormInput
              value={value}
              onChangeText={onChange}
              placeholder="Nom du produit"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="unit"
        render={({ field: { onChange, value } }) => (
          <FormField label="Unité">
            <FormSelect
              value={value}
              onValueChange={onChange}
              options={units}
              placeholder="Sélectionner une unité"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="dose_per_hectare"
        render={({ field: { onChange, value } }) => (
          <FormField label="Dose par hectare">
            <FormInput
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              placeholder="0.0"
              keyboardType="numeric"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="total_dose"
        render={({ field: { onChange, value } }) => (
          <FormField label="Dose totale">
            <FormInput
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              placeholder="0.0"
              keyboardType="numeric"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <FormField label="Description">
            <FormInput
              value={value}
              onChangeText={onChange}
              placeholder="Description de l'opération..."
              multiline
              numberOfLines={3}
            />
          </FormField>
        )}
      />
    </VStack>
  );
};

export default OperationForm;