import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useRouter } from 'expo-router';
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
try {
  if (Platform.OS !== 'web') {
    // Lazy require to avoid web bundling of native module
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default || RNMaps;
    Marker = RNMaps.Marker;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
  }
} catch {}
import { useAuth } from '../../../context/AuthContext';
import { CollecteService } from '../../../lib/services/collecte';
import type { PlotDisplay } from '../../../types/collecte';
import CompatiblePicker from '../../../components/CompatiblePicker';
import { Feather } from '@expo/vector-icons'; // Importer les icônes

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
  const [query, setQuery] = useState<string>('');
  const [showMap, setShowMap] = useState<boolean>(false);
  const [filterVillage, setFilterVillage] = useState<string>('');
  const [availableVillages, setAvailableVillages] = useState<{ label: string; value: string }[]>([]);
  const [filterCrop, setFilterCrop] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 20;
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const canView = !authLoading && userRole === 'agent' && !!user?.id;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!canView) return;
      setLoading(true);
      setError(null);
      try {
        const filters = {
          query: query || undefined,
          village: filterVillage || undefined,
          crop: filterCrop || undefined,
          status: filterStatus || undefined,
        };
        const data = await CollecteService.getAgentPlots(user!.id, filters);
        
        if (mounted) {
          setPlots(data);
          // Mettre à jour les villages disponibles uniquement si aucun filtre de village n'est actif
          if (!filterVillage) {
            const villages = [...new Set(data.map(p => p.location).filter(Boolean))] as string[];
            setAvailableVillages([
              { label: 'Tous villages', value: '' },
              ...villages.map(v => ({ label: v, value: v }))
            ]);
          }
        }
      } catch {
        if (mounted) setError('Erreur lors du chargement des parcelles');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [canView, user?.id, query, filterVillage, filterCrop, filterStatus]);

  const paginated = useMemo(() => plots.slice(0, page * PAGE_SIZE), [plots, page]);

  if (!canView) {
    return (
      <View style={styles.center}> 
        <Text style={styles.info}>Onglet réservé aux agents.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Mes Parcelles</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterIconBtn}>
            <Feather name="filter" size={20} color={showFilters ? '#3D944B' : '#374151'} />
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Rechercher producteur ou ID parcelle..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={(t) => {
            setPage(1);
            setQuery(t);
          }}
          style={styles.search}
        />

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersRow}>
              <CompatiblePicker
                selectedValue={filterVillage}
                onValueChange={(v: string) => { setPage(1); setFilterVillage(v); }}
                items={availableVillages}
                style={{ flex: 1, marginRight: 8 }}
                pickerStyle={filterVillage ? styles.filterActive : {}}
              />
              <CompatiblePicker
                selectedValue={filterCrop}
                onValueChange={(v: string) => { setPage(1); setFilterCrop(v); }}
                items={[{ label: 'Toutes cultures', value: '' }, { label: 'Maïs', value: 'maize' }, { label: 'Riz', value: 'rice' }, { label: 'Maraîchage', value: 'vegetables' }]}
                style={{ flex: 1, marginRight: 8 }}
                pickerStyle={filterCrop ? styles.filterActive : {}}
              />
              <CompatiblePicker
                selectedValue={filterStatus}
                onValueChange={(v: string) => { setPage(1); setFilterStatus(v); }}
                items={[{ label: 'Tous statuts', value: '' }, { label: 'en cours', value: 'preparation' }, { label: 'récolté', value: 'cultivated' }, { label: 'abandonné', value: 'fallow' }]}
                style={{ flex: 1 }}
                pickerStyle={filterStatus ? styles.filterActive : {}}
              />
            </View>
          </View>
        )}
        
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setShowMap(false)} style={[styles.toggleBtn, !showMap && styles.toggleActive]}>
            <Feather name="list" size={16} color={!showMap ? '#065f46' : '#6b7280'} />
            <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMap(true)} style={[styles.toggleBtn, showMap && styles.toggleActive]}>
            <Feather name="map" size={16} color={showMap ? '#065f46' : '#6b7280'} />
            <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Carte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#10b981" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      ) : showMap ? (
        <View style={{ flex: 1 }}>
          {Platform.OS === 'web' ? (
            <View style={styles.center}>
              <Text style={styles.noTitle}>La carte n’est pas disponible sur Web (dev)</Text>
              <Text style={styles.noSubtitle}>Testez la vue Carte sur Android/iOS.</Text>
            </View>
          ) : (
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 14.6937,
              longitude: -17.4441,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
          >
            {plots.filter(p => p.hasGps).map(p => (
              <Marker
                key={p.id}
                coordinate={{ latitude: (p as any).lat || 14.6937, longitude: (p as any).lon || -17.4441 }}
                title={p.name}
                description={p.producerName}
                onPress={() => router.push({ pathname: '/(tabs)/parcelles/[plotId]/dashboard', params: { plotId: p.id } })}
              />
            ))}
          </MapView>
          )}
        </View>
      ) : (
        <FlatList
          data={paginated}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PlotCard item={item} />}
          ListFooterComponent={() => (
            paginated.length < plots.length ? (
              <TouchableOpacity onPress={() => setPage(p => p + 1)} style={styles.loadMoreBtn}>
                <Text style={styles.loadMoreBtnText}>Afficher plus</Text>
              </TouchableOpacity>
            ) : null
          )}
          ListEmptyComponent={
            <View style={styles.center}> 
              <Text style={styles.noTitle}>Aucune parcelle</Text>
              <Text style={styles.noSubtitle}>Ajoutez des parcelles depuis les fiches.</Text>
            </View>
          }
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (paginated.length < plots.length) setPage(p => p + 1);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  search: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    color: '#111827',
    marginBottom: 12,
  },
  toggleRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 4, // Adjusted from 10
  },
  toggleBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 6, 
    flex: 1, 
    backgroundColor: '#f3f4f6', 
    paddingVertical: 10, 
    borderRadius: 8,
  },
  toggleActive: { backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#10b981' },
  toggleText: { color: '#6b7280', fontWeight: '600' },
  toggleTextActive: { color: '#065f46' },
  filtersContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  filtersRow: { 
    flexDirection: 'row',
  },
  filterActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  list: { padding: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
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
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  detailsBtn: {
    marginTop: 16,
    backgroundColor: '#3D944B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadMoreBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  loadMoreBtnText: {
    color: '#374151',
    fontWeight: '600',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  info: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  noTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  noSubtitle: { fontSize: 14, color: '#6b7280' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterIconBtn: { padding: 4, marginLeft: 8 },
});


