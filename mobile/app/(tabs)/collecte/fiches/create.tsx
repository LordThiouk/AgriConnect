import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

type Step = 1 | 2 | 3;

const CreateFicheScreen: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const goNext = () => setStep((s) => Math.min(3, (s + 1) as Step));
  const goPrev = () => setStep((s) => Math.max(1, (s - 1) as Step));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nouvelle Fiche d'exploitation</Text>
        <Text style={styles.subtitle}>Étape {step} / 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1a. Données organisationnelles</Text>
            <TextInput style={styles.input} placeholder="Nom de la fiche *" />
            <TextInput style={styles.input} placeholder="Région *" />
            <TextInput style={styles.input} placeholder="Département *" />
            <TextInput style={styles.input} placeholder="Commune *" />
            <TextInput style={styles.input} placeholder="Village *" />
            <TextInput style={styles.input} placeholder="Secteur *" />
            <TextInput style={styles.input} placeholder="Coopérative *" />
            <TextInput style={styles.input} placeholder="GPC *" />
            <TextInput style={styles.input} placeholder="Date de recensement *" />
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1b. Chef d'exploitation</Text>
            <TextInput style={styles.input} placeholder="Nom *" />
            <TextInput style={styles.input} placeholder="Statut (Chef/Producteur)" />
            <TextInput style={styles.input} placeholder="Date de naissance / Âge *" />
            <TextInput style={styles.input} placeholder="Sexe (M/F) *" />
            <TextInput style={styles.input} placeholder="Numéro CNI" />
            <TextInput style={styles.input} placeholder="Alphabétisation (Oui/Non)" />
            <TextInput style={styles.input} placeholder="Langues" />
            <TextInput style={styles.input} placeholder="Relais agricole formé (Oui/Non)" />
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1c. Inventaire matériel</Text>
            <TextInput style={styles.input} placeholder="Pulvérisateurs (bon état)" />
            <TextInput style={styles.input} placeholder="Pulvérisateurs (réparable)" />
            <TextInput style={styles.input} placeholder="Matériel agricole (Tracteur/Motoculteur/UCF)" />
            <TextInput style={styles.input} placeholder="Outils manuels (Houe Sine, etc.)" />
            <TextInput style={styles.input} placeholder="Animaux de trait (quantités)" />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.navButton, step === 1 && styles.navButtonDisabled]} disabled={step === 1} onPress={goPrev}>
          <Text style={styles.navButtonText}>Retour</Text>
        </TouchableOpacity>
        {step < 3 ? (
          <TouchableOpacity style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>Suivant</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)/collecte/fiches')}>
            <Text style={styles.primaryButtonText}>Enregistrer (brouillon)</Text>
          </TouchableOpacity>
        )}
      </View>
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
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 10 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, color: '#111827' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eef2f7' },
  navButton: { backgroundColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  navButtonDisabled: { opacity: 0.6 },
  navButtonText: { color: '#111827', fontWeight: '600' },
  primaryButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryButtonText: { color: '#ffffff', fontWeight: '700' }
});

export default CreateFicheScreen;

