import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface ContentWithHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  paddingTop?: number;
}

const ContentWithHeader: React.FC<ContentWithHeaderProps> = ({
  children,
  style,
  paddingTop = 0,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { height: screenHeight } = Dimensions.get('window');

  // Calculer seulement l'espacement du header principal (le SubHeader gère sa propre hauteur)
  const headerPercentage = 0.04; // 4% de l'écran pour le header principal uniquement
  const headerSpacing = headerPercentage * screenHeight;

  // Utiliser l'espacement calculé ou 0 si pas authentifié
  const responsivePadding = isAuthenticated && !isLoading ? headerSpacing : 0;

  return (
    <View style={[
      styles.container,
      { paddingTop: responsivePadding + paddingTop },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ContentWithHeader;
