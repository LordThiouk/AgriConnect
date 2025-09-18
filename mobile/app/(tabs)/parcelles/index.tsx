import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { CollecteService } from '../../../lib/services/collecte';
import type { PlotDisplay } from '../../../types/collecte';
import { Feather } from '@expo/vector-icons';
import MapComponent from '../../../components/MapComponent';

const PlotCard = ({ item }: { item: PlotDisplay }) => {
  const router = useRouter();
  const statusConfig = {
    preparation: { text: 'En cours', color: '#10b981', icon: 'check-circle' as const, iconColor: '#10b981' },
    cultivated: { text: 'Récolté', color: '#f59e0b', icon: 'clock' as const, iconColor: '#f59e0b' },
    fallow: { text: 'Abandonné', color: '#ef4444', icon: 'alert-triangle' as const, iconColor: '#ef4444' },
  };
  const currentStatus = statusConfig[item.status] || statusConfig.preparation;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.producerName}</Text>
          <Text style={styles.cardSubtitle}>ID: {item.name}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <View style={[styles.statusBadge, { backgroundColor: `${currentStatus.color}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
            <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.text}</Text>
          </View>
          <Feather name={currentStatus.icon} size={20} color={currentStatus.iconColor} style={{marginTop: 4}}/>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>Surface</Text>
          <Text style={styles.cardValue}>{item.area?.toFixed(2)} ha</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>Culture</Text>
          <Text style={styles.cardValue}>{item.variety || 'N/A'}</Text>
        </View>
      </View>

      <View>
        <Text style={styles.cardLabel}>Localisation</Text>
        <Text style={styles.cardValue}>{item.location || 'N/A'}</Text>
      </View>
      
      <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/parcelles/[plotId]/dashboard', params: { plotId: item.id } })} style={styles.detailsBtn}>
        <Text style={styles.detailsBtnText}>Voir détails</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ParcellesListScreen() {
  const { isLoading: authLoading, userRole, user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [plots, setPlots] = useState<PlotDisplay[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);

  // Version ultra-simple : chargement unique sans dépendances
  useEffect(() => {
    const loadPlots = async () => {
      if (authLoading || userRole !== 'agent' || !user?.id) return;
      
      setLoading(true);
      try {
        const data = await CollecteService.getAgentPlots(user.id, {});
        setPlots(data);
      } catch (err) {
        setError('Erreur lors du chargement des parcelles');
      } finally {
        setLoading(false);
      }
    };
    
    loadPlots();
  }, []); // Aucune dépendance pour éviter les boucles

  if (authLoading || userRole !== 'agent' || !user?.id) {
    return (
      <View style={styles.center}> 
        <Text style={styles.info}>Onglet réservé aux agents.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Parcelles</Text>
      </View>

      {/* Switch Liste/Carte */}
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          onPress={() => setShowMap(false)} 
          style={[styles.toggleBtn, !showMap && styles.toggleActive]}
        >
          <Feather name="list" size={16} color={!showMap ? '#065f46' : '#6b7280'} />
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>Liste</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowMap(true)} 
          style={[styles.toggleBtn, showMap && styles.toggleActive]}
        >
          <Feather name="map" size={16} color={showMap ? '#065f46' : '#6b7280'} />
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Carte</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3D944B" />
          <Text style={styles.loadingText}>Chargement des parcelles...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : showMap ? (
        <MapComponent
          plots={plots}
          onPlotSelect={(plot) => router.push({ pathname: '/(tabs)/parcelles/[plotId]/dashboard', params: { plotId: plot.id } })}
        />
      ) : (
        <FlatList
          data={plots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlotCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.info}>Aucune parcelle trouvée.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    marginHorizontal: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#065f46',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  info: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailsBtn: {
    backgroundColor: '#3D944B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  detailsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});