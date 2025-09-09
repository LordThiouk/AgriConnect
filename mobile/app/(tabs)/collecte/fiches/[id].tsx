import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const FicheDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fiche #{id}</Text>
        <Text style={styles.subtitle}>État: Brouillon (exemple)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Données organisationnelles</Text>
          <Text style={styles.textMuted}>Région / Département / Commune / Village / Secteur</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chef d'exploitation</Text>
          <Text style={styles.textMuted}>Nom, Statut, Âge, Sexe, CNI, Langues…</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Inventaire matériel</Text>
          <Text style={styles.textMuted}>Pulvérisateurs, Matériel, Outils, Animaux de trait…</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push(`/(tabs)/collecte/fiches/${id}/parcelles/add`)}>
            <Text style={styles.primaryButtonText}>Ajouter une parcelle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push(`/(tabs)/collecte/fiches/${id}/parcelles`)}>
            <Text style={styles.secondaryButtonText}>Voir les parcelles</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  subtitle: { marginTop: 4, fontSize: 12, color: '#6b7280' },
  content: { padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
  textMuted: { fontSize: 13, color: '#6b7280' },
  actions: { marginTop: 8, gap: 10 },
  primaryButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#111827', fontWeight: '700' }
});

export default FicheDetailScreen;

