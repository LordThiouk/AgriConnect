import React from 'react';
import { Box, HStack } from 'native-base';
import { FormButton } from './FormButton';
import { Feather } from '@expo/vector-icons';

interface FormFooterProps {
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  loading?: boolean;
  cancelText?: string;
  saveText?: string;
  deleteText?: string;
  showDelete?: boolean;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onCancel,
  onSave,
  onDelete,
  loading = false,
  cancelText = 'Annuler',
  saveText = 'Enregistrer',
  deleteText = 'Supprimer',
  showDelete = false,
}) => {
  return (
    <Box bg="white" px={5} py={4} borderTopWidth={1} borderTopColor="gray.200">
      <HStack space={3}>
        <FormButton
          onPress={onCancel}
          variant="solid"
          disabled={loading}
          bg="secondary.400"
          _pressed={{ bg: "secondary.500" }}
        >
          {cancelText}
        </FormButton>
        
        {showDelete && onDelete && (
          <FormButton
            onPress={onDelete}
            variant="solid"
            disabled={loading}
            leftIcon={<Feather name="trash-2" size={16} color="white" />}
          >
            {deleteText}
          </FormButton>
        )}
        
        <FormButton
          onPress={onSave}
          variant="solid"
          loading={loading}
          disabled={loading}
          flex={2}
          leftIcon={<Feather name="check" size={16} color="white" />}
        >
          {saveText}
        </FormButton>
      </HStack>
    </Box>
  );
};
