import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SubHeaderProps {
  title: string;
  children?: React.ReactNode; // Pour les filtres ou autres éléments
  style?: ViewStyle;
  showBackButton?: boolean;
  onBackPress?: () => void; // Navigation personnalisée
}

const SubHeader: React.FC<SubHeaderProps> = ({ title, children, style, showBackButton = false, onBackPress }) => {
  const router = useRouter();
  const { height: screenHeight } = Dimensions.get('window');

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

        // Calculer la hauteur responsive du sous-header (5% de l'écran)
        const subHeaderHeight = screenHeight * 0.05;

  return (
    <View style={[styles.container, { height: subHeaderHeight }, style]}>
      <View style={styles.headerRow}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color="#3D944B" />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, showBackButton && styles.titleWithBack]}>{title}</Text>
      </View>
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  titleWithBack: {
    marginLeft: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
});

export default SubHeader;
