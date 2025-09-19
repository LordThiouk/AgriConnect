import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { CollecteService } from '../../../lib/services/collecte';
import { FarmFileDisplay } from '../../../types/collecte';
import { useAuth } from '../../../context/AuthContext';
import ContentWithHeader from '../../../components/ContentWithHeader';

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
  }, [user]);

  const filteredFarmFiles = useMemo(() => {
    if (activeFilter === 'all') return farmFiles;
    return farmFiles.filter(file => file.status === activeFilter);
  }, [farmFiles, activeFilter]);


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

  const renderStatusBadge = (status: string) => {
    let backgroundColor = Colors.gray.light;
    let textColor = Colors.gray.dark;
    let text = status.toUpperCase();

    if (status === 'draft') {
      backgroundColor = Colors.warning.light;
      textColor = Colors.warning.dark;
      text = 'BROUILLON';
    } else if (status === 'completed') {
      backgroundColor = Colors.success.light;
      textColor = Colors.success.dark;
      text = 'COMPLÉTÉE';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor, marginLeft: 'auto' }]}>
        <Text style={[styles.statusBadgeText, { color: textColor }]}>{text}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: FarmFileDisplay }) => (
    <TouchableOpacity
      style={styles.farmFileCard}
      onPress={() => router.push(`/(tabs)/collecte/fiches/create?farmFileId=${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.farmFileName} numberOfLines={1}>{item.producerName}</Text>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color={Colors.gray.medium} />
        <Text style={styles.infoText}>{item.location}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="leaf-outline" size={16} color={Colors.gray.medium} />
        <Text style={styles.infoText}>{item.plotsCount} parcelles</Text>
      </View>
      
      <View style={styles.completionContainer}>
        <Text style={styles.completionText}>{Math.round(item.completionPercent)}% complété</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${item.completionPercent}%`, backgroundColor: item.completionPercent === 100 ? Colors.success.dark : Colors.primary }]} />
        </View>
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
    <ContentWithHeader style={styles.container}>
      <FlatList
        data={filteredFarmFiles}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.primaryButtonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(tabs)/collecte/fiches/create')}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Nouvelle Fiche Exploitation</Text>
              </TouchableOpacity>
            </View>

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
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Fiches Existantes</Text>
            </View>
            <FilterComponent />
          </>
        }
        ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={50} color={Colors.gray.medium} />
              <Text style={styles.emptyStateText}>Aucune fiche trouvée</Text>
              <Text style={styles.emptyStateSubText}>
                {activeFilter !== 'all' ? `Aucune fiche avec le statut "${activeFilter}".` : "Créez une nouvelle fiche pour commencer."}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
        <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => router.push('/(tabs)/collecte/fiches/create')}
        >
            <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
    </ContentWithHeader>
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
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  primaryButtonContainer: {
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  quickActionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: { marginBottom: 16, paddingHorizontal:20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text.primary },
  filterContainer: { flexDirection: 'row', gap: 8, marginBottom: 20, paddingHorizontal:20 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.gray.light },
  activeFilterButton: { backgroundColor: Colors.primary },
  filterButtonText: { color: Colors.text.secondary, fontWeight: '500' },
  activeFilterButtonText: { color: Colors.white },
  farmFileCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  farmFileName: { fontSize: 16, fontWeight: 'bold', color: Colors.text.primary, flex: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoText: { fontSize: 14, color: Colors.text.secondary },
  completionContainer: { marginTop: 12 },
  completionText: { fontSize: 12, color: Colors.text.secondary, alignSelf: 'flex-end', marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: Colors.gray.light, borderRadius: 3, overflow: 'hidden' },
  progress: { height: '100%', borderRadius: 3 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyStateText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: Colors.text.primary },
  emptyStateSubText: { marginTop: 8, fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
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
    elevation: 8,
  },
});