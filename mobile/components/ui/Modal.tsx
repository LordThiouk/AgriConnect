import React from 'react';
import { Modal as NBModal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, VStack, HStack, Text, Button } from 'native-base';
import { Feather } from '@expo/vector-icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  isCentered?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
  isCentered = true,
}) => {
  return (
    <NBModal isOpen={isOpen} onClose={onClose} size={size} isCentered={isCentered}>
      <ModalBackdrop />
      <ModalContent>
        {(title || showCloseButton) && (
          <ModalHeader>
            <VStack flex={1}>
              {title && (
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  {title}
                </Text>
              )}
            </VStack>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onPress={onClose}
                _pressed={{ bg: 'gray.100' }}
              >
                <Feather name="x" size={20} color="#6b7280" />
              </Button>
            )}
          </ModalHeader>
        )}
        
        <ModalBody>
          {children}
        </ModalBody>
        
        {footer && (
          <ModalFooter>
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </NBModal>
  );
};
