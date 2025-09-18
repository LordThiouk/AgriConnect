import React from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
  crop_id: z.string().optional(),
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
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#374151', marginBottom: 6 }}>Catégorie d&apos;intrant</Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <CompatiblePicker
              selectedValue={value}
              onValueChange={onChange}
              items={inputCategories.map(c => ({ label: c, value: c }))}
            />
          )}
        />
        {errors.category && (
          <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.category.message}
          </Text>
        )}
      </View>
      <Controller 
        control={control}
        name="label"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Nom du produit/intrant"
            placeholder="Ex: Urée, Coton-graines"
            value={value}
            onChangeText={onChange}
            error={errors.label?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="quantity"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Quantité"
            placeholder="Ex: 50"
            value={value?.toString()}
            onChangeText={(text) => {
              const num = parseFloat(text);
              onChange(isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
            error={errors.quantity?.message}
          />
        )}
      />
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#374151', marginBottom: 6 }}>Unité</Text>
        <Controller
          control={control}
          name="unit"
          render={({ field: { onChange, value } }) => (
            <CompatiblePicker
              selectedValue={value}
              onValueChange={onChange}
              items={inputUnits.map(u => ({ label: u, value: u }))}
            />
          )}
        />
        {errors.unit && (
          <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.unit.message}
          </Text>
        )}
      </View>
      <Controller
        control={control}
        name="crop_id"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="ID de la culture (optionnel)"
            placeholder="Lier à une culture spécifique"
            value={value}
            onChangeText={onChange}
            error={errors.crop_id?.message}
          />
        )}
      />
      
      <View style={{ marginTop: 20 }}>
        <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          <Text>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </Button>
      </View>
    </View>
  );
};

export default InputForm;
