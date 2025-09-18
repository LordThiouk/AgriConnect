import React from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import FormField from '@/components/FormField';
import DateField from '@/components/DateField';
import CompatiblePicker from '@/components/CompatiblePicker';
import { Button } from '@/components/ui/button';
import Checkbox from 'expo-checkbox';
import { ThemedText as Text } from '@/components/ThemedText';

export const participantFormSchema = z.object({
  name: z.string().min(2, 'Le nom est requis (2 caractères min).'),
  role: z.string().min(2, 'Le rôle est requis (2 caractères min).'),
  sex: z.enum(['M', 'F']).optional(),
  birthdate: z.date().optional(),
  literacy: z.boolean().optional(),
  // Languages will be handled as a simple text field for now
  languages: z.string().optional(),
  phone: z.string().optional(),
});

export type ParticipantFormData = z.infer<typeof participantFormSchema>;

interface ParticipantFormProps {
  onSubmit: (data: ParticipantFormData) => void;
  initialValues?: Partial<ParticipantFormData>;
  isSubmitting?: boolean;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({
  onSubmit,
  initialValues,
  isSubmitting = false,
}) => {
  const { control, handleSubmit, formState: { errors } } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      ...initialValues,
      languages: Array.isArray(initialValues?.languages) 
        ? initialValues.languages.join(', ') 
        : initialValues?.languages,
    },
  });

  return (
    <View style={{ padding: 20 }}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Nom complet"
            placeholder="Prénom et Nom"
            value={value}
            onChangeText={onChange}
            error={typeof errors.name === 'string' ? errors.name : errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="role"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Rôle dans l'exploitation"
            placeholder="Ex: Main d'oeuvre, gérant..."
            value={value}
            onChangeText={onChange}
            error={typeof errors.role === 'string' ? errors.role : errors.role?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="birthdate"
        render={({ field: { onChange, value } }) => (
          <DateField
            label="Date de naissance (optionnel)"
            value={value ? value.toISOString().split('T')[0] : undefined}
            onChange={(dateString) => onChange(new Date(dateString))}
            error={typeof errors.birthdate === 'string' ? errors.birthdate : errors.birthdate?.message}
          />
        )}
      />
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#374151', marginBottom: 6 }}>Sexe (optionnel)</Text>
        <Controller
          control={control}
          name="sex"
          render={({ field: { onChange, value } }) => (
            <CompatiblePicker
              selectedValue={value || ''}
              onValueChange={onChange}
              items={[
                { label: 'Masculin', value: 'M' },
                { label: 'Féminin', value: 'F' }
              ]}
            />
          )}
        />
        {errors.sex && (
          <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.sex.message}
          </Text>
        )}
      </View>
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Téléphone (optionnel)"
            placeholder="Ex: +221XXXXXXXXX"
            value={value}
            onChangeText={onChange}
            keyboardType="phone-pad"
            error={typeof errors.phone === 'string' ? errors.phone : errors.phone?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="languages"
        render={({ field: { onChange, value } }) => (
          <FormField
            label="Langues parlées (séparées par des virgules)"
            placeholder="Ex: Wolof, Français"
            value={value}
            onChangeText={onChange}
            error={typeof errors.languages === 'string' ? errors.languages : errors.languages?.message}
          />
        )}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
        <Controller
          control={control}
          name="literacy"
          render={({ field: { onChange, value } }) => (
            <Checkbox
              value={value}
              onValueChange={onChange}
              color={value ? '#3D944B' : undefined}
            />
          )}
        />
        <Text style={{ marginLeft: 8 }}>Est alphabétisé(e)</Text>
      </View>
      
      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        <Text>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </Button>
    </View>
  );
};

export default ParticipantForm;
