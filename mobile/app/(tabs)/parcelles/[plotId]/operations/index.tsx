import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOperationsByPlot, useDeleteOperation } from '../../../../../lib/hooks';
import { CRUDList } from '../../../../../components/CRUDList';
import { ScreenContainer } from '../../../../../components/ui';
import { Feather } from '@expo/vector-icons';

export default function OperationsListScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  
  // Utiliser les hooks OperationsService
  const { 
    data: operations, 
    loading: loadingOperations, 
    error: errorOperations
  } = useOperationsByPlot(plotId!);
  
  const { deleteOperation } = useDeleteOperation();


  const handleEdit = (operation: any) => {
    router.push(`/parcelles/${plotId}/operations/${operation.id}/edit`);
  };

  const handleDelete = async (operation: any) => {
    try {
      await deleteOperation(operation.id);
      // Le hook gère automatiquement le rechargement
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleView = (operation: any) => {
    // Navigation vers les détails de l'opération
    router.push(`/parcelles/${plotId}/operations/${operation.id}`);
  };

  const handleAdd = () => {
    router.push(`/(tabs)/parcelles/${plotId}/operations/add`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      semis: '#28a745',
      fertilisation: '#17a2b8',
      irrigation: '#007bff',
      desherbage: '#ffc107',
      traitement_phytosanitaire: '#dc3545',
      recolte: '#6f42c1',
      labour: '#6c757d',
      autre: '#6c757d',
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status: string) => {
    const labels: { [key: string]: string } = {
      semis: 'Semis',
      fertilisation: 'Fertilisation',
      irrigation: 'Irrigation',
      desherbage: 'Désherbage',
      traitement_phytosanitaire: 'Traitement',
      recolte: 'Récolte',
      labour: 'Labour',
      autre: 'Autre',
    };
    return labels[status] || status;
  };

  // Transformer les données pour CRUDList
  const transformedOperations = operations?.map((op: any) => ({
    id: op.id,
    title: op.operation_type || 'Opération',
    subtitle: op.description || `${op.product ? `Produit: ${op.product}` : ''}`,
    date: op.operation_date,
    status: op.operation_type,
    type: op.operation_type,
  })) || [];

  // Gestion des états de chargement et d'erreur
  if (loadingOperations) {
    return (
      <ScreenContainer 
        title="Opérations"
        showSubHeader={true}
        showBackButton={true}
        animationEnabled={true}
      >
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des opérations...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (errorOperations) {
    return (
      <ScreenContainer 
        title="Opérations"
        showSubHeader={true}
        showBackButton={true}
        animationEnabled={true}
      >
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur lors du chargement: {errorOperations.message}</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title="Opérations"
      showSubHeader={true}
      showBackButton={true}
      subHeaderActions={
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Feather name="plus" size={24} color="#3D944B" />
        </TouchableOpacity>
      }
      animationEnabled={true}
    >
      <View style={styles.container}>
        <CRUDList
          title=""
          items={transformedOperations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          addButtonText=""
          addButtonRoute=""
          emptyMessage="Aucune opération enregistrée"
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
});

