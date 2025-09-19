import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { CollecteService } from '../../../lib/services/collecte';
import { GlobalObservationDisplay, GeneralNotificationDisplay } from '../../../types/collecte';
import ContentWithHeader from '../../../components/ContentWithHeader';
import { Feather } from '@expo/vector-icons';

// Types pour les filtres
type FilterType = 'all' | 'fertilization' | 'disease' | 'irrigation' | 'harvest';


export default function ObservationsScreen() {
  const { user } = useAuth();
  const [observations, setObservations] = useState<GlobalObservationDisplay[]>([]);
  const [filteredObservations, setFilteredObservations] = useState<GlobalObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [criticalAlert, setCriticalAlert] = useState<GlobalObservationDisplay | null>(null);

  // Charger les observations
  const loadObservations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await CollecteService.getObservationsForAgent(user.id);
      setObservations(data);
      
      // Trouver l'alerte critique (severity >= 4)
      const critical = data.find(obs => obs.isCritical);
      setCriticalAlert(critical || null);
      
    } catch (error) {
      console.error('Erreur lors du chargement des observations:', error);
      Alert.alert('Erreur', 'Impossible de charger les observations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Appliquer les filtres
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredObservations(observations);
    } else {
      const filtered = observations.filter(obs => obs.type === activeFilter);
      setFilteredObservations(filtered);
    }
  }, [observations, activeFilter]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadObservations();
    setRefreshing(false);
  }, [loadObservations]);

  const handleMarkAsRead = async (observationId: string) => {
    try {
      // TODO: Implémenter la logique de marquage comme lu
      console.log('Marquer comme lu:', observationId);
      Alert.alert('Succès', 'Observation marquée comme lue');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme lu');
    }
  };

  const handleMarkAsExecuted = async (observationId: string) => {
    try {
      // TODO: Implémenter la logique de marquage comme exécuté
      console.log('Marquer comme exécuté:', observationId);
      Alert.alert('Succès', 'Observation marquée comme exécutée');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme exécuté');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'read': return '#6b7280';
      case 'executed': return '#10b981';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'read': return 'Lu';
      case 'executed': return 'Exécuté';
      case 'critical': return 'Critique';
      default: return 'N/A';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffHours < 48) return 'Hier';
    return `Il y a ${Math.floor(diffHours / 24)} jours`;
  };

  const FilterButton = ({ type, label, icon, isActive, onPress }: {
    type: FilterType;
    label: string;
    icon: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Feather 
        name={icon as any} 
        size={16} 
        color={isActive ? '#fff' : '#3D944B'} 
        style={styles.filterIcon}
      />
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ObservationCard = ({ item }: { item: GlobalObservationDisplay }) => (
    <View style={styles.observationCard}>
      <View style={[styles.colorBar, { backgroundColor: item.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Feather name={item.icon as any} size={20} color={item.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>
              {item.plotName} - {item.cropType}
            </Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
            {item.pestDiseaseName && (
              <Text style={styles.pestDisease}>
                Maladie/Ravageur: {item.pestDiseaseName}
              </Text>
            )}
            {item.emergencePercent !== undefined && (
              <Text style={styles.emergenceInfo}>
                Levée: {item.emergencePercent}%
              </Text>
            )}
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          {item.status === 'new' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMarkAsRead(item.id)}
            >
              <Text style={styles.actionButtonText}>Marquer lu</Text>
            </TouchableOpacity>
          )}
          {item.status === 'read' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.executedButton]}
              onPress={() => handleMarkAsExecuted(item.id)}
            >
              <Text style={[styles.actionButtonText, styles.executedButtonText]}>Exécuté</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Détails</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );


  if (loading) {
    return (
      <ContentWithHeader style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D944B" />
          <Text style={styles.loadingText}>Chargement des observations...</Text>
        </View>
      </ContentWithHeader>
    );
  }

  return (
    <ContentWithHeader style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Bannière d'alerte critique */}
        {criticalAlert && (
          <View style={styles.criticalAlert}>
            <Feather name="alert-triangle" size={20} color="#fff" />
            <Text style={styles.criticalAlertText}>
              Alerte critique - {criticalAlert.title} sur {criticalAlert.plotName}
            </Text>
            <Feather name="chevron-right" size={20} color="#fff" />
          </View>
        )}

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <FilterButton
            type="all"
            label="Tous"
            icon="list"
            isActive={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <FilterButton
            type="fertilization"
            label="Fertilisation"
            icon="leaf"
            isActive={activeFilter === 'fertilization'}
            onPress={() => setActiveFilter('fertilization')}
          />
          <FilterButton
            type="disease"
            label="Maladies"
            icon="bug"
            isActive={activeFilter === 'disease'}
            onPress={() => setActiveFilter('disease')}
          />
          <FilterButton
            type="irrigation"
            label="Irrigation"
            icon="droplet"
            isActive={activeFilter === 'irrigation'}
            onPress={() => setActiveFilter('irrigation')}
          />
          <FilterButton
            type="harvest"
            label="Récolte"
            icon="scissors"
            isActive={activeFilter === 'harvest'}
            onPress={() => setActiveFilter('harvest')}
          />
        </View>

        {/* Liste des observations */}
        <FlatList
          data={filteredObservations}
          renderItem={ObservationCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="eye" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Aucune observation trouvée</Text>
            </View>
          }
        />

      </ScrollView>
    </ContentWithHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
  },
  criticalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  criticalAlertText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3D944B',
    borderColor: '#3D944B',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3D944B',
  },
  filterTextActive: {
    color: '#fff',
  },
  observationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorBar: {
    width: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  pestDisease: {
    fontSize: 13,
    color: '#ef4444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emergenceInfo: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3D944B',
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  executedButton: {
    backgroundColor: '#10b981',
  },
  executedButtonText: {
    color: '#fff',
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailsButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
});
