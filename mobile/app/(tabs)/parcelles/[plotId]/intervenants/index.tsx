import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useParticipantsByPlot } from '../../../../../lib/hooks';
import { CRUDList } from '../../../../../components/CRUDList';

export default function IntervenantsListScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  
  // Utiliser les hooks ParticipantsService
  const { 
    data: participants, 
    loading: loadingParticipants, 
    error: errorParticipants
  } = useParticipantsByPlot(plotId!);
  
  // TODO: Implémenter useDeleteParticipant
  const deleteParticipant = async (id: string) => {
    console.log('Suppression participant:', id);
  };

  const handleEdit = (participant: any) => {
    router.push(`/(tabs)/parcelles/${plotId}/intervenants/${participant.id}/edit`);
  };

  const handleDelete = async (participant: any) => {
    try {
      await deleteParticipant(participant.id);
      // Le hook gère automatiquement le rechargement
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleView = (participant: any) => {
    // Navigation vers les détails de l'intervenant
    router.push(`/(tabs)/parcelles/${plotId}/intervenants/${participant.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'success',
      inactive: 'gray',
      pending: 'warning',
    };
    return colors[status] || 'gray';
  };

  const getStatusText = (status: string) => {
    const labels: { [key: string]: string } = {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente',
    };
    return labels[status] || status;
  };

  // Transformer les données pour CRUDList
  const transformedParticipants = (participants || []).map((participant: any) => ({
    id: participant.id,
    title: participant.name || participant.full_name || 'Intervenant',
    subtitle: participant.role || participant.function || 'Rôle non défini',
    date: participant.created_at ? new Date(participant.created_at).toLocaleDateString('fr-FR') : '',
    status: participant.status || 'active',
    type: participant.role || participant.function || 'autre',
  }));

  return (
    <CRUDList
      title="Intervenants"
      subtitle="Gestion des intervenants sur la parcelle"
      items={transformedParticipants}
      loading={loadingParticipants}
      error={errorParticipants?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      addButtonRoute={`/(tabs)/parcelles/${plotId}/intervenants/add`}
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
      emptyState={{
        icon: "users",
        title: "Aucun intervenant",
        subtitle: "Commencez par ajouter vos premiers intervenants",
        action: {
          label: "Ajouter un intervenant",
          onPress: () => router.push(`/(tabs)/parcelles/${plotId}/intervenants/add`)
        }
      }}
      errorState={{
        icon: "alert-circle",
        title: "Erreur de chargement",
        subtitle: "Impossible de charger les intervenants",
        retryAction: {
          label: "Réessayer",
          onPress: () => window.location.reload()
        }
      }}
    />
  );
}