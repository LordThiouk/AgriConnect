import React from 'react';
import { Box, VStack, HStack, Text, Button, useTheme } from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface FormContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  loading?: boolean;
  enableKeyboardAvoidance?: boolean;
  keyboardVerticalOffset?: number;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  title,
  subtitle,
  children,
  showBackButton = true,
  onBack,
  loading = false,
  enableKeyboardAvoidance = true,
  keyboardVerticalOffset = 64,
}) => {
  const router = useRouter();
  const theme = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const content = (
    <>
      {/* Header */}
      <Box bg="white" px={5} py={4} borderBottomWidth={1} borderBottomColor="gray.200" shadow={2}>
        <HStack alignItems="center" justifyContent="space-between">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleBack}
              p={2}
              rounded="lg"
              bg="gray.100"
              _pressed={{ bg: 'gray.200' }}
            >
              <Feather name="arrow-left" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />
            </Button>
          ) : (
            <Box w={10} />
          )}
          
          <VStack alignItems="center" flex={1}>
            <Text fontSize="lg" fontWeight="bold" textAlign="center" color="gray.800">
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="xs" textAlign="center" color="gray.500" mt={1}>
                {subtitle}
              </Text>
            )}
          </VStack>
          
          <Box w={10} />
        </HStack>
      </Box>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={Platform.OS === 'ios' ? { minIndexForVisible: 0 } as any : undefined}
        automaticallyAdjustContentInsets={false as any}
      >
        <VStack flex={1} p={5} space={4}>
          {children}
        </VStack>
      </ScrollView>
    </>
  );

  if (enableKeyboardAvoidance) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={'padding'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <Box flex={1} bg="gray.50">
          {content}
        </Box>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      {content}
    </Box>
  );
};
