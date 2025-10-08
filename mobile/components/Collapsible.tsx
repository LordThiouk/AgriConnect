import { PropsWithChildren, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  Box, 
  Text, 
  VStack, 
  HStack,
  Pressable,
  useTheme
} from 'native-base';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <Box>
      <Pressable
        onPress={() => setIsOpen((value) => !value)}
        _pressed={{ opacity: 0.8 }}
      >
        <HStack alignItems="center" space={2}>
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={theme.colors.gray?.[600] || '#6b7280'}
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
          <Text fontSize="md" fontWeight="semibold" color="gray.800">
            {title}
          </Text>
        </HStack>
      </Pressable>
      {isOpen && (
        <VStack mt={2} ml={6}>
          {children}
        </VStack>
      )}
    </Box>
  );
}

