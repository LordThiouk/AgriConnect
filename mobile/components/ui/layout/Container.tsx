import React from 'react';
import { Box, VStack, HStack } from 'native-base';
// import { useRouter, usePathname } from 'expo-router'; // Désactivé - utilisation TabBar native
// import { useAuth } from '../../../context/AuthContext'; // Désactivé - utilisation TabBar native
import Header from './Header';
import Footer from './Footer';
import Content from './Content';
import SubHeader from './SubHeader';
// import { SimpleTabBar } from '../navigation/TabBar'; // Désactivé - utilisation TabBar native
// import { Ionicons } from '@expo/vector-icons'; // Désactivé - utilisation TabBar native

interface ContainerProps {
  children: React.ReactNode;
  variant?: 'fullscreen' | 'centered' | 'sidebar' | 'modal';
  backgroundColor?: string;
  padding?: number | string;
  safeArea?: boolean;
  header?: {
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    showProfileButton?: boolean;
    showNotifications?: boolean;
    onBackPress?: () => void;
    onProfilePress?: () => void;
    onNotificationsPress?: () => void;
    actions?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'transparent';
    hasSubHeader?: boolean;
  };
  footer?: {
    actions: {
      label: string;
      onPress: () => void;
      variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
      loading?: boolean;
      disabled?: boolean;
      icon?: React.ReactNode;
    }[];
    loading?: boolean;
    variant?: 'default' | 'fixed' | 'floating';
    backgroundColor?: string;
    showDivider?: boolean;
    padding?: number | string;
  };
  content?: {
    padding?: number | string;
    paddingTop?: number | string;
    scrollable?: boolean;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
    showsVerticalScrollIndicator?: boolean;
    backgroundColor?: string;
    space?: number;
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  };
}

const Container: React.FC<ContainerProps> = ({
  children,
  variant = 'fullscreen',
  backgroundColor = 'gray.50',
  padding = 0,
  safeArea = true,
  header,
  footer,
  content,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'centered':
        return {
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          minHeight: '100%',
        };
      case 'sidebar':
        return {
          flexDirection: 'row' as const,
        };
      case 'modal':
        return {
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        };
      default:
        return {
          flex: 1,
        };
    }
  };

  const styles = getVariantStyles();

  const renderContent = () => {
    if (variant === 'modal') {
      return (
        <Box
          bg="white"
          borderRadius="lg"
          p={6}
          mx={4}
          maxW="90%"
          maxH="80%"
          shadow={6}
        >
          {children}
        </Box>
      );
    }

    if (variant === 'sidebar') {
      return (
        <HStack flex={1}>
          <Box flex={1}>
            {children}
          </Box>
        </HStack>
      );
    }

    return (
      <VStack flex={1} w="100%">
        <Content {...content}>
          {children}
        </Content>
      </VStack>
    );
  };

  return (
    <Box
      flex={1}
      w="100%"
      bg={backgroundColor}
      p={padding}
      safeArea={safeArea}
      {...styles}
    >
      {header && <Header {...header} />}
      {renderContent()}
      {footer && <Footer {...footer} />}
    </Box>
  );
};

// Composants spécialisés pour les cas d'usage courants

// Container pour les écrans principaux
interface ScreenContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showProfileButton?: boolean;
  showNotifications?: boolean;
  onBackPress?: () => void;
  footerActions?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
  }[];
  footerLoading?: boolean;
  contentPadding?: number | string;
  contentScrollable?: boolean;
  showTabBar?: boolean;
  // Nouvelles props pour SubHeader
  showSubHeader?: boolean;
  subHeaderActions?: React.ReactNode;
  subHeaderVariant?: 'primary' | 'secondary' | 'transparent';
  animationEnabled?: boolean;
  compact?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  showProfileButton = true,
  showNotifications = true,
  onBackPress,
  footerActions,
  footerLoading = false,
  contentPadding = 0,
  contentScrollable = true,
  showTabBar = true,
  // Nouvelles props pour SubHeader
  showSubHeader = false,
  subHeaderActions,
  subHeaderVariant = 'primary',
  animationEnabled = true,
  compact = false,
}) => {
  return (
    <VStack flex={1} w="100%">
      <Container
        header={{
          title: showSubHeader ? 'AgriConnect' : (title || 'AgriConnect'),
          subtitle: showSubHeader ? undefined : subtitle,
          showBackButton: showSubHeader ? false : showBackButton,
          showProfileButton,
          showNotifications,
          onBackPress,
          hasSubHeader: showSubHeader,
        }}
        // footer={footerActions ? {
        //   actions: footerActions,
        //   loading: footerLoading,
        // } : undefined}
        content={{
          padding: contentPadding,
          paddingTop: showSubHeader ? 68 : contentPadding, // Compense la hauteur du Header + SubHeader
          scrollable: contentScrollable,
          space: showSubHeader ? 0 : undefined, // Pas d'espace quand SubHeader est présent
        }}
      >
        {/* SubHeader pour sous-répertoires */}
        {showSubHeader && (
          <SubHeader
            title={title || ''}
            subtitle={subtitle}
            showBackButton={showBackButton}
            onBackPress={onBackPress}
            actions={subHeaderActions}
            variant={subHeaderVariant}
            animationEnabled={animationEnabled}
            compact={compact}
          />
        )}
        
        {children}
      </Container>
    </VStack>
  );
};

// Container pour les formulaires
interface FormContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  cancelText?: string;
  saveText?: string;
  deleteText?: string;
  loading?: boolean;
  showDelete?: boolean;
  contentPadding?: number | string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  onCancel,
  onSave,
  onDelete,
  cancelText = 'Annuler',
  saveText = 'Enregistrer',
  deleteText = 'Supprimer',
  loading = false,
  showDelete = false,
  contentPadding = 5,
}) => {
  const footerActions = [];

  if (onCancel) {
    footerActions.push({
      label: cancelText,
      onPress: onCancel,
      variant: 'secondary',
    });
  }

  if (showDelete && onDelete) {
    footerActions.push({
      label: deleteText,
      onPress: onDelete,
      variant: 'outline',
    });
  }

  if (onSave) {
    footerActions.push({
      label: saveText,
      onPress: onSave,
      variant: 'primary',
      loading,
    });
  }

  return (
    <Container
      header={{
        title,
        subtitle,
        showBackButton,
        onBackPress,
      }}
      footer={{
        actions: footerActions.map(action => ({
          ...action,
          variant: action.variant as "primary" | "secondary" | "outline" | "ghost" || "primary"
        })),
        loading,
      }}
      content={{
        padding: contentPadding,
        scrollable: true,
        keyboardShouldPersistTaps: 'handled',
        backgroundColor: 'white',
      }}
    >
      {children}
    </Container>
  );
};

// Container pour les modales
interface ModalContainerProps {
  children: React.ReactNode;
  onClose?: () => void;
  backgroundColor?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  children,
  onClose,
  backgroundColor = 'rgba(0,0,0,0.5)',
  maxWidth = '90%',
  maxHeight = '80%',
}) => {
  return (
    <Container
      variant="modal"
      backgroundColor={backgroundColor}
    >
      <Box
        bg="white"
        borderRadius="lg"
        p={6}
        mx={4}
        maxW={maxWidth}
        maxH={maxHeight}
        shadow={6}
      >
        {onClose && (
          <Box position="absolute" top={2} right={2} zIndex={1}>
            {/* Bouton de fermeture - à implémenter selon les besoins */}
          </Box>
        )}
        {children}
      </Box>
    </Container>
  );
};

export default Container;
