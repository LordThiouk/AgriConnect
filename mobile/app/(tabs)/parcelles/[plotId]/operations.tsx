import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CollecteService } from '../../../../lib/services/collecte';
import { OperationDisplay, OperationInsert } from '../../../../types/collecte';
import OperationForm, { OperationFormData } from '@/components/forms/OperationForm';
import { Button } from '../../../../components/ui/button';
import { Plus } from 'lucide-react-native';

export default function OperationsScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const { user } = useAuth();
  const [operations, setOperations] = useState<OperationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<OperationDisplay | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOperations = useCallback(async () => {
    if (!plotId) return;
    try {
      setLoading(true);
      const data = await CollecteService.getOperationsByPlotId(plotId);
      setOperations(data);
    } catch (error) {
      console.error('Erreur de chargement des opérations:', error);
      Alert.alert('Erreur', 'Impossible de charger les opérations.');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useFocusEffect(
    useCallback(() => {
      fetchOperations();
    }, [fetchOperations])
  );

  const handleOpenModal = (operation: OperationDisplay | null = null) => {
    setSelectedOperation(operation);
    setModalVisible(true);
  };

  const handleFormSubmit = async (formData: OperationFormData) => {
    if (!plotId || !user) return;
    setIsSubmitting(true);
    
    const operationData: Omit<OperationInsert, 'id' | 'created_at' | 'updated_at'> = {
      plot_id: plotId,
      performer_id: user.id,
      performer_type: 'profile',
      operation_date: formData.operation_date.toISOString(),
      operation_type: formData.operation_type,
      product_used: formData.product_used,
      description: formData.description,
    };

    try {
      if (selectedOperation) {
        // Update
        await CollecteService.updateOperation(selectedOperation.id, operationData);
        Alert.alert('Succès', 'Opération mise à jour avec succès.');
      } else {
        // Create
        await CollecteService.addOperation(operationData);
        Alert.alert('Succès', 'Opération ajoutée avec succès.');
      }
      setModalVisible(false);
      fetchOperations(); // Refresh list
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      Alert.alert('Erreur', `L'enregistrement a échoué.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (operationId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette opération ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await CollecteService.deleteOperation(operationId);
              Alert.alert('Succès', 'Opération supprimée.');
              fetchOperations(); // Refresh list
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'La suppression a échoué.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: OperationDisplay }) => (
    <View className="p-4 mb-2 bg-white rounded-lg shadow">
      <Text className="font-bold text-lg">{item.type}</Text>
      <Text>Date: {item.date}</Text>
      {item.product && <Text>Produit: {item.product}</Text>}
      {item.description && <Text>Description: {item.description}</Text>}
      {item.author && <Text>Par: {item.author}</Text>}
      <View className="flex-row justify-end mt-2">
        <Button variant="outline" onPress={() => handleOpenModal(item)} className="mr-2">
          Modifier
        </Button>
        <Button variant="destructive" onPress={() => handleDelete(item.id)}>
          Supprimer
        </Button>
      </View>
    </View>
  );

  return (
    <View className="flex-1 p-4 bg-gray-50">
      {loading ? (
        <Text>Chargement des opérations...</Text>
      ) : operations.length === 0 ? (
        <Text>Aucune opération enregistrée pour cette parcelle.</Text>
      ) : (
        <FlatList
          data={operations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-11/12 bg-white rounded-lg p-4">
            <Text className="text-xl font-bold mb-4">
              {selectedOperation ? 'Modifier' : 'Ajouter'} une opération
            </Text>
            <OperationForm
              onSubmit={handleFormSubmit}
              initialValues={selectedOperation || {}}
              isSubmitting={isSubmitting}
            />
            <Button variant="ghost" onPress={() => setModalVisible(false)} className="mt-2">
              Annuler
            </Button>
          </View>
        </View>
      </Modal>

      <View className="absolute bottom-4 right-4">
        <Button onPress={() => handleOpenModal()} className="rounded-full w-14 h-14 justify-center items-center">
          <Plus size={24} color="white" />
        </Button>
      </View>
    </View>
  );
}
