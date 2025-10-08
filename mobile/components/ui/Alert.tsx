import React from 'react';
import { Alert as NBAlert, VStack, HStack, Text, Icon } from 'native-base';
import { Feather } from '@expo/vector-icons';

interface AlertProps {
  status: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  children?: React.ReactNode;
  isClosable?: boolean;
  onClose?: () => void;
  variant?: 'solid' | 'subtle' | 'top-accent' | 'left-accent';
}

export const Alert: React.FC<AlertProps> = ({
  status,
  title,
  description,
  children,
  isClosable = false,
  onClose,
  variant = 'subtle',
}) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <NBAlert
      status={status}
      variant={variant}
      mb={4}
    >
      <VStack flexShrink={1} w="100%">
        <HStack flexShrink={1} alignItems="center">
          <Icon as={Feather} name={getIcon()} color={`${status}.600`} mr={3} />
          <VStack flex={1}>
            {title && (
              <Text fontSize="md" fontWeight="semibold" color={`${status}.600`}>
                {title}
              </Text>
            )}
            {description && (
              <Text fontSize="sm" color={`${status}.600`} mt={1}>
                {description}
              </Text>
            )}
            {children}
          </VStack>
          {isClosable && (
            <Icon
              as={Feather}
              name="x"
              size="sm"
              color={`${status}.600`}
              onPress={onClose}
              _pressed={{ opacity: 0.7 }}
            />
          )}
        </HStack>
      </VStack>
    </NBAlert>
  );
};
