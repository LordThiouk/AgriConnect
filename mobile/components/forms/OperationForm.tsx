import React from 'react';
import { View, Text } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import FormField from '@/components/FormField';
import DateField from '@/components/DateField';
import CompatiblePicker from '@/components/CompatiblePicker';
import { Button } from '@/components/ui/button';
import { operationTypes } from '@/types/collecte';

export const operationFormSchema = z.object({
  operation_date: z.date({ required_error: 'La date est requise' }),
  operation_type: z.enum(operationTypes, { required_error: 'Le type est requis' }),
  product_used: z.string().optional(),
  description: z.string().optional(),
});

export type OperationFormData = z.infer<typeof operationFormSchema>;

interface OperationFormProps {
  onSubmit: (data: OperationFormData) => void;
  initialValues?: Partial<OperationFormData>;
  isSubmitting?: boolean;
}

const OperationForm: React.FC<OperationFormProps> = ({ onSubmit, initialValues, isSubmitting }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OperationFormData>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: {
      operation_date: initialValues?.operation_date ? new Date(initialValues.operation_date) : new Date(),
      operation_type: initialValues?.operation_type,
      product_used: initialValues?.product_used || '',
      description: initialValues?.description || '',
    },
  });

  const pickerItems = operationTypes.map((op) => ({ label: op, value: op }));

  return (
    <View className="space-y-4 p-4">
      <Controller
        control={control}
        name="operation_date"
        render={({ field: { onChange, value } }) => (
          <DateField
            label="Date de l'opération"
            value={value ? value.toISOString().split('T')[0] : undefined}
            onChange={(dateString) => onChange(new Date(dateString))}
            error={errors.operation_date?.message}
          />
        )}
      />
      
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#374151', marginBottom: 6 }}>Type d&apos;opération</Text>
        <Controller
          control={control}
          name="operation_type"
          render={({ field: { onChange, value } }) => (
            <CompatiblePicker
              selectedValue={value}
              onValueChange={onChange}
              items={pickerItems}
            />
          )}
        />
        {errors.operation_type && (
          <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.operation_type.message}
          </Text>
        )}
      </View>

      <Controller
        control={control}
        name="product_used"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Produit utilisé (optionnel)"
            placeholder="ex: NPK 15-15-15"
            value={value}
            onChangeText={onChange}
            error={errors.product_used?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Description (optionnel)"
            placeholder="Détails sur l'opération"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={3}
            error={errors.description?.message}
          />
        )}
      />

      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </View>
  );
};

export default OperationForm;
