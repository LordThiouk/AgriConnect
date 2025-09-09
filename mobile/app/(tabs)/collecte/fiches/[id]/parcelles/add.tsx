import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const AddParcelleScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajouter Parcelle — Fiche #{id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identification</Text>
          <TextInput style={styles.input} placeholder="Identifiant parcelle *" />
          <TextInput style={styles.input} placeholder="Surface recensée (ha) *" keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Surface piquetée (ha)" keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Vague de plantation" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Classification</Text>
          <TextInput style={styles.input} placeholder="Typologie (A/B/C/D/CC/EAM)" />
          <TextInput style={styles.input} placeholder="Taille (Standard/HGros/Super gros)" />
          <TextInput style={styles.input} placeholder="Variété (CE/CM/SH/NAW)" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Responsable & Localisation</Text>
          <TextInput style={styles.input} placeholder="Responsable parcelle" />
          <Text style={styles.help}>GPS sera capturé automatiquement (fallback saisie manuelle)</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Enregistrer (brouillon)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 10 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, color: '#111827' },
  help: { fontSize: 12, color: '#6b7280' },
  footer: { padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eef2f7' },
  primaryButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: '700' }
});

export default AddParcelleScreen;

