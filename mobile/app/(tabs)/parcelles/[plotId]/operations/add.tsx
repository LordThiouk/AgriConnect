import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../../context/AuthContext';
import { CollecteService } from '../../../../../lib/services/collecte';
import { OperationInsert, ParticipantDisplay } from '../../../../../types/collecte';
import CompatiblePicker from '../../../../../components/CompatiblePicker';

// Corresponds to the enum in supabase/migrations/..._operations_enum.sql
const operationTypes = [
  { label: 'Semis', value: 'sowing' },
  { label: 'Fertilisation', value: 'fertilization' },
  { label: 'Irrigation', value: 'irrigation' },
  { label: 'Désherbage', value: 'weeding' },
  { label: 'Traitement phytosanitaire', value: 'pesticide' },
  { label: 'Récolte', value: 'harvest' },
  { label: 'Labour', value: 'tillage' },
  { label: 'Scouting', value: 'scouting' },
];

type Performer = {
  id: string;
  name: string;
  type: 'profile' | 'participant';
};

export default function AddOperationScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [opType, setOpType] = useState<string>(''); // Correction: initialiser avec une chaîne vide
  const [product, setProduct] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [selectedPerformer, setSelectedPerformer] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (plotId && user) {
        try {
          const crop = await CollecteService.getActiveCropByPlotId(plotId);
          if (!crop) {
            Alert.alert("Erreur", "Aucune culture active trouvée. Impossible d'ajouter une opération.");
            router.back();
            return;
          }
          setActiveCropId(crop.id);

          const participants = await CollecteService.getParticipantsByPlotId(plotId);
          const agentPerformer: Performer = { id: user.id, name: `${user.displayName} (Moi)`, type: 'profile' };
          const participantPerformers: Performer[] = participants.map(p => ({ id: p.id, name: p.name, type: 'participant' }));
          
          setPerformers([agentPerformer, ...participantPerformers]);
          setSelectedPerformer(agentPerformer.id); // Default to agent

        } catch (error) {
          Alert.alert("Erreur", "Impossible de charger les données nécessaires.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, [plotId, user]);

  const handleSave = async () => {
    if (!plotId || !user || !activeCropId || !opType || !selectedPerformer) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const performer = performers.find(p => p.id === selectedPerformer);
    if (!performer) return;

    setIsSaving(true);
    try {
      const operationData: OperationInsert = {
        plot_id: plotId,
        crop_id: activeCropId,
        performer_id: performer.id,
        performer_type: performer.type,
        operation_type: opType,
        operation_date: new Date().toISOString(),
        product_used: product || null,
        description: description || null,
      };

      await CollecteService.createOperation(operationData);

      Alert.alert('Succès', 'Opération enregistrée avec succès.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "L'enregistrement de l'opération a échoué.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3D944B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nouvelle Opération</Text>
      
      <Text style={styles.label}>Type d'opération</Text>
      <CompatiblePicker
        items={operationTypes}
        onValueChange={(value) => setOpType(value || '')} // Correction: Assurer que la valeur n'est jamais null
        selectedValue={opType}
        placeholder="Sélectionnez un type" // Correction: Utiliser une chaîne de caractères
      />

      <Text style={styles.label}>Réalisé par</Text>
      <CompatiblePicker
        items={performers.map(p => ({ label: p.name, value: p.id }))}
        onValueChange={(value) => setSelectedPerformer(value || '')}
        selectedValue={selectedPerformer}
        placeholder="Sélectionnez un intervenant"
      />

      <Text style={styles.label}>Produit Utilisé (optionnel)</Text>
      <TextInput
        style={styles.input}
        value={product}
        onChangeText={setProduct}
        placeholder="Nom du produit"
      />

      <Text style={styles.label}>Description (optionnel)</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Détails supplémentaires..."
        multiline
      />

      <Button title={isSaving ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSave} disabled={isSaving} color="#3D944B" />
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
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
});
