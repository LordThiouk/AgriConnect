import React from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import FormField from '@/components/FormField';
import DateField from '@/components/DateField';
import { Button } from '@/components/ui/button';
import { ThemedText as Text } from '@/components/ThemedText';
import CompatiblePicker from '@/components/CompatiblePicker';
import StarRating from '@/components/StarRating';
import { ObservationType, ObservationSeverity } from '@/types/collecte';

const observationTypes: ObservationType[] = ['pest_disease', 'emergence', 'phenology', 'other'];

export const observationFormSchema = z.object({
  observation_date: z.date({ required_error: 'La date est requise.' }),
  observation_type: z.enum(observationTypes as [string, ...string[]], { required_error: 'Le type est requis.' }),
  description: z.string().optional(),
  severity: z.number().min(1).max(5).optional(),
  crop_id: z.string({ required_error: 'L\'ID de la culture est requis' }),
  emergence_percent: z.number().min(0).max(100).optional(),
  pest_disease_name: z.string().optional(),
  affected_area_percent: z.number().min(0).max(100).optional(),
});

export type ObservationFormData = z.infer<typeof observationFormSchema>;

interface ObservationFormProps {
  onSubmit: (data: ObservationFormData) => void;
  initialValues?: Partial<ObservationFormData>;
  isSubmitting?: boolean;
}

const ObservationForm: React.FC<ObservationFormProps> = ({
  onSubmit,
  initialValues,
  isSubmitting = false,
}) => {
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ObservationFormData>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      ...initialValues,
      crop_id: initialValues?.crop_id || '',
      emergence_percent: initialValues?.emergence_percent,
      pest_disease_name: initialValues?.pest_disease_name || '',
      affected_area_percent: initialValues?.affected_area_percent,
    },
  });

  const severity = watch('severity');

  return (
    <View style={{ padding: 20 }}>
      <Controller
        control={control}
        name="observation_date"
        render={({ field: { onChange, value } }) => (
          <DateField
            label="Date de l'observation"
            value={value ? value.toISOString().split('T')[0] : undefined}
            onChange={(dateString) => onChange(new Date(dateString))}
            error={errors.observation_date?.message}
          />
        )}
      />
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#374151', marginBottom: 6 }}>Type d&apos;observation</Text>
        <Controller
          control={control}
          name="observation_type"
          render={({ field: { onChange, value } }) => (
            <CompatiblePicker
              selectedValue={value}
              onValueChange={onChange}
              items={observationTypes.map(t => ({ label: t, value: t }))}
            />
          )}
        />
        {errors.observation_type && (
          <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.observation_type.message}
          </Text>
        )}
      </View>
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Description (optionnel)"
            placeholder="Décrivez ce que vous avez observé..."
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            error={errors.description?.message}
          />
        )}
      />
      <View style={{ marginVertical: 10 }}>
        <Text>Sévérité/Note (optionnel)</Text>
        <StarRating
          rating={severity as ObservationSeverity}
          onRatingChange={(newRating: number) => setValue('severity', newRating)}
        />
      </View>

      <Controller
        control={control}
        name="crop_id"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="ID de la culture (requis)"
            placeholder="Ex: uuid-de-la-culture"
            value={value}
            onChangeText={onChange}
            error={errors.crop_id?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="emergence_percent"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Pourcentage de levée (optionnel)"
            placeholder="Ex: 85"
            value={value?.toString()}
            onChangeText={(text) => {
              const num = parseInt(text);
              onChange(isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
            error={errors.emergence_percent?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="pest_disease_name"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Nom du ravageur/maladie (optionnel)"
            placeholder="Ex: Pucerons, Mildiou"
            value={value}
            onChangeText={onChange}
            error={errors.pest_disease_name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="affected_area_percent"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Pourcentage de surface affectée (optionnel)"
            placeholder="Ex: 15"
            value={value?.toString()}
            onChangeText={(text) => {
              const num = parseFloat(text);
              onChange(isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
            error={errors.affected_area_percent?.message}
          />
        )}
      />
      
      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        <Text>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </Button>
    </View>
  );
};

export default ObservationForm;
