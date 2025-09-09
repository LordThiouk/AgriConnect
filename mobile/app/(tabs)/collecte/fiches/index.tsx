import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

type FicheItem = {
  id: string;
  name: string;
  status: 'draft' | 'validated';
  updatedAt: string;
};

const mockData: FicheItem[] = [];

const FichesIndexScreen: React.FC = () => {
  const router = useRouter();

  const renderItem = ({ item }: { item: FicheItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/collecte/fiches/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={[styles.badge, item.status === 'validated' ? styles.badgeValidated : styles.badgeDraft]}>
          <Text style={styles.badgeText}>{item.status === 'validated' ? 'Validée' : 'Brouillon'}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>Mis à jour: {item.updatedAt}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Fiches d'exploitation</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/collecte/fiches/create')}>
          <Text style={styles.addButtonText}>+ Nouvelle fiche</Text>
        </TouchableOpacity>
      </View>

      {mockData.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucune fiche</Text>
          <Text style={styles.emptySubtitle}>Créez votre première fiche d'exploitation pour commencer.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/collecte/fiches/create')}>
            <Text style={styles.primaryButtonText}>Créer une fiche</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mockData}
          keyExtractor={(item) => item.id}
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
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeValidated: { backgroundColor: '#dcfce7' },
  badgeDraft: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 12, color: '#111827' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  primaryButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryButtonText: { color: '#ffffff', fontWeight: '700' }
});

export default FichesIndexScreen;

