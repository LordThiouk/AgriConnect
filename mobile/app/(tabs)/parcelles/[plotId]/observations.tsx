import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CollecteService } from '@/lib/services/collecte';
import { ObservationDisplay, ObservationSeverity } from '@/types/collecte';
import ObservationForm, { ObservationFormData } from '@/components/forms/ObservationForm';
import { Button } from '@/components/ui/button';
import { Plus, Trash, Edit } from 'lucide-react-native';
import { StarRating } from '@/components/StarRating';

const getSeverityColor = (severity: number) => {
  if (severity >= 4) return '#ef4444'; // red
  if (severity >= 3) return '#f97316'; // orange
  return '#22c55e'; // green
};

export default function ObservationsScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const { user } = useAuth();
  const [observations, setObservations] = useState<ObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<ObservationDisplay | null>(null);

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

  const handleAddOrUpdate = async (formData: ObservationFormData) => {
    if (!plotId || !user) return;

    const submissionData = {
      ...formData,
      plot_id: plotId,
      performer_id: user.id,
      performer_type: 'profile' as const,
      observation_date: formData.observation_date.toISOString(),
    };

    try {
      if (selectedObservation) {
        await CollecteService.updateObservation(selectedObservation.id, submissionData);
      } else {
        await CollecteService.addObservation(submissionData);
      }
      loadObservations();
      setModalVisible(false);
      setSelectedObservation(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', `L'enregistrement a échoué.`);
    }
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
              loadObservations();
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'La suppression a échoué.');
            }
          },
        },
      ]
    );
  };

  const openModal = (observation: ObservationDisplay | null = null) => {
    setSelectedObservation(observation);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: ObservationDisplay }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{item.date}</Text>
      </View>
      <Text style={styles.itemAuthor}>par {item.author}</Text>
      {item.severity && (
        <View style={{flexDirection: 'row', alignItems: 'center', marginVertical: 4}}>
          <Text style={styles.itemSeverity}>Sévérité : </Text>
          <StarRating rating={item.severity as ObservationSeverity} disabled />
        </View>
      )}
      <Text style={styles.itemDescription}>{item.description}</Text>
      <View style={styles.itemActions}>
        <Button variant="ghost" onPress={() => openModal(item)}><Edit size={20} color="#3D944B" /></Button>
        <Button variant="ghost" onPress={() => handleDelete(item.id)}><Trash size={20} color="#E53935" /></Button>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={observations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune observation enregistrée.</Text>}
        refreshing={loading}
        onRefresh={loadObservations}
        contentContainerStyle={styles.listContent}
      />
      <Button style={styles.fab} onPress={() => openModal()}>
        <Plus size={24} color="white" />
      </Button>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedObservation(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedObservation ? 'Modifier' : 'Ajouter'} une observation</Text>
            <ObservationForm
              onSubmit={handleAddOrUpdate}
              initialValues={selectedObservation ? {
                ...selectedObservation,
                observation_date: new Date(selectedObservation.date)
              } : { observation_date: new Date()}}
            />
            <Button variant="outline" onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
              <Text>Annuler</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  itemDate: { fontSize: 12, color: '#6b7280' },
  itemAuthor: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginVertical: 4 },
  itemSeverity: { fontSize: 12, fontWeight: 'bold' },
  itemDescription: { marginTop: 8, fontSize: 14, color: '#374151' },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 50 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3D944B', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
});
