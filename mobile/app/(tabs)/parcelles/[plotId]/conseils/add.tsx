import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../../context/AuthContext';
import { CollecteService } from '../../../../../lib/services/collecte';
import { FormSelect } from '../../../../../components/ui';
import { RecommendationInsert } from '../../../../../types/collecte';

const recommendationTypes = [
  { label: 'Fertilisation', value: 'fertilisation' },
  { label: 'Traitement', value: 'traitement' },
  { label: 'Irrigation', value: 'irrigation' },
  { label: 'Ravageur/Maladie', value: 'pest_disease' },
  { label: 'Autre', value: 'autre' },
];

export default function AddRecommendationScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCrop = async () => {
      if (plotId) {
        try {
          const crop = await CollecteService.getActiveCropByPlotId(plotId);
          setActiveCropId(crop?.id || null);
        } catch (error) {
          console.error("Erreur_récupération_culture_active:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchActiveCrop();
  }, [plotId]);

  const handleSave = async () => {
    if (!plotId || !user || !title || !message || !type) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setIsSaving(true);
    const recData: RecommendationInsert = {
      plot_id: plotId,
      crop_id: activeCropId,
      title,
      message,
      recommendation_type: type,
      status: 'pending',
      // 'producer_id' can be inferred in the backend if needed
    };
    
    try {
      await CollecteService.createRecommendation(recData);
      Alert.alert('Succès', 'Conseil enregistré avec succès.');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', "L'enregistrement du conseil a échoué.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nouveau Conseil</Text>
      
      <Text style={styles.label}>Titre</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex: Alerte Mildiou"
      />
      
      <Text style={styles.label}>Type de conseil</Text>
      <FormSelect
        options={recommendationTypes}
        onValueChange={(value) => setType(value || '')}
        value={type}
        placeholder="Sélectionner le type"
        label="Type de conseil"
      />

      <Text style={styles.label}>Message / Recommandation</Text>
      <TextInput
        style={[styles.input, { height: 120 }]}
        value={message}
        onChangeText={setMessage}
        placeholder="Détaillez le conseil ici..."
        multiline
      />

      <Button title={isSaving ? "Enregistrement..." : "Enregistrer"} onPress={handleSave} disabled={isSaving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
});
