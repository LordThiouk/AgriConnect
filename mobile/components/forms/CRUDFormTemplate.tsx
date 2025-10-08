import React from 'react';
import { VStack, ScrollView } from 'native-base';
import { FormContainer, FormFooter } from '../ui';

interface CRUDFormTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  loading?: boolean;
  cancelText?: string;
  saveText?: string;
  deleteText?: string;
  showDelete?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const CRUDFormTemplate: React.FC<CRUDFormTemplateProps> = ({
  title,
  subtitle,
  children,
  onCancel,
  onSave,
  onDelete,
  loading = false,
  cancelText = 'Annuler',
  saveText = 'Enregistrer',
  deleteText = 'Supprimer',
  showDelete = false,
  showBackButton = true,
  onBack,
}) => {
  return (
    <FormContainer
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      onBack={onBack}
      loading={loading}
    >
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={4} pb={4}>
          {children}
        </VStack>
      </ScrollView>
      
      <FormFooter
        onCancel={onCancel}
        onSave={onSave}
        onDelete={onDelete}
        loading={loading}
        cancelText={cancelText}
        saveText={saveText}
        deleteText={deleteText}
        showDelete={showDelete}
      />
    </FormContainer>
  );
};
