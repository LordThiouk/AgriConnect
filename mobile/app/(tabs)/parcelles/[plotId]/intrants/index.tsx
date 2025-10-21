import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInputsByPlot, useDeleteInput } from '../../../../../lib/hooks';
import { CRUDList } from '../../../../../components/CRUDList';

export default function IntrantsListScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  
  // Utiliser les hooks InputsService
  const { 
    data: intrants, 
    loading: loadingIntrants, 
    error: errorIntrants,
    refetch: refetchIntrants
  } = useInputsByPlot(plotId!);
  
  const { deleteInput } = useDeleteInput();

  const handleEdit = (intrant: any) => {
    router.push(`/(tabs)/parcelles/${plotId}/intrants/${intrant.id}/edit`);
  };

  const handleDelete = async (intrant: any) => {
    try {
      await deleteInput(intrant.id);
      // Rafraîchir la liste après suppression
      await refetchIntrants();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleView = (intrant: any) => {
    // Navigation vers les détails de l'intrant
    router.push(`/(tabs)/parcelles/${plotId}/intrants/${intrant.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      fertilizer: 'success',
      seed: 'info',
      pesticide: 'error',
      herbicide: 'error',
      fungicide: 'error',
      equipment: 'warning',
      other: 'gray',
    };
    return colors[status] || 'gray';
  };

  const getStatusText = (status: string) => {
    const labels: { [key: string]: string } = {
      fertilizer: 'Engrais',
      seed: 'Semences',
      pesticide: 'Pesticide',
      herbicide: 'Herbicide',
      fungicide: 'Fongicide',
      equipment: 'Équipement',
      other: 'Autre',
    };
    return labels[status] || status;
  };

  // Transformer les données pour CRUDList
  const transformedIntrants = (intrants || []).map((intrant: any) => ({
    id: intrant.id,
    title: intrant.product_name || intrant.name || 'Intrant',
    subtitle: intrant.description || `${intrant.quantity ? `${intrant.quantity} ${intrant.unit || ''}` : ''}`,
    date: intrant.purchase_date ? new Date(intrant.purchase_date).toLocaleDateString('fr-FR') : '',
    status: intrant.type || intrant.input_type || 'other',
    type: intrant.type || intrant.input_type || 'other',
  }));

  return (
    <CRUDList
      title="Intrants"
      subtitle="Gestion des intrants agricoles"
      items={transformedIntrants}
      loading={loadingIntrants}
      error={errorIntrants?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      onRefresh={refetchIntrants}
      addButtonRoute={`/(tabs)/parcelles/${plotId}/intrants/add`}
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
      emptyState={{
        icon: "package",
        title: "Aucun intrant",
        subtitle: "Commencez par ajouter vos premiers intrants agricoles",
        action: {
          label: "Ajouter un intrant",
          onPress: () => router.push(`/(tabs)/parcelles/${plotId}/intrants/add`)
        }
      }}
      errorState={{
        icon: "alert-circle",
        title: "Erreur de chargement",
        subtitle: "Impossible de charger les intrants",
        retryAction: {
          label: "Réessayer",
          onPress: refetchIntrants
        }
      }}
    />
  );
}