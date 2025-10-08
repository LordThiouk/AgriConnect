import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../lib/services/collecte';
import { CRUDList } from '../../../../../components/CRUDList';
import { useFocusEffect } from '@react-navigation/native';

export default function IntrantsListScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const [intrants, setIntrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadIntrants = async () => {
    try {
      setLoading(true);
      console.log('🌾 Chargement des intrants pour la parcelle:', plotId);
      
      // Récupérer les intrants depuis la base de données
      const { data, error } = await CollecteService.supabase
        .from('agricultural_inputs')
        .select('*')
        .eq('plot_id', plotId)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des intrants:', error);
        return;
      }
      
      console.log('🌾 Intrants récupérés:', data);
      
      // Transformer les données pour CRUDList
      const transformedIntrants = data.map(input => ({
        id: input.id,
        title: input.product_name || 'Intrant',
        subtitle: input.description || `${input.quantity ? `${input.quantity} ${input.unit || ''}` : ''}`,
        date: input.purchase_date ? new Date(input.purchase_date).toLocaleDateString('fr-FR') : '',
        status: input.input_type,
        type: input.input_type,
      }));

      setIntrants(transformedIntrants);
    } catch (error) {
      console.error('Erreur lors du chargement des intrants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIntrants();
    setRefreshing(false);
  };

  const handleEdit = (intrant: any) => {
    router.push(`/parcelles/${plotId}/intrants/${intrant.id}/edit`);
  };

  const handleDelete = async (intrant: any) => {
    try {
      await CollecteService.deleteInput(intrant.id);
      await loadIntrants(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleView = (intrant: any) => {
    // Navigation vers les détails de l'intrant
    router.push(`/parcelles/${plotId}/intrants/${intrant.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      engrais: '#28a745',
      semences: '#17a2b8',
      phytosanitaire: '#dc3545',
      outils: '#ffc107',
      equipements: '#007bff',
      autre: '#6c757d',
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status: string) => {
    const labels: { [key: string]: string } = {
      engrais: 'Engrais',
      semences: 'Semences',
      phytosanitaire: 'Phytosanitaire',
      outils: 'Outils',
      equipements: 'Équipements',
      autre: 'Autre',
    };
    return labels[status] || status;
  };

  // Charger les données quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      loadIntrants();
    }, [plotId])
  );

  return (
    <View style={styles.container}>
      <CRUDList
        title="Intrants"
        items={intrants}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        addButtonText="Nouvel intrant"
        addButtonRoute={`/parcelles/${plotId}/intrants/add`}
        emptyMessage="Aucun intrant enregistré"
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

