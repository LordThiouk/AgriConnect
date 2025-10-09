import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { VStack } from 'native-base';
import { FormField, FormInput, FormSelect } from '../ui';

const inputCategories = ['Fertilizer', 'Seed', 'Pesticide', 'Herbicide', 'Other'] as const;
const inputUnits = ['kg', 'g', 'L', 'mL', 'unit(s)', 'bag(s)'] as const;

export const inputFormSchema = z.object({
  category: z.enum(inputCategories, { required_error: 'La catégorie est requise.' }),
  label: z.string().min(2, 'Le nom du produit est requis.'),
  quantity: z.number({ required_error: 'La quantité est requise.', invalid_type_error: 'La quantité doit être un nombre.' }).positive('La quantité doit être positive.'),
  unit: z.enum(inputUnits, { required_error: "L'unité est requise." }),
  crop_id: z.string().optional(),
});

export type InputFormData = z.infer<typeof inputFormSchema>;

interface InputFormProps {
  onSubmit: (data: InputFormData) => void;
  initialValues?: Partial<InputFormData>;
  isSubmitting?: boolean;
  submitRef?: React.MutableRefObject<(() => void) | null>;
}

const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  initialValues,
  isSubmitting = false,
  submitRef,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InputFormData>({
    resolver: zodResolver(inputFormSchema),
    defaultValues: {
      category: initialValues?.category || 'Fertilizer',
      label: initialValues?.label || '',
      quantity: initialValues?.quantity || 0,
      unit: initialValues?.unit || 'kg',
      crop_id: initialValues?.crop_id || '',
    },
  });

  // Exposer la fonction de soumission via ref
  React.useEffect(() => {
    if (submitRef) {
      submitRef.current = () => handleSubmit(onSubmit)();
    }
  }, [handleSubmit, onSubmit, submitRef]);

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      Fertilizer: 'Engrais',
      Seed: 'Semence',
      Pesticide: 'Pesticide',
      Herbicide: 'Herbicide',
      Other: 'Autre',
    };
    return labels[category] || category;
  };

  const getUnitLabel = (unit: string): string => {
    const labels: Record<string, string> = {
      kg: 'Kilogramme',
      g: 'Gramme',
      L: 'Litre',
      mL: 'Millilitre',
      'unit(s)': 'Unité(s)',
      'bag(s)': 'Sac(s)',
    };
    return labels[unit] || unit;
  };

  return (
    <VStack space={4} p={4}>
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <FormField label="Catégorie" required>
            <FormSelect
              value={value}
              onValueChange={onChange}
              options={inputCategories.map(cat => ({
                value: cat,
                label: getCategoryLabel(cat)
              }))}
              placeholder="Sélectionner une catégorie"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="label"
        render={({ field: { onChange, value } }) => (
          <FormField label="Nom du produit" required>
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
        name="quantity"
        render={({ field: { onChange, value } }) => (
          <FormField label="Quantité" required>
            <FormInput
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              placeholder="0"
              keyboardType="numeric"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="unit"
        render={({ field: { onChange, value } }) => (
          <FormField label="Unité" required>
            <FormSelect
              value={value}
              onValueChange={onChange}
              options={inputUnits.map(unit => ({
                value: unit,
                label: getUnitLabel(unit)
              }))}
              placeholder="Sélectionner une unité"
            />
          </FormField>
        )}
      />
    </VStack>
  );
};

export default InputForm;