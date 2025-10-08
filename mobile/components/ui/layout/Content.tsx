import React from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { Box, VStack } from 'native-base';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingHorizontal?: number | string;
  paddingVertical?: number | string;
  scrollable?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  showsVerticalScrollIndicator?: boolean;
  backgroundColor?: any;
  space?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

const Content: React.FC<ContentProps> = ({
  children,
  style,
  padding = 5,
  paddingTop,
  paddingBottom,
  paddingHorizontal,
  paddingVertical,
  scrollable = true,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  backgroundColor = 'gray.50',
  space = 4,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  // Calculer l'espacement du header pour éviter le chevauchement avec le notch
  const headerHeight = insets.top + 60; // Hauteur du header avec notch
   // Hauteur TabBar réduite
  const responsivePaddingTop = isAuthenticated && !isLoading ? headerHeight : 0;

  const contentProps = {
    px: paddingHorizontal || padding,
    py: paddingVertical || padding,
    pt: paddingTop || responsivePaddingTop,
    pb: paddingBottom || (isAuthenticated && !isLoading ? 0 : padding),
    flex: 1,
    ...style,
  };

  const scrollViewProps = {
    flex: 1,
    keyboardShouldPersistTaps,
    showsVerticalScrollIndicator,
    contentContainerStyle: {
      flexGrow: 1,
    },
  };

  if (scrollable) {
    return (
      <Box 
        {...contentProps} 
        w="100%"
        style={{ backgroundColor: backgroundColor || '#f9fafb' }}
      >
        <ScrollView {...scrollViewProps}>
          <VStack space={space} alignItems={alignItems} justifyContent={justifyContent} w="100%">
            {children}
          </VStack>
        </ScrollView>
      </Box>
    );
  }

  return (
    <Box 
      {...contentProps} 
      w="100%"
      style={{ backgroundColor: backgroundColor || '#f9fafb' }}
    >
      <VStack 
        flex={1} 
        w="100%"
        space={space} 
        alignItems={alignItems} 
        justifyContent={justifyContent}
      >
        {children}
      </VStack>
    </Box>
  );
};

// Composant Content simple pour les cas d'usage basiques
interface SimpleContentProps {
  children: React.ReactNode;
  padding?: number | string;
  scrollable?: boolean;
  backgroundColor?: any;
}

export const SimpleContent: React.FC<SimpleContentProps> = ({
  children,
  padding = 5,
  scrollable = true,
  backgroundColor = 'gray.50',
}) => {
  return (
    <Content
      padding={padding}
      scrollable={scrollable}
      backgroundColor={backgroundColor}
    >
      {children}
    </Content>
  );
};

// Composant Content pour les formulaires
interface FormContentProps {
  children: React.ReactNode;
  padding?: number | string;
  space?: number;
}

export const FormContent: React.FC<FormContentProps> = ({
  children,
  padding = 5,
  space = 4,
}) => {
  return (
    <Content
      padding={padding}
      scrollable={true}
      keyboardShouldPersistTaps="handled"
      backgroundColor="white"
      space={space}
    >
      {children}
    </Content>
  );
};

// Composant Content pour les listes
interface ListContentProps {
  children: React.ReactNode;
  padding?: number | string;
  space?: number;
}

export const ListContent: React.FC<ListContentProps> = ({
  children,
  padding = 4,
  space = 2,
}) => {
  return (
    <Content
      padding={padding}
      scrollable={true}
      backgroundColor="white"
      space={space}
    >
      {children}
    </Content>
  );
};

export default Content;
