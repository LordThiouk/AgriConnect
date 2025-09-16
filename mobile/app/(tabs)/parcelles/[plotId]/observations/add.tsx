import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../../context/AuthContext';
import { CollecteService } from '../../../../../lib/services/collecte';
import { ObservationInsert, ObservationType } from '../../../../../types/collecte';
import CompatiblePicker from '../../../../../components/CompatiblePicker';
import StarRating from '../../../../../components/StarRating';

const observationTypes: { label: string; value: ObservationType }[] = [
  { label: 'Ravageur/Maladie', value: 'pest_disease' },
  { label: 'Levée', value: 'emergence' },
  { label: 'Phénologie', value: 'phenology' },
  { label: 'Autre', value: 'other' },
];

export default function AddObservationScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [obsType, setObsType] = useState<ObservationType>('pest_disease');
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!plotId || !user) {
      Alert.alert("Erreur", "Impossible de sauvegarder : informations manquantes.");
      return;
    }

    setIsSaving(true);
    try {
      const observationData: ObservationInsert = {
        farm_file_plot_id: plotId,
        created_by: user.id,
        obs_type: obsType,
        severity: severity > 0 ? severity : null,
        notes: notes,
      };

      await CollecteService.createObservation(observationData);
      
      Alert.alert("Succès", "Observation sauvegardée avec succès.", [
        { text: "OK", onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error("Failed to save observation:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nouvelle Observation</Text>
      <Text style={styles.subtitle}>Parcelle #{plotId}</Text>

      <Text style={styles.label}>Type d&apos;observation</Text>
      <CompatiblePicker
        selectedValue={obsType}
        onValueChange={(itemValue) => setObsType(itemValue as ObservationType)}
        items={observationTypes}
      />

      <Text style={styles.label}>Sévérité (1 à 5)</Text>
      <StarRating rating={severity} onRatingChange={setSeverity} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textArea}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Décrivez ce que vous avez observé..."
      />
      
      <Text style={styles.label}>Photo (Optionnel)</Text>
      {/* TODO: Implémenter la prise de photo */}
      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoText}>+</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title={isSaving ? "Enregistrement..." : "Enregistrer"} onPress={handleSave} color="#3D944B" disabled={isSaving} />
        <View style={{ marginTop: 8 }}>
          <Button title="Annuler" onPress={() => router.back()} color="#6b7280" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  photoText: {
    fontSize: 40,
    color: '#9ca3af',
  },
  buttonContainer: {
    marginTop: 16,
  }
});
