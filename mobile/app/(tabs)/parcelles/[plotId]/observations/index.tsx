import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useObservationsByPlot } from '../../../../../lib/hooks';
import { CRUDList } from '../../../../../components/CRUDList';

export default function ObservationsListScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  
  // Utiliser les hooks ObservationsService
  const { 
    data: observations, 
    loading: loadingObservations, 
    error: errorObservations
  } = useObservationsByPlot(plotId!);
  
  // TODO: Implémenter useDeleteObservation
  const deleteObservation = async (id: string) => {
    console.log('Suppression observation:', id);
  };

  const handleEdit = (observation: any) => {
    router.push(`/(tabs)/parcelles/${plotId}/observations/${observation.id}/edit`);
  };

  const handleDelete = async (observation: any) => {
    try {
      await deleteObservation(observation.id);
      // Le hook gère automatiquement le rechargement
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleView = (observation: any) => {
    // Navigation vers les détails de l'observation
    router.push(`/(tabs)/parcelles/${plotId}/observations/${observation.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      levée: 'success',
      maladie: 'error',
      ravageur: 'error',
      développement: 'info',
      stress_hydrique: 'warning',
      autre: 'gray',
    };
    return colors[status] || 'gray';
  };

  const getStatusText = (status: string) => {
    const labels: { [key: string]: string } = {
      levée: 'Levée',
      maladie: 'Maladie',
      ravageur: 'Ravageur',
      développement: 'Développement',
      stress_hydrique: 'Stress Hydrique',
      autre: 'Autre',
    };
    return labels[status] || status;
  };

  // Transformer les données pour CRUDList
  const transformedObservations = (observations || []).map((observation: any) => ({
    id: observation.id,
    title: observation.observation_type || 'Observation',
    subtitle: observation.description || `${observation.emergence_percent ? `Levée: ${observation.emergence_percent}%` : ''}`,
    date: observation.observation_date ? new Date(observation.observation_date).toLocaleDateString('fr-FR') : '',
    status: observation.observation_type || 'autre',
    type: observation.observation_type || 'autre',
  }));

  return (
    <CRUDList
      title="Observations"
      subtitle="Suivi des observations terrain"
      items={transformedObservations}
      loading={loadingObservations}
      error={errorObservations?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      addButtonRoute={`/(tabs)/parcelles/${plotId}/observations/add`}
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
      emptyState={{
        icon: "eye",
        title: "Aucune observation",
        subtitle: "Commencez par ajouter vos premières observations",
        action: {
          label: "Ajouter une observation",
          onPress: () => router.push(`/(tabs)/parcelles/${plotId}/observations/add`)
        }
      }}
      errorState={{
        icon: "alert-circle",
        title: "Erreur de chargement",
        subtitle: "Impossible de charger les observations",
        retryAction: {
          label: "Réessayer",
          onPress: () => window.location.reload()
        }
      }}
    />
  );
}