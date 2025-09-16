import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../../context/AuthContext';
import { CollecteService } from '../../../../../lib/services/collecte';
import CompatiblePicker from '../../../../../components/CompatiblePicker';
import { InputInsert } from '../../../../../types/collecte';

const inputCategories = [
  { label: 'Semence', value: 'semence' },
  { label: 'Engrais', value: 'engrais' },
  { label: 'Pesticide', value: 'pesticide' },
  { label: 'Herbicide', value: 'herbicide' },
  { label: 'Autre', value: 'autre' },
];

export default function AddInputScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [label, setLabel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCrop = async () => {
      if (plotId) {
        try {
          const crop = await CollecteService.getActiveCropByPlotId(plotId);
          if (crop) {
            setActiveCropId(crop.id);
          } else {
            Alert.alert("Erreur", "Aucune culture active trouvée pour cette parcelle. Vous ne pouvez pas ajouter d'intrant.");
            router.back();
          }
        } catch (error) {
          Alert.alert("Erreur", "Impossible de récupérer la culture active.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchActiveCrop();
  }, [plotId]);

  const handleSave = async () => {
    if (!plotId || !user || !activeCropId || !category) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsSaving(true);
    const inputData: InputInsert = {
      plot_id: plotId,
      crop_id: activeCropId,
      created_by: user.id,
      category,
      label: label || null,
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit || null,
      notes: notes || null,
    };
    
    try {
      await CollecteService.createInput(inputData);
      Alert.alert('Succès', 'Intrant enregistré avec succès.');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', "L'enregistrement de l'intrant a échoué.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nouvel Intrant</Text>
      
      <Text style={styles.label}>Catégorie</Text>
      <CompatiblePicker
        items={inputCategories}
        onValueChange={(value) => setCategory(value || '')}
        selectedValue={category}
        placeholder="Sélectionnez une catégorie"
      />
      
      <Text style={styles.label}>Libellé / Nom du produit</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="Ex: NPK 15-15-15"
      />

      <Text style={styles.label}>Quantité</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Ex: 50"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Unité</Text>
      <TextInput
        style={styles.input}
        value={unit}
        onChangeText={setUnit}
        placeholder="Ex: kg, L, sacs"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes supplémentaires..."
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
