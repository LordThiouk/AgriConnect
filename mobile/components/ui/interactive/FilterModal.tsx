import React from 'react';
import { 
  Modal, 
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  IconButton,
  Button,
  Badge
} from 'native-base';

interface FilterOption {
  key: string;
  label: string;
  icon?: string | React.ReactNode;
  description?: string;
  colorScheme?: string;
  count?: number;
  disabled?: boolean;
}

interface FilterModalProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  currentFilter?: string;
  onFilterSelect: (filterKey: string) => void;
  onClose: () => void;
  onReset?: () => void;
  showResetButton?: boolean;
  showCounts?: boolean;
  variant?: 'default' | 'compact' | 'grid';
  maxHeight?: string | number;
  backgroundColor?: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  title,
  options,
  currentFilter,
  onFilterSelect,
  onClose,
  onReset,
  showResetButton = true,
  showCounts = true,
  variant = 'default',
  maxHeight = '70%',
  backgroundColor = 'white',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          itemPadding: 3,
          itemHeight: 60,
          fontSize: 'sm',
          iconSize: 20,
        };
      case 'grid':
        return {
          itemPadding: 4,
          itemHeight: 100,
          fontSize: 'md',
          iconSize: 24,
          columns: 2,
        };
      default:
        return {
          itemPadding: 4,
          itemHeight: 80,
          fontSize: 'md',
          iconSize: 24,
          columns: 1,
        };
    }
  };

  const styles = getVariantStyles();

  const renderFilterOption = (option: FilterOption) => {
    const isSelected = currentFilter === option.key;
    const isDisabled = option.disabled;

    const getColorScheme = (colorScheme?: string) => {
      switch (colorScheme) {
        case 'primary':
          return {
            bg: 'primary.50',
            borderColor: 'primary.500',
            textColor: 'primary.700',
            selectedBg: 'primary.500',
            selectedTextColor: 'white',
          };
        case 'secondary':
          return {
            bg: 'secondary.50',
            borderColor: 'secondary.500',
            textColor: 'secondary.700',
            selectedBg: 'secondary.500',
            selectedTextColor: 'white',
          };
        case 'error':
          return {
            bg: 'error.50',
            borderColor: 'error.500',
            textColor: 'error.700',
            selectedBg: 'error.500',
            selectedTextColor: 'white',
          };
        case 'success':
          return {
            bg: 'success.50',
            borderColor: 'success.500',
            textColor: 'success.700',
            selectedBg: 'success.500',
            selectedTextColor: 'white',
          };
        default:
          return {
            bg: 'gray.50',
            borderColor: 'gray.300',
            textColor: 'gray.700',
            selectedBg: 'primary.500',
            selectedTextColor: 'white',
          };
      }
    };

    const colors = getColorScheme(option.colorScheme);
    const currentBg = isSelected ? colors.selectedBg : colors.bg;
    const currentTextColor = isSelected ? colors.selectedTextColor : colors.textColor;
    const currentBorderColor = isSelected ? colors.selectedBg : colors.borderColor;

    const optionContent = (
      <HStack
        alignItems="center"
        justifyContent="space-between"
        flex={1}
      >
        <HStack alignItems="center" space={3} flex={1}>
          {option.icon && (
            <Box>
              {typeof option.icon === 'string' ? (
                <Text fontSize="2xl">{option.icon}</Text>
              ) : (
                option.icon
              )}
            </Box>
          )}
          
          <VStack flex={1}>
            <Text
              fontSize={styles.fontSize}
              fontWeight={isSelected ? 'semibold' : 'medium'}
              color={currentTextColor}
              numberOfLines={1}
            >
              {option.label}
            </Text>
            {option.description && (
              <Text
                fontSize="sm"
                color={isSelected ? `${colors.selectedTextColor}80` : 'gray.500'}
                numberOfLines={2}
              >
                {option.description}
              </Text>
            )}
          </VStack>
        </HStack>

        {showCounts && option.count !== undefined && (
          <Badge
            bg={isSelected ? `${colors.selectedTextColor}20` : 'gray.100'}
            borderRadius="full"
            px={2}
            py={1}
          >
            <Text
              fontSize="xs"
              fontWeight="medium"
              color={isSelected ? colors.selectedTextColor : 'gray.600'}
            >
              {option.count}
            </Text>
          </Badge>
        )}
      </HStack>
    );

    if (isDisabled) {
      return (
        <Box
          bg={currentBg}
          borderWidth={1}
          borderColor={currentBorderColor}
          borderRadius="lg"
          p={styles.itemPadding}
          minH={styles.itemHeight}
          opacity={0.5}
        >
          {optionContent}
        </Box>
      );
    }

    return (
      <Pressable
        onPress={() => onFilterSelect(option.key)}
        _pressed={{ opacity: 0.8 }}
        bg={currentBg}
        borderWidth={1}
        borderColor={currentBorderColor}
        borderRadius="lg"
        p={styles.itemPadding}
        minH={styles.itemHeight}
        shadow={isSelected ? 2 : 0}
      >
        {optionContent}
      </Pressable>
    );
  };

  const renderHeader = () => (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      p={4}
      borderBottomWidth={1}
      borderBottomColor="gray.200"
      bg={backgroundColor}
    >
      <Text fontSize="lg" fontWeight="bold" color="gray.800">
        {title}
      </Text>
      
      <HStack space={2}>
        {showResetButton && onReset && (
          <Button
            size="sm"
            variant="outline"
            colorScheme="gray"
            onPress={onReset}
          >
            Reset
          </Button>
        )}
        
        <IconButton
          icon={<Ionicons name="close" size={24} color="gray.600" />}
          onPress={onClose}
          variant="ghost"
          size="sm"
          _pressed={{ opacity: 0.7 }}
        />
      </HStack>
    </HStack>
  );

  const renderContent = () => {
    if (variant === 'grid') {
      return (
        <ScrollView
          flex={1}
          p={4}
          showsVerticalScrollIndicator={false}
        >
          <VStack space={3}>
            {Array.from({ length: Math.ceil(options.length / styles.columns) }).map((_, rowIndex) => (
              <HStack key={rowIndex} space={3} flex={1}>
                {Array.from({ length: styles.columns }).map((_, colIndex) => {
                  const optionIndex = rowIndex * styles.columns + colIndex;
                  const option = options[optionIndex];
                  
                  if (!option) return <Box key={colIndex} flex={1} />;
                  
                  return (
                    <Box key={option.key} flex={1}>
                      {renderFilterOption(option)}
                    </Box>
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        flex={1}
        p={4}
        showsVerticalScrollIndicator={false}
      >
        <VStack space={3}>
          {options.map((option) => renderFilterOption(option))}
        </VStack>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Box
        flex={1}
        bg="rgba(0,0,0,0.5)"
        justifyContent="flex-end"
      >
        <Box
          bg={backgroundColor}
          borderTopLeftRadius="xl"
          borderTopRightRadius="xl"
          maxH={maxHeight}
          minH="50%"
        >
          {renderHeader()}
          {renderContent()}
        </Box>
      </Box>
    </Modal>
  );
};

// Composants spécialisés pour différents cas d'usage

// Modal de filtres simple
interface SimpleFilterModalProps {
  visible: boolean;
  title: string;
  options: Array<{
    key: string;
    label: string;
    count?: number;
  }>;
  currentFilter?: string;
  onFilterSelect: (filterKey: string) => void;
  onClose: () => void;
}

export const SimpleFilterModal: React.FC<SimpleFilterModalProps> = ({
  visible,
  title,
  options,
  currentFilter,
  onFilterSelect,
  onClose,
}) => {
  return (
    <FilterModal
      visible={visible}
      title={title}
      options={options}
      currentFilter={currentFilter}
      onFilterSelect={onFilterSelect}
      onClose={onClose}
      variant="default"
      showCounts={true}
      showResetButton={false}
    />
  );
};

// Modal de filtres compacte
interface CompactFilterModalProps {
  visible: boolean;
  title: string;
  options: Array<{
    key: string;
    label: string;
    icon?: string;
    count?: number;
  }>;
  currentFilter?: string;
  onFilterSelect: (filterKey: string) => void;
  onClose: () => void;
}

export const CompactFilterModal: React.FC<CompactFilterModalProps> = ({
  visible,
  title,
  options,
  currentFilter,
  onFilterSelect,
  onClose,
}) => {
  return (
    <FilterModal
      visible={visible}
      title={title}
      options={options}
      currentFilter={currentFilter}
      onFilterSelect={onFilterSelect}
      onClose={onClose}
      variant="compact"
      showCounts={true}
      showResetButton={false}
    />
  );
};

export default FilterModal;
