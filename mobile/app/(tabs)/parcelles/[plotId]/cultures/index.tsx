import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCrops } from '../../../../../lib/hooks';
import { CRUDList } from '../../../../../components/CRUDList';

export default function CulturesListScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  
  // Utiliser les hooks CropsService
  const { 
    crops, 
    loading: loadingCrops, 
    error: errorCrops
  } = useCrops(plotId!);
  
  // TODO: Implémenter useDeleteCrop
  const deleteCrop = async (id: string) => {
    console.log('Suppression culture:', id);
  };

  const handleEdit = (crop: any) => {
    router.push(`/(tabs)/parcelles/${plotId}/cultures/${crop.id}/edit`);
  };

  const handleDelete = async (crop: any) => {
    try {
      await deleteCrop(crop.id);
      // Le hook gère automatiquement le rechargement
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleView = (crop: any) => {
    // Navigation vers les détails de la culture
    router.push(`/(tabs)/parcelles/${plotId}/cultures/${crop.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'success',
      completed: 'info',
      abandoned: 'error',
      planned: 'warning',
    };
    return colors[status] || 'gray';
  };

  const getStatusText = (status: string) => {
    const labels: { [key: string]: string } = {
      active: 'Active',
      completed: 'Terminée',
      abandoned: 'Abandonnée',
      planned: 'Planifiée',
    };
    return labels[status] || status;
  };

  // Transformer les données pour CRUDList
  const transformedCrops = (crops || []).map((crop: any) => ({
    id: crop.id,
    title: `${crop.crop_type} - ${crop.variety}`,
    subtitle: crop.description || `Semis: ${crop.sowing_date ? new Date(crop.sowing_date).toLocaleDateString('fr-FR') : 'Non défini'}`,
    date: crop.sowing_date ? new Date(crop.sowing_date).toLocaleDateString('fr-FR') : '',
    status: crop.status || 'active',
    type: crop.crop_type || 'autre',
  }));

  return (
    <CRUDList
      title="Cultures"
      subtitle="Gestion des cultures de la parcelle"
      items={transformedCrops}
      loading={loadingCrops}
      error={errorCrops?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      addButtonRoute={`/(tabs)/parcelles/${plotId}/cultures/add`}
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
      emptyState={{
        icon: "seedling",
        title: "Aucune culture",
        subtitle: "Commencez par ajouter vos premières cultures",
        action: {
          label: "Ajouter une culture",
          onPress: () => router.push(`/(tabs)/parcelles/${plotId}/cultures/add`)
        }
      }}
      errorState={{
        icon: "alert-circle",
        title: "Erreur de chargement",
        subtitle: "Impossible de charger les cultures",
        retryAction: {
          label: "Réessayer",
          onPress: () => window.location.reload()
        }
      }}
    />
  );
}