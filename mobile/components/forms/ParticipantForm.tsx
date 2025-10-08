import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { VStack, Text, HStack, Switch } from 'native-base';
import { FormField, FormInput, FormSelect, FormDatePicker } from '../ui';

export const participantFormSchema = z.object({
  name: z.string().min(2, 'Le nom est requis (2 caractères min).'),
  role: z.string().min(2, 'Le rôle est requis (2 caractères min).'),
  sex: z.enum(['M', 'F']).optional(),
  birthdate: z.date().optional(),
  literacy: z.boolean().optional(),
  languages: z.string().optional(),
  phone: z.string().optional(),
});

export type ParticipantFormData = z.infer<typeof participantFormSchema>;

interface ParticipantFormProps {
  onSubmit: (data: ParticipantFormData) => void;
  initialValues?: Partial<ParticipantFormData>;
  isSubmitting?: boolean;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({ onSubmit, initialValues, isSubmitting = false }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      role: initialValues?.role || '',
      sex: initialValues?.sex || 'M',
      birthdate: initialValues?.birthdate || undefined,
      literacy: initialValues?.literacy || false,
      languages: initialValues?.languages || '',
      phone: initialValues?.phone || '',
    },
  });

  const roles = [
    { value: 'Agent', label: 'Agent' },
    { value: 'Superviseur', label: 'Superviseur' },
    { value: 'Technicien', label: 'Technicien' },
    { value: 'Producteur', label: 'Producteur' },
    { value: 'Autre', label: 'Autre' },
  ];

  const sexOptions = [
    { value: 'M', label: 'Homme' },
    { value: 'F', label: 'Femme' },
  ];

  return (
    <VStack space={4} p={4}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <FormField label="Nom complet" required>
            <FormInput
              value={value}
              onChangeText={onChange}
              placeholder="Nom et prénom"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="role"
        render={({ field: { onChange, value } }) => (
          <FormField label="Rôle" required>
            <FormSelect
              value={value}
              onValueChange={onChange}
              options={roles}
              placeholder="Sélectionner un rôle"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="sex"
        render={({ field: { onChange, value } }) => (
          <FormField label="Sexe">
            <FormSelect
              value={value}
              onValueChange={onChange}
              options={sexOptions}
              placeholder="Sélectionner le sexe"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="birthdate"
        render={({ field: { onChange, value } }) => (
          <FormField label="Date de naissance">
            <FormDatePicker
              value={value ? value.toISOString().split('T')[0] : ''}
              onChange={(dateString) => onChange(new Date(dateString))}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <FormField label="Téléphone">
            <FormInput
              value={value}
              onChangeText={onChange}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="languages"
        render={({ field: { onChange, value } }) => (
          <FormField label="Langues parlées">
            <FormInput
              value={value}
              onChangeText={onChange}
              placeholder="Ex: Wolof, Français, Anglais"
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="literacy"
        render={({ field: { onChange, value } }) => (
          <FormField label="Alphabétisé">
            <HStack alignItems="center" space={2}>
              <Text fontSize="sm" color="gray.600">Non</Text>
              <Switch
                value={value}
                onValueChange={onChange}
                size="sm"
                colorScheme="primary"
              />
              <Text fontSize="sm" color="gray.600">Oui</Text>
            </HStack>
          </FormField>
        )}
      />
    </VStack>
  );
};

export default ParticipantForm;