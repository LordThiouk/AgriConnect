import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { CollecteService } from '@/lib/services/collecte';
import { ObservationDisplay } from '@/types/collecte';
import { ScreenContainer } from '@/components/ui';
import { Feather } from '@expo/vector-icons';

export default function ObservationsScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const [observations, setObservations] = useState<ObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadObservations = useCallback(async () => {
    if (!plotId) return;
    try {
      setLoading(true);
      const data = await CollecteService.getObservationsByPlotId(plotId);
      setObservations(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les observations.');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useFocusEffect(
    useCallback(() => {
      loadObservations();
    }, [loadObservations])
  );

  const handleAdd = () => {
    router.push(`/(tabs)/parcelles/${plotId}/observations/add`);
  };

  const handleDelete = (observationId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette observation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await CollecteService.deleteObservation(observationId);
              loadObservations(); // Refresh list
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'La suppression a échoué.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (observation: ObservationDisplay) => {
    router.push(`/(tabs)/parcelles/${plotId}/observations/${observation.id}/edit`);
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return '#10b981'; // Vert - Faible
      case 2: return '#f59e0b'; // Jaune - Modéré
      case 3: return '#f97316'; // Orange - Élevé
      case 4: return '#ef4444'; // Rouge - Très élevé
      case 5: return '#dc2626'; // Rouge foncé - Critique
      default: return '#6b7280'; // Gris par défaut
    }
  };

  const getSeverityText = (severity: number) => {
    switch (severity) {
      case 1: return 'Faible';
      case 2: return 'Modéré';
      case 3: return 'Élevé';
      case 4: return 'Très élevé';
      case 5: return 'Critique';
      default: return 'Inconnu';
    }
  };

  const renderItem = ({ item }: { item: ObservationDisplay }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{item.observation_type}</Text>
        <Text style={styles.itemDate}>
          {new Date(item.observation_date).toLocaleDateString('fr-FR')}
        </Text>
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.pest_disease_name && (
          <Text style={styles.itemPest}>
            Maladie/Ravageur: {item.pest_disease_name}
          </Text>
        )}
        {item.emergence_percent !== null && (
          <Text style={styles.itemEmergence}>
            Levée: {item.emergence_percent}%
          </Text>
        )}
      </View>
      <View style={styles.itemActions}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>
            {getSeverityText(item.severity)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
            <Feather name="edit" size={20} color="#3D944B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
            <Feather name="trash-2" size={20} color="#E53935" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer 
      title="Observations"
      showSubHeader={true}
      showBackButton={true}
      subHeaderActions={
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Feather name="plus" size={24} color="#3D944B" />
        </TouchableOpacity>
      }
      animationEnabled={true}
    >

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D944B" />
        </View>
      ) : (
        <FlatList
          data={observations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune observation enregistrée.</Text>}
          refreshing={loading}
          onRefresh={loadObservations}
          style={styles.list}
        />
      )}

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemText: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDate: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  itemDescription: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
  itemPest: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemEmergence: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 40,
  },
});
