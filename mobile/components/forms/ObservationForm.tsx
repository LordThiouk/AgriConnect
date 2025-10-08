import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { VStack, Text } from 'native-base';
import { FormField, FormInput, FormSelect, FormDatePicker } from '../ui';
import { ObservationType } from '../../lib/types/core/collecte';

const observationTypes: ObservationType[] = ['pest_disease', 'emergence', 'phenology', 'other'];

export const observationFormSchema = z.object({
  observation_date: z.date({ required_error: 'La date est requise.' }),
  observation_type: z.enum(observationTypes as [string, ...string[]], { required_error: 'Le type est requis.' }),
  description: z.string().optional(),
  severity: z.number().min(1).max(5).optional(),
  affected_area_percent: z.number().min(0).max(100).optional(),
  pest_disease_name: z.string().optional(),
  emergence_percent: z.number().min(0).max(100).optional(),
});

export type ObservationFormData = z.infer<typeof observationFormSchema>;

interface ObservationFormProps {
  onSubmit: (data: ObservationFormData) => void;
  initialData?: Partial<ObservationFormData>;
  loading?: boolean;
}

const ObservationForm: React.FC<ObservationFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ObservationFormData>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      observation_date: initialData?.observation_date || new Date(),
      observation_type: initialData?.observation_type || 'other',
      description: initialData?.description || '',
      severity: initialData?.severity || 1,
      affected_area_percent: initialData?.affected_area_percent || 0,
      pest_disease_name: initialData?.pest_disease_name || '',
      emergence_percent: initialData?.emergence_percent || 0,
    },
  });

  const observationType = watch('observation_type');

  const getObservationTypeLabel = (type: ObservationType): string => {
    switch (type) {
      case 'pest_disease':
        return 'Ravageur/Maladie';
      case 'emergence':
        return 'Levée';
      case 'phenology':
        return 'Phénologie';
      case 'other':
        return 'Autre';
      default:
        return type;
    }
  };

  return (
    <VStack space={4} p={4}>
      <Controller
        control={control}
        name="observation_date"
        render={({ field: { onChange, value } }) => (
          <FormField label="Date de l'observation" required>
            <FormDatePicker
              value={value ? value.toISOString().split('T')[0] : ''}
              onChange={(dateString) => onChange(new Date(dateString))}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="observation_type"
        render={({ field: { onChange, value } }) => (
          <FormField label="Type d'observation" required>
            <FormSelect
              value={value || ''}
              onValueChange={onChange}
              options={observationTypes.map(type => ({
                value: type,
                label: getObservationTypeLabel(type)
              }))}
              placeholder="Sélectionner un type"
            />
          </FormField>
        )}
      />

      {observationType === 'pest_disease' && (
        <>
          <Controller
            control={control}
            name="pest_disease_name"
            render={({ field: { onChange, value } }) => (
              <FormField label="Nom du ravageur/maladie">
                <FormInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: Mildiou, Puceron"
                />
              </FormField>
            )}
          />

          <Controller
            control={control}
            name="severity"
            render={({ field: { onChange, value } }) => (
              <FormField label="Sévérité (1-5)">
                <FormInput
                  value={value?.toString() || '1'}
                  onChangeText={(text) => onChange(parseInt(text) || 1)}
                  placeholder="1-5"
                  keyboardType="numeric"
                />
              </FormField>
            )}
          />

          <Controller
            control={control}
            name="affected_area_percent"
            render={({ field: { onChange, value } }) => (
              <FormField label="% Zone affectée">
                <FormInput
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  placeholder="0-100"
                  keyboardType="numeric"
                />
              </FormField>
            )}
          />
        </>
      )}

      {observationType === 'emergence' && (
        <Controller
          control={control}
          name="emergence_percent"
          render={({ field: { onChange, value } }) => (
            <FormField label="% Levée">
              <FormInput
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                placeholder="0-100"
                keyboardType="numeric"
              />
            </FormField>
          )}
        />
      )}

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <FormField label="Description">
            <FormInput
              value={value || ''}
              onChangeText={onChange}
              placeholder="Détails de l'observation..."
              multiline
              numberOfLines={4}
            />
          </FormField>
        )}
      />
    </VStack>
  );
};

export default ObservationForm;