import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const ParcelleDashboardScreen: React.FC = () => {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parcelle #{plotId}</Text>
        <Text style={styles.subtitle}>Dashboard</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.tile} onPress={() => router.push(`/(tabs)/collecte/parcelles/${plotId}/intervenants`)}>
          <Text style={styles.tileTitle}>Intervenants</Text>
          <Text style={styles.tileDesc}>Ajouter/éditer les acteurs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push(`/(tabs)/collecte/parcelles/${plotId}/intrants`)}>
          <Text style={styles.tileTitle}>Intrants</Text>
          <Text style={styles.tileDesc}>Semences, engrais, phyto…</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push(`/(tabs)/collecte/parcelles/${plotId}/operations`)}>
          <Text style={styles.tileTitle}>Opérations</Text>
          <Text style={styles.tileDesc}>Semis, fertilisation, traitements…</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => router.push(`/(tabs)/collecte/parcelles/${plotId}/campagne`)}>
          <Text style={styles.tileTitle}>Suivi & Conseils</Text>
          <Text style={styles.tileDesc}>Étapes campagne + WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  subtitle: { marginTop: 4, fontSize: 12, color: '#6b7280' },
  grid: { padding: 16, gap: 12 },
  tile: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tileTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  tileDesc: { marginTop: 6, fontSize: 12, color: '#6b7280' }
});

export default ParcelleDashboardScreen;

