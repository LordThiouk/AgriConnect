import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { CollecteService } from '../../../lib/services/collecte';
import { FarmFileDisplay } from '../../../types/collecte';
import { useAuth } from '../../../context/AuthContext';

export default function CollecteScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [farmFiles, setFarmFiles] = useState<FarmFileDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFarmFiles = useCallback(async () => {
    // Utiliser l'ID de l'agent de test pour le développement
    const agentId = 'd6daff9e-c1af-4a96-ab51-bd8925813890';
    
    try {
      setLoading(true);
      console.log('🔄 Chargement des fiches pour l\'agent:', agentId);
      const files = await CollecteService.getFarmFiles(agentId);
      console.log('✅ Fiches chargées:', files.length);
      setFarmFiles(files);
    } catch (error) {
      console.error('Erreur lors du chargement des fiches:', error);
      Alert.alert('Erreur', 'Impossible de charger les fiches d\'exploitation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmFiles();
  }, [loadFarmFiles]);

  // Configuration du header
  const today = new Date().toLocaleDateString();
  const agentName = user?.user_metadata?.display_name || 'Agent terrain';
  const agentFirstName = (agentName || '').split(' ')[0] || agentName;

  const HeaderTitle = useCallback(() => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="leaf" size={24} color="#3D944B" />
      <View style={{ marginLeft: 8 }}>
        <Text style={{ color: '#111827', fontWeight: '700' }}>Collecte Terrain</Text>
        <Text style={{ color: '#6b7280', fontSize: 12 }}>{today}</Text>
      </View>
    </View>
  ), [today]);

  const HeaderRight = useCallback(() => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <View style={styles.onlinePill}>
        <View style={styles.dotGreen} />
        <Text style={styles.onlineText}>En ligne</Text>
      </View>
      <Ionicons name="notifications-outline" size={20} color="#111827" style={{ marginLeft: 8 }} />
    </View>
  ), []);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      headerTitle: () => <HeaderTitle />,
      headerRight: () => <HeaderRight />,
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTitleStyle: { color: '#111827' },
      headerTintColor: '#111827',
      headerTitleAlign: 'left',
    } as any);
  }, [navigation, agentFirstName, today, HeaderTitle, HeaderRight]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFarmFiles();
    setRefreshing(false);
  }, [loadFarmFiles]);

  const handleQuickAction = (action: string) => {
    console.log('Action rapide:', action);
    switch (action) {
      case 'add_plot':
        router.push('/(tabs)/collecte/fiches/create');
        break;
      case 'new_visit':
        Alert.alert('Nouvelle Visite', 'Fonctionnalité à implémenter');
        break;
      case 'add_observation':
        Alert.alert('Observation', 'Fonctionnalité à implémenter');
        break;
      default:
        console.log('Action non gérée:', action);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'synced':
        return { backgroundColor: Colors.success.light, color: Colors.success.dark };
      case 'pending':
        return { backgroundColor: Colors.warning.light, color: Colors.warning.dark };
      case 'error':
        return { backgroundColor: Colors.error.light, color: Colors.error.dark };
      default:
        return { backgroundColor: Colors.gray.light, color: Colors.gray.dark };
    }
  };

  const getCompletionBadgeStyle = (percent: number) => {
    if (percent === 100) {
      return { backgroundColor: Colors.success.light, color: Colors.success.dark };
    } else if (percent >= 50) {
      return { backgroundColor: Colors.warning.light, color: Colors.warning.dark };
    } else {
      return { backgroundColor: Colors.error.light, color: Colors.error.dark };
    }
  };

  const getActionButtonStyle = (completionPercent: number) => {
    if (completionPercent === 100) {
      return { backgroundColor: Colors.gray.medium, color: Colors.white };
    } else {
      return { backgroundColor: Colors.primary, color: Colors.white };
    }
  };

  const getActionButtonText = (completionPercent: number) => {
    if (completionPercent === 100) {
      return 'Terminé';
    } else if (completionPercent > 0) {
      return 'Continuer';
    } else {
      return 'Modifier';
    }
  };

  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'error':
        return 'alert-circle';
      default:
        return 'cloud-offline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des fiches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bouton principal pour nouvelle fiche */}
      <View style={styles.primaryButtonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/collecte/fiches/create')}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Nouvelle Fiche Exploitation</Text>
        </TouchableOpacity>
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('add_plot')}
        >
          <Ionicons name="location" size={24} color={Colors.primary} />
          <Text style={styles.quickActionText}>Ajouter Parcelle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('new_visit')}
        >
          <Ionicons name="calendar" size={24} color={Colors.primary} />
          <Text style={styles.quickActionText}>Nouvelle Visite</Text>
        </TouchableOpacity>
        
            <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('add_observation')}
        >
          <Ionicons name="camera" size={24} color={Colors.primary} />
          <Text style={styles.quickActionText}>Observation</Text>
            </TouchableOpacity>
      </View>

      {/* Section Fiches Existantes */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Fiches Existantes</Text>
        
        <ScrollView 
          style={styles.farmFilesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {farmFiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={Colors.gray.medium} />
              <Text style={styles.emptyStateTitle}>Aucune fiche d&apos;exploitation</Text>
              <Text style={styles.emptyStateSubtitle}>
                Créez votre première fiche pour commencer la collecte
              </Text>
            </View>
          ) : (
            farmFiles.map((farmFile) => (
              <View key={farmFile.id} style={styles.farmFileCard}>
                {/* En-tête de la carte */}
                <View style={styles.cardHeader}>
                  <Text style={styles.farmFileName}>{farmFile.producerName}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.viewButton}>
                      <Ionicons name="eye" size={16} color={Colors.gray.dark} />
                    </TouchableOpacity>
            </View>
          </View>

                {/* Informations de localisation */}
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={16} color={Colors.gray.medium} />
                  <Text style={styles.locationText}>{farmFile.location}</Text>
            </View>

                {/* Informations des parcelles */}
                <View style={styles.plotsInfo}>
                  <Ionicons name="leaf-outline" size={16} color={Colors.gray.medium} />
                  <Text style={styles.plotsText}>{farmFile.plotsCount} parcelles</Text>
      </View>

                {/* Badges de statut */}
                <View style={styles.statusBadges}>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(farmFile.syncStatus)]}>
                    <Ionicons 
                      name={getSyncIcon(farmFile.syncStatus)} 
                      size={12} 
                      color={getStatusBadgeStyle(farmFile.syncStatus).color} 
                    />
                    <Text style={[styles.statusBadgeText, { color: getStatusBadgeStyle(farmFile.syncStatus).color }]}>
                      {farmFile.syncStatus === 'synced' ? 'Synchronisé' : 
                       farmFile.syncStatus === 'pending' ? 'En attente' : 'Erreur'}
            </Text>
          </View>
                  
                  <View style={[styles.completionBadge, getCompletionBadgeStyle(farmFile.completionPercent)]}>
                    <Text style={[styles.completionBadgeText, { color: getCompletionBadgeStyle(farmFile.completionPercent).color }]}>
                      {farmFile.completionPercent}% complété
            </Text>
          </View>
                </View>

                {/* Boutons d'action */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, getActionButtonStyle(farmFile.completionPercent)]}
                    onPress={() => router.push(`/(tabs)/collecte/fiches/${farmFile.id}`)}
                  >
                    <Ionicons 
                      name={farmFile.completionPercent === 100 ? "checkmark" : "create"} 
                      size={16} 
                      color={getActionButtonStyle(farmFile.completionPercent).color} 
                    />
                    <Text style={[styles.actionButtonText, { color: getActionButtonStyle(farmFile.completionPercent).color }]}>
                      {getActionButtonText(farmFile.completionPercent)}
            </Text>
                  </TouchableOpacity>
          </View>
        </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Bouton flottant */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/(tabs)/collecte/fiches/create')}
      >
        <Ionicons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray.dark,
  },
  primaryButtonContainer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.warning.light,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  farmFilesList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  farmFileCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmFileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.gray.light,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  plotsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  plotsText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  completionBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Styles pour le header
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3D944B',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: '#3D944B',
    fontWeight: '500',
  },
});