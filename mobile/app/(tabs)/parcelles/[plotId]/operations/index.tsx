import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOperationsByPlot, useDeleteOperation } from '../../../../../lib/hooks';
import { CRUDList } from '../../../../../components/CRUDList';

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
    router.push(`/(tabs)/parcelles/${plotId}/operations/${operation.id}/edit`);
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
    router.push(`/(tabs)/parcelles/${plotId}/operations/${operation.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      semis: 'success',
      fertilisation: 'info',
      irrigation: 'primary',
      desherbage: 'warning',
      traitement_phytosanitaire: 'error',
      recolte: 'purple',
      labour: 'gray',
      autre: 'gray',
    };
    return colors[status] || 'gray';
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
    date: op.operation_date ? new Date(op.operation_date).toLocaleDateString('fr-FR') : '',
    status: op.operation_type,
    type: op.operation_type,
  })) || [];

  return (
    <CRUDList
      title="Opérations"
      subtitle="Gestion des opérations agricoles"
      items={transformedOperations}
      loading={loadingOperations}
      error={errorOperations?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      addButtonText="Nouvelle opération"
      addButtonRoute={`/(tabs)/parcelles/${plotId}/operations/add`}
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
      emptyState={{
        icon: "activity",
        title: "Aucune opération",
        subtitle: "Commencez par ajouter vos premières opérations agricoles",
        action: {
          label: "Ajouter une opération",
          onPress: () => router.push(`/(tabs)/parcelles/${plotId}/operations/add`)
        }
      }}
      errorState={{
        icon: "alert-circle",
        title: "Erreur de chargement",
        subtitle: "Impossible de charger les opérations",
        retryAction: {
          label: "Réessayer",
          onPress: () => window.location.reload()
        }
      }}
    />
  );
}


