import React from 'react';
import { Box, HStack, VStack, Text } from 'native-base';
import { FormButton } from '../FormButton';
import { Feather } from '@expo/vector-icons';

interface FooterAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface FooterProps {
  actions: FooterAction[];
  loading?: boolean;
  variant?: 'default' | 'fixed' | 'floating';
  backgroundColor?: string;
  showDivider?: boolean;
  padding?: number | string;
}

const Footer: React.FC<FooterProps> = ({
  actions,
  loading = false,
  variant = 'default',
  backgroundColor = 'white',
  showDivider = true,
  padding = 5,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'fixed':
        return {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          shadow: 3,
        };
      case 'floating':
        return {
          position: 'absolute' as const,
          bottom: 4,
          left: 4,
          right: 4,
          borderRadius: 'lg',
          shadow: 4,
        };
      default:
        return {
          position: 'relative' as const,
        };
    }
  };

  const styles = getVariantStyles();

  const getActionVariant = (actionVariant?: string) => {
    switch (actionVariant) {
      case 'primary':
        return {
          variant: 'solid' as const,
          bg: 'primary.500',
          _pressed: { bg: 'primary.600' },
        };
      case 'secondary':
        return {
          variant: 'solid' as const,
          bg: 'secondary.400',
          _pressed: { bg: 'secondary.500' },
        };
      case 'outline':
        return {
          variant: 'outline' as const,
          borderColor: 'primary.500',
          _text: { color: 'primary.500' },
          _pressed: { bg: 'primary.50' },
        };
      case 'ghost':
        return {
          variant: 'ghost' as const,
          _text: { color: 'gray.600' },
          _pressed: { bg: 'gray.100' },
        };
      default:
        return {
          variant: 'solid' as const,
          bg: 'primary.500',
          _pressed: { bg: 'primary.600' },
        };
    }
  };

  return (
    <Box
      bg={backgroundColor}
      px={padding}
      py={4}
      borderTopWidth={showDivider ? 1 : 0}
      borderTopColor="gray.200"
      {...styles}
    >
      <HStack space={3} alignItems="center">
        {actions.map((action, index) => {
          const actionStyles = getActionVariant(action.variant);
          const isLastAction = index === actions.length - 1;
          
          return (
            <FormButton
              key={index}
              onPress={action.onPress}
              variant={actionStyles.variant}
              loading={loading || action.loading}
              disabled={loading || action.disabled}
              flex={isLastAction ? 2 : 1}
              bg={actionStyles.bg}
              _pressed={actionStyles._pressed}
              leftIcon={action.icon}
            >
              {action.label}
            </FormButton>
          );
        })}
      </HStack>
    </Box>
  );
};

// Composant Footer simple pour les cas d'usage basiques
interface SimpleFooterProps {
  onCancel?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  cancelText?: string;
  saveText?: string;
  deleteText?: string;
  loading?: boolean;
  showDelete?: boolean;
  variant?: 'default' | 'fixed' | 'floating';
}

export const SimpleFooter: React.FC<SimpleFooterProps> = ({
  onCancel,
  onSave,
  onDelete,
  cancelText = 'Annuler',
  saveText = 'Enregistrer',
  deleteText = 'Supprimer',
  loading = false,
  showDelete = false,
  variant = 'default',
}) => {
  const actions: FooterAction[] = [];

  if (onCancel) {
    actions.push({
      label: cancelText,
      onPress: onCancel,
      variant: 'secondary',
    });
  }

  if (showDelete && onDelete) {
    actions.push({
      label: deleteText,
      onPress: onDelete,
      variant: 'outline',
      icon: <Feather name="trash-2" size={16} color="#ef4444" />,
    });
  }

  if (onSave) {
    actions.push({
      label: saveText,
      onPress: onSave,
      variant: 'primary',
      loading,
      icon: <Feather name="check" size={16} color="white" />,
    });
  }

  return <Footer actions={actions} loading={loading} variant={variant} />;
};

export default Footer;
