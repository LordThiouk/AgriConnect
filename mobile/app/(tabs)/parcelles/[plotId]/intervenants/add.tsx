import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollecteService } from '@/lib/services/collecte';
import ContentWithHeader from '@/components/ContentWithHeader';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const FormField = ({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
  </View>
);

export default function AddIntervenantScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    sex: '',
    birthdate: '',
    cni: '',
    is_young: false,
    literacy: false,
    languages: ''
  });

  const handleSave = async () => {
    if (!formData.name || !formData.role) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      const intervenantData = {
        plot_id: plotId!,
        name: formData.name,
        role: formData.role,
        sex: formData.sex || null,
        birthdate: formData.birthdate || null,
        cni: formData.cni || null,
        is_young: formData.is_young,
        literacy: formData.literacy,
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()) : null,
        created_by: user?.id || ''
      };

      await CollecteService.addParticipant(intervenantData);
      
      Alert.alert(
        'Succès',
        'Intervenant ajouté avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'intervenant:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'intervenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWithHeader style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <FormField label="Nom complet" required>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Nom et prénom"
            />
          </FormField>

          <FormField label="Rôle" required>
            <TextInput
              style={styles.input}
              value={formData.role}
              onChangeText={(text) => setFormData(prev => ({ ...prev, role: text }))}
              placeholder="Rôle de l'intervenant"
            />
          </FormField>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormField label="Sexe">
                <TextInput
                  style={styles.input}
                  value={formData.sex}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, sex: text }))}
                  placeholder="M/F"
                />
              </FormField>
            </View>
            <View style={styles.halfField}>
              <FormField label="Date de naissance">
                <TextInput
                  style={styles.input}
                  value={formData.birthdate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, birthdate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </FormField>
            </View>
          </View>

          <FormField label="CNI">
            <TextInput
              style={styles.input}
              value={formData.cni}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cni: text }))}
              placeholder="Numéro de CNI"
            />
          </FormField>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormField label="Jeune">
                <TouchableOpacity
                  style={[styles.checkbox, formData.is_young && styles.checkboxChecked]}
                  onPress={() => setFormData(prev => ({ ...prev, is_young: !prev.is_young }))}
                >
                  <Text style={[styles.checkboxText, formData.is_young && styles.checkboxTextChecked]}>
                    {formData.is_young ? 'Oui' : 'Non'}
                  </Text>
                </TouchableOpacity>
              </FormField>
            </View>
            <View style={styles.halfField}>
              <FormField label="Alphabétisé">
                <TouchableOpacity
                  style={[styles.checkbox, formData.literacy && styles.checkboxChecked]}
                  onPress={() => setFormData(prev => ({ ...prev, literacy: !prev.literacy }))}
                >
                  <Text style={[styles.checkboxText, formData.literacy && styles.checkboxTextChecked]}>
                    {formData.literacy ? 'Oui' : 'Non'}
                  </Text>
                </TouchableOpacity>
              </FormField>
            </View>
          </View>

          <FormField label="Langues parlées">
            <TextInput
              style={styles.input}
              value={formData.languages}
              onChangeText={(text) => setFormData(prev => ({ ...prev, languages: text }))}
              placeholder="Français, Wolof, Sérère (séparées par des virgules)"
            />
          </FormField>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ContentWithHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  checkbox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3D944B',
    borderColor: '#3D944B',
  },
  checkboxText: {
    color: '#374151',
    fontSize: 16,
  },
  checkboxTextChecked: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3D944B',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
