import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../../lib/services/collecte';

const AddParcelleScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [area, setArea] = React.useState('');
  const [variety, setVariety] = React.useState('');
  const [typology, setTypology] = React.useState('');
  const [size, setSize] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const onSave = async () => {
    if (!id) return;
    if (!code || !area) {
      Alert.alert('Champs requis', 'Identifiant parcelle et surface sont requis.');
      return;
    }
    setSaving(true);
    try {
      const farmFilePlotId = await CollecteService.createFarmFilePlot({
        farmFileId: id,
        code,
        areaHa: Number(area),
        cottonVariety: variety || undefined,
        typology: typology || undefined,
        producerSize: size || undefined,
      });
      if (farmFilePlotId) {
        Alert.alert('Succès', 'La parcelle a été ajoutée à la fiche.', [
          {
            text: 'OK',
            onPress: () => {
              router.replace(`/(tabs)/parcelles/${farmFilePlotId}`);
            },
          },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de créer la parcelle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajouter Parcelle — Fiche #{id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identification</Text>
          <TextInput style={styles.input} placeholder="Identifiant parcelle *" value={code} onChangeText={setCode} />
          <TextInput style={styles.input} placeholder="Surface recensée (ha) *" keyboardType="numeric" value={area} onChangeText={setArea} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Classification</Text>
          <TextInput style={styles.input} placeholder="Typologie (A/B/C/D/CC/EAM)" value={typology} onChangeText={setTypology} />
          <TextInput style={styles.input} placeholder="Taille (Standard/HGros/Super gros)" value={size} onChangeText={setSize} />
          <TextInput style={styles.input} placeholder="Variété (CE/CM/SH/NAW)" value={variety} onChangeText={setVariety} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Responsable & Localisation</Text>
          <Text style={styles.help}>GPS sera capturé automatiquement (fallback saisie manuelle)</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onSave} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? 'Enregistrement…' : 'Enregistrer (brouillon)'}</Text>
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

