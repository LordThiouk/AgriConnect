import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, Modal, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CollecteService } from '@/lib/services/collecte';
import { ParticipantDisplay } from '@/types/collecte';
import ParticipantForm, { ParticipantFormData } from '@/components/forms/ParticipantForm';
import { Button } from '@/components/ui/button';
import { Plus, Trash, Edit } from 'lucide-react-native';
import { Database } from '@/types/database';

export default function IntervenantsScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<ParticipantDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantDisplay | null>(null);

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

  const handleAddOrUpdate = async (formData: ParticipantFormData) => {
    if (!plotId || !user) return;
    
    const submissionData = {
      ...formData,
      plot_id: plotId,
      created_by: user.id,
      languages: formData.languages ? formData.languages.split(',').map(s => s.trim()) : [],
      birthdate: formData.birthdate ? formData.birthdate.toISOString() : undefined,
    };

    try {
      if (selectedParticipant) {
        // Update
        const updatedParticipant = await CollecteService.updateParticipant(selectedParticipant.id, submissionData);
      } else {
        // Create
        const newParticipant = await CollecteService.addParticipant(submissionData);
      }
      loadParticipants(); // Refresh list
      setModalVisible(false);
      setSelectedParticipant(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', `L'enregistrement a échoué.`);
    }
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
  
  const openModal = (participant: ParticipantDisplay | null = null) => {
    setSelectedParticipant(participant);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: ParticipantDisplay }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemText}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemRole}>{item.role}{item.age ? `, ${item.age} ans` : ''}</Text>
        {item.tags && item.tags.length > 0 && <Text style={styles.itemTags}>{item.tags.join(', ')}</Text>}
      </View>
      <View style={styles.itemActions}>
        <Button variant="ghost" onPress={() => openModal(item)}><Edit size={20} color="#3D944B" /></Button>
        <Button variant="ghost" onPress={() => handleDelete(item.id)}><Trash size={20} color="#E53935" /></Button>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={participants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun intervenant enregistré.</Text>}
        refreshing={loading}
        onRefresh={loadParticipants}
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
          setSelectedParticipant(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedParticipant ? 'Modifier' : 'Ajouter'} un intervenant</Text>
            <ParticipantForm
              onSubmit={handleAddOrUpdate}
              initialValues={selectedParticipant || {}}
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
  container: { flex: 1, padding: 10 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemRole: { color: '#555' },
  itemTags: { color: '#777', fontStyle: 'italic', fontSize: 12 },
  itemActions: { flexDirection: 'row' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
});
