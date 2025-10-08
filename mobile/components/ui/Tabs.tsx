import React from 'react';
import { VStack, HStack, Button } from 'native-base';

interface TabItem {
  title: string;
  key: string;
  component: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  isFitted?: boolean;
  variant?: 'line' | 'enclosed' | 'enclosed-colored' | 'soft-rounded' | 'solid-rounded' | 'unstyled';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultIndex = 0,
  onChange,
  isFitted = true,
  variant = 'line',
  colorScheme = 'primary',
  size = 'md',
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(defaultIndex);

  const handleTabChange = (index: number) => {
    setSelectedIndex(index);
    onChange?.(index);
  };

  return (
    <VStack flex={1}>
      <HStack
        bg="white"
        borderBottomWidth={1}
        borderBottomColor="gray.200"
        mb={4}
      >
        {tabs.map((tab, index) => (
          <Button
            key={tab.key}
            variant={selectedIndex === index ? 'solid' : 'ghost'}
            colorScheme={colorScheme}
            size={size}
            isDisabled={tab.disabled}
            onPress={() => handleTabChange(index)}
            flex={isFitted ? 1 : undefined}
            borderRadius={0}
          >
            {tab.title}
          </Button>
        ))}
      </HStack>

      <VStack flex={1}>
        {tabs.map((tab, index) => (
          selectedIndex === index && (
            <VStack key={tab.key} flex={1}>
              {tab.component}
            </VStack>
          )
        ))}
      </VStack>
    </VStack>
  );
};
