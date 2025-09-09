import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Parcelle = {
  id: string;
  code: string;
  areaHa: number;
  variety?: string;
};

const mockParcelles: Parcelle[] = [];

const ParcellesListScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const renderItem = ({ item }: { item: Parcelle }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/collecte/parcelles/${item.id}/dashboard`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Parcelle {item.code}</Text>
        <Text style={styles.badge}>~ {item.areaHa} ha</Text>
      </View>
      {item.variety ? <Text style={styles.cardSubtitle}>Variété: {item.variety}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parcelles — Fiche #{id}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/(tabs)/collecte/fiches/${id}/parcelles/add`)}>
          <Text style={styles.addButtonText}>+ Ajouter parcelle</Text>
        </TouchableOpacity>
      </View>

      {mockParcelles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucune parcelle</Text>
          <Text style={styles.emptySubtitle}>Ajoutez votre première parcelle pour cette fiche.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push(`/(tabs)/collecte/fiches/${id}/parcelles/add`)}>
            <Text style={styles.primaryButtonText}>Ajouter une parcelle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mockParcelles}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  addButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#10b981', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#ffffff', fontWeight: '600' },
  list: { padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSubtitle: { marginTop: 6, fontSize: 12, color: '#6b7280' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#f3f4f6', color: '#111827', fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  primaryButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryButtonText: { color: '#ffffff', fontWeight: '700' }
});

export default ParcellesListScreen;

