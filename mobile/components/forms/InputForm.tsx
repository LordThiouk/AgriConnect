import React from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { ThemedText as Text } from '@/components/ThemedText';
import CompatiblePicker from '@/components/CompatiblePicker';

const inputCategories = ['Fertilizer', 'Seed', 'Pesticide', 'Herbicide', 'Other'] as const;
const inputUnits = ['kg', 'g', 'L', 'mL', 'unit(s)', 'bag(s)'] as const;

export const inputFormSchema = z.object({
  category: z.enum(inputCategories, { required_error: 'La catégorie est requise.' }),
  label: z.string().min(2, 'Le nom du produit est requis.'),
  quantity: z.number({ required_error: 'La quantité est requise.', invalid_type_error: 'La quantité doit être un nombre.' }).positive('La quantité doit être positive.'),
  unit: z.enum(inputUnits, { required_error: "L'unité est requise." }),
});

export type InputFormData = z.infer<typeof inputFormSchema>;

interface InputFormProps {
  onSubmit: (data: InputFormData) => void;
  initialValues?: Partial<InputFormData>;
  isSubmitting?: boolean;
}

const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  initialValues,
  isSubmitting = false,
}) => {
  const { control, handleSubmit, formState: { errors } } = useForm<InputFormData>({
    resolver: zodResolver(inputFormSchema),
    defaultValues: initialValues,
  });

  return (
    <View style={{ padding: 20 }}>
      <CompatiblePicker
        control={control}
        name="category"
        label="Catégorie d'intrant"
        items={inputCategories.map(c => ({ label: c, value: c }))}
        error={errors.category}
      />
      <FormField
        control={control}
        name="label"
        label="Nom du produit/intrant"
        placeholder="Ex: Urée, Coton-graines"
        error={errors.label}
      />
      <FormField
        control={control}
        name="quantity"
        label="Quantité"
        placeholder="Ex: 50"
        keyboardType="numeric"
        error={errors.quantity}
        onChangeText={(text) => {
          const num = parseFloat(text);
          return isNaN(num) ? undefined : num;
        }}
      />
       <CompatiblePicker
        control={control}
        name="unit"
        label="Unité"
        items={inputUnits.map(u => ({ label: u, value: u }))}
        error={errors.unit}
      />
      
      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting} style={{ marginTop: 20 }}>
        <Text>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </Button>
    </View>
  );
};

export default InputForm;
