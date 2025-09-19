import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { CollecteService } from '@/lib/services/collecte';
import { ParticipantDisplay } from '@/types/collecte';
import ContentWithHeader from '@/components/ContentWithHeader';
import { Feather } from '@expo/vector-icons';

export default function IntervenantsScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParticipants = useCallback(async () => {
    if (!plotId) return;
    try {
      setLoading(true);
      const data = await CollecteService.getParticipantsByPlotId(plotId);
      setParticipants(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les intervenants.');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useFocusEffect(
    useCallback(() => {
      loadParticipants();
    }, [loadParticipants])
  );

  const handleAdd = () => {
    router.push(`/(tabs)/parcelles/${plotId}/intervenants/add`);
  };

  const handleDelete = (participantId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet intervenant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await CollecteService.deleteParticipant(participantId);
              loadParticipants(); // Refresh list
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'La suppression a échoué.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (participant: ParticipantDisplay) => {
    // Pour l'instant, on navigue vers add avec l'ID en paramètre
    // TODO: Créer un écran d'édition dédié
    router.push(`/(tabs)/parcelles/${plotId}/intervenants/add?editId=${participant.id}`);
  };

  const renderItem = ({ item }: { item: ParticipantDisplay }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemText}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemRole}>{item.role}{item.age ? `, ${item.age} ans` : ''}</Text>
        {item.tags && item.tags.length > 0 && <Text style={styles.itemTags}>{item.tags.join(', ')}</Text>}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Feather name="edit" size={20} color="#3D944B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
          <Feather name="trash-2" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ContentWithHeader style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#3D944B" />
        </TouchableOpacity>
        <Text style={styles.title}>Intervenants</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Feather name="plus" size={24} color="#3D944B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D944B" />
        </View>
      ) : (
        <FlatList
          data={participants}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun intervenant enregistré.</Text>}
          refreshing={loading}
          onRefresh={loadParticipants}
          style={styles.list}
        />
      )}

    </ContentWithHeader>
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemRole: {
    color: '#6b7280',
    fontSize: 14,
  },
  itemTags: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 2,
  },
  itemActions: {
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
