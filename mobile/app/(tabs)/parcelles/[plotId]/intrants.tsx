import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, Modal, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { CollecteService } from '@/lib/services/collecte';
import { InputDisplay } from '@/types/collecte';
import InputForm, { InputFormData } from '@/components/forms/InputForm';
import { Button } from '@/components/ui/button';
import { Plus, Trash, Edit } from 'lucide-react-native';

export default function IntrantsScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const [inputs, setInputs] = useState<InputDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInput, setSelectedInput] = useState<InputDisplay | null>(null);

  const loadInputs = useCallback(async () => {
    if (!plotId) return;
    try {
      setLoading(true);
      const data = await CollecteService.getInputsByPlotId(plotId);
      setInputs(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les intrants.');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useFocusEffect(
    useCallback(() => {
      loadInputs();
    }, [loadInputs])
  );

  const handleAddOrUpdate = async (formData: InputFormData) => {
    if (!plotId) return;
    
    const submissionData = { ...formData, plot_id: plotId };

    try {
      if (selectedInput) {
        await CollecteService.updateInput(selectedInput.id, submissionData);
      } else {
        await CollecteService.addInput(submissionData);
      }
      loadInputs();
      setModalVisible(false);
      setSelectedInput(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', `L'enregistrement a échoué.`);
    }
  };

  const handleDelete = (inputId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet intrant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await CollecteService.deleteInput(inputId);
              loadInputs();
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'La suppression a échoué.');
            }
          },
        },
      ]
    );
  };
  
  const openModal = (input: InputDisplay | null = null) => {
    setSelectedInput(input);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: InputDisplay }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemText}>
        <Text style={styles.itemLabel}>{item.label} <Text style={styles.itemCategory}>({item.category})</Text></Text>
        <Text style={styles.itemQuantity}>{item.quantity} {item.unit}</Text>
        <Text style={styles.itemDate}>Ajouté le: {item.date}</Text>
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
        data={inputs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun intrant enregistré.</Text>}
        refreshing={loading}
        onRefresh={loadInputs}
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
          setSelectedInput(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedInput ? 'Modifier' : 'Ajouter'} un intrant</Text>
            <InputForm
              onSubmit={handleAddOrUpdate}
              initialValues={selectedInput || {}}
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
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 16, fontWeight: 'bold' },
  itemCategory: { color: '#555', fontWeight: 'normal' },
  itemQuantity: { color: '#333', marginTop: 4 },
  itemDate: { color: '#777', fontSize: 12, marginTop: 4 },
  itemActions: { flexDirection: 'row' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
});
