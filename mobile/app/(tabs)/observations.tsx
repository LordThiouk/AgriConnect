import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockObservations: Array<{ id: string; title: string; date: string; severity?: number }>= [];

export default function ObservationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Observations</Text>
      {mockObservations.length === 0 ? (
        <View style={styles.empty}> 
          <Text style={styles.emptyTitle}>Aucune observation</Text>
          <Text style={styles.emptySubtitle}>Ajoutez des observations depuis les parcelles.</Text>
        </View>
      ) : (
        <FlatList
          data={mockObservations}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.date}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280' },
  list: { paddingVertical: 8 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSubtitle: { marginTop: 6, fontSize: 12, color: '#6b7280' },
});


