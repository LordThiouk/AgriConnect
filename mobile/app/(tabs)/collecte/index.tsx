import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { CollecteService } from '../../../lib/services/collecte';
import { FarmFileDisplay } from '../../../lib/types/core/collecte';
import { useAuth } from '../../../context/AuthContext';
import { ScreenContainer } from '../../../components/ui';

type FilterStatus = 'all' | 'draft' | 'completed';

export default function CollecteScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [farmFiles, setFarmFiles] = useState<FarmFileDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const loadFarmFiles = useCallback(async () => {
    if (!user) {
      console.log("[DIAGNOSTIC] Tentative de chargement des fiches, mais l'utilisateur n'est pas encore disponible.");
      return;
    }

    // Diagnostic crucial pour vérifier l'ID utilisateur utilisé pour l'appel
    console.log(`\n\n[DIAGNOSTIC] Appel de la fonction pour récupérer les fiches avec l'ID utilisateur : ${user.id}\n\n`);

    setRefreshing(true);
    try {
      if (!refreshing) setLoading(true);
      const files = await CollecteService.getFarmFiles(user.id);
      setFarmFiles(files);
    } catch (error) {
      console.error('Erreur chargement fiches:', error);
      Alert.alert('Erreur', 'Impossible de charger les fiches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  useEffect(() => {
    if (user) loadFarmFiles();
  }, [user, loadFarmFiles]);

  const filteredFarmFiles = useMemo(() => {
    if (activeFilter === 'all') return farmFiles;
    return farmFiles.filter(file => file.status === activeFilter);
  }, [farmFiles, activeFilter]);

  // Calcul statut KPI comme dans le dashboard
  const kpiStats = useMemo(() => [
    {
      title: 'Fiches',
      value: farmFiles.length.toString(),
      icon: 'document-text',
      color: '#3B82F6'
    },
    {
      title: 'Complétées',
      value: farmFiles.filter(f => f.completionStatus === 'completed').length.toString(),
      icon: 'checkmark-circle',
      color: '#10B981'
    },
    {
      title: 'En cours',
      value: farmFiles.filter(f => f.completionStatus === 'in_progress').length.toString(),
      icon: 'time',
      color: '#F59E0B'
    },
    {
      title: 'Brouillons',
      value: farmFiles.filter(f => f.completionStatus === 'draft').length.toString(),
      icon: 'create',
      color: '#EF4444'
    }
  ], [farmFiles]);

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
      <View style={styles.onlineStatus}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>En ligne</Text>
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
        // MVP: si on a au moins une fiche, ouvrir l'écran d'ajout parcelle pour la première
        if (farmFiles.length > 0) {
          const first = farmFiles[0];
          router.push(`/(tabs)/collecte/fiches/${first.id}/parcelles/add`);
        } else {
          // sinon, proposer de créer une fiche
          router.push('/(tabs)/collecte/fiches/create');
        }
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

  const renderItem = ({ item }: { item: FarmFileDisplay }) => (
    <TouchableOpacity
      style={[styles.modernFarmFileCard, item.completionStatus === 'completed' && styles.completedCard]}
      onPress={() => router.push(`/(tabs)/collecte/fiches/create?farmFileId=${item.id}`)}
    >
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.farmFileIconContainer, { backgroundColor: item.completionStatus === 'completed' ? '#E8F5E9' : '#FEF3E2' }]}>
            <Ionicons 
              name={item.completionStatus === 'completed' ? 'checkmark-circle' : 'document-text'} 
              size={20} 
              color={item.completionStatus === 'completed' ? '#10B981' : '#F59E0B'} 
            />
          </View>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.modernFarmFileName} numberOfLines={1}>{item.producerName}</Text>
            <Text style={styles.cardSubtitle}>{item.location}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.modernInfoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="leaf-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{item.plotsCount} parcelles</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{Math.round(item.completionPercent)}% complété</Text>
        </View>
      </View>
      
      <View style={styles.modernProgressContainer}>
        <View style={styles.modernProgressBar}>
          <View style={[
            styles.modernProgress, 
            { 
              width: `${item.completionPercent}%`, 
              backgroundColor: item.completionPercent === 100 ? '#10B981' : (item.completionPercent >= 50 ? '#F59E0B' : '#EF4444')
            } 
          ]} />
        </View>
        <Text style={styles.modernProgressText}>{Math.round(item.completionPercent)}%</Text>
      </View>
    </TouchableOpacity>
  );

  const FilterComponent = () => (
    <View style={styles.filterContainer}>
      {(['all', 'draft', 'completed'] as FilterStatus[]).map((status) => (
        <TouchableOpacity
          key={status}
          style={[styles.filterButton, activeFilter === status && styles.activeFilterButton]}
          onPress={() => setActiveFilter(status)}
        >
          <Text style={[styles.filterButtonText, activeFilter === status && styles.activeFilterButtonText]}>
            {status === 'all' ? 'Toutes' : status === 'draft' ? 'Brouillons' : 'Complétées'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text>Chargement des fiches...</Text>
      </View>
    );
  }

  return (
    <ScreenContainer title="Collecte">
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3D944B']}
            tintColor="#3D944B"
          />
        }
      >
        {/* En-tête spécifique collecte */}
        <View style={styles.modernHeaderCard}>
          <View style={styles.modernHeaderContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Ionicons name="leaf" size={24} color="#3D944B" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Collecte Terrain</Text>
                <Text style={styles.headerSubtitle}>Saisissez les données des exploitations</Text>
              </View>
            </View>
            <View style={styles.headerMeta}>
              <View style={styles.onlineStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>En ligne</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistiques de collecte */}
        <View style={styles.modernStatsContainer}>
          <Text style={styles.modernSectionTitle}>Statistiques</Text>
          <View style={styles.modernStatsGrid}>
            {kpiStats.map((stat, index) => (
              <View key={index} style={styles.modernStatCard}>
                <View style={[styles.modernKpiIcon, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon as any} size={18} color="#ffffff" />
                </View>
                <Text style={styles.modernStatValue}>{stat.value}</Text>
                <Text style={styles.modernStatLabel}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions de collecte */}
        <View style={styles.modernQuickActionsContainer}>
          <TouchableOpacity
            style={styles.modernPrimaryButton}
            onPress={() => router.push('/(tabs)/collecte/fiches/create')}
          >
            <Ionicons name="add-circle-outline" size={24} color={Colors.white} />
            <Text style={styles.modernPrimaryButtonText}>Nouvelle Fiche</Text>
          </TouchableOpacity>
          
          <View style={styles.modernQuickActionsRow}>
            <TouchableOpacity
              style={styles.modernQuickActionButton}
              onPress={() => handleQuickAction('add_plot')}
            >
              <Ionicons name="location" size={20} color="#3B82F6" />
              <Text style={styles.modernQuickActionText}>Parcelle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernQuickActionButton}
              onPress={() => handleQuickAction('new_visit')}
            >
              <Ionicons name="calendar" size={20} color="#10B981" />
              <Text style={styles.modernQuickActionText}>Visite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernQuickActionButton}
              onPress={() => handleQuickAction('add_observation')}
            >
              <Ionicons name="camera" size={20} color="#F59E0B" />
              <Text style={styles.modernQuickActionText}>Observation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fiches d'exploitation */}
        <View style={styles.modernFichesSection}>
          <View style={styles.modernSectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.modernFichesTitle}>Fiches d&apos;exploitation</Text>
              <Text style={styles.modernFichesSubtitle}>{filteredFarmFiles.length} fiches au total</Text>
            </View>
            <TouchableOpacity
              style={styles.modernAddButton}
              onPress={() => router.push('/(tabs)/collecte/fiches/create')}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <FilterComponent />

          {/* Liste des fiches en mode moderne */}
          <View style={styles.modernFarmFilesList}>
            {filteredFarmFiles.length > 0 ? (
              filteredFarmFiles.map((item) => (
                <View key={item.id}>
                  {renderItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.modernEmptyState}>
                <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                <Text style={styles.modernEmptyTitle}>Aucune fiche trouvée</Text>
                <Text style={styles.modernEmptySubtitle}>
                  {activeFilter !== 'all' 
                    ? `Aucune fiche avec le statut &quot;${activeFilter}&quot;.` 
                    : "Cr&eacute;ez une nouvelle fiche pour commencer."
                  }
                </Text>
                <TouchableOpacity
                  style={styles.modernEmptyButton}
                  onPress={() => router.push('/(tabs)/collecte/fiches/create')}
                >
                  <Ionicons name="add" size={20} color={Colors.white} />
                  <Text style={styles.modernEmptyButtonText}>Créer une fiche</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating action button moderne */}
      <TouchableOpacity
        style={styles.modernFloatingButton}
        onPress={() => router.push('/(tabs)/collecte/fiches/create')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
    const { backgroundColor, color, text } = useMemo(() => {
        if (status === 'draft') return { backgroundColor: Colors.warning.light, color: Colors.warning.dark, text: 'BROUILLON' };
        if (status === 'completed') return { backgroundColor: Colors.success.light, color: Colors.success.dark, text: 'COMPLÉTÉE' };
        return { backgroundColor: Colors.gray.light, color: Colors.gray.dark, text: status.toUpperCase() };
    }, [status]);

    return (
        <View style={[styles.statusBadge, { backgroundColor }]}>
            <Text style={[styles.statusBadgeText, { color }]}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // === HEADER MODERNE ===
  modernHeaderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },

  // === STATS MODERNE ===
  modernStatsContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modernStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modernStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernKpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modernStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // === ACTIONS RAPIDES MODERNE ===
  modernQuickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modernPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3D944B',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modernQuickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modernQuickActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernQuickActionText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // === FICHE SECTION MODERNE ===
  modernFichesSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  modernFichesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modernFichesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  modernAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3D944B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // === FILTERS ===
  filterContainer: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 20 
  },
  filterButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    backgroundColor: Colors.gray.light 
  },
  activeFilterButton: { 
    backgroundColor: Colors.primary 
  },
  filterButtonText: { 
    color: Colors.text.secondary, 
    fontWeight: '500' 
  },
  activeFilterButtonText: { 
    color: Colors.white 
  },

  // === FARM FILE CARDS MODERNE ===
  modernFarmFilesList: {
    gap: 12,
  },
  modernFarmFileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  completedCard: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  modernCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmFileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  modernFarmFileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // === INFO GRID MODERNE ===
  modernInfoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // === PROGRESS MODERNE ===
  modernProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modernProgress: {
    height: '100%',
    borderRadius: 4,
  },
  modernProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    minWidth: 32,
    textAlign: 'right',
  },

  // === EMPTY STATE MODERNE ===
  modernEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  modernEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modernEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D944B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modernEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // === FLOATING BUTTON MODERNE ===
  modernFloatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3D944B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});