import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { CollecteService } from '../../lib/services/collecte';
import { ProducerDisplay, PlotDisplay } from '../../types/collecte';
import ContentWithHeader from '../../components/ContentWithHeader';
import Dropdown from '../../components/Dropdown';
import CustomDateTimePicker from '../../components/DateTimePicker';
import { Feather } from '@expo/vector-icons';

// Types pour le formulaire de visite
interface VisiteFormData {
  producer_id: string;
  plot_id?: string;
  visit_date: string;
  visit_type: 'planned' | 'follow_up' | 'emergency' | 'routine';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  duration_minutes?: number;
  location_latitude?: number;
  location_longitude?: number;
  notes?: string;
  weather_conditions?: string;
}

export default function VisiteFormScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [producers, setProducers] = useState<ProducerDisplay[]>([]);
  const [plots, setPlots] = useState<PlotDisplay[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<ProducerDisplay | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<PlotDisplay | null>(null);
  
  const [formData, setFormData] = useState<VisiteFormData>({
    producer_id: '',
    plot_id: '',
    visit_date: new Date().toISOString(),
    visit_type: 'planned',
    status: 'scheduled',
    duration_minutes: 30,
    notes: '',
    weather_conditions: ''
  });

  // Charger les producteurs et parcelles
  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔄 Chargement des producteurs pour user.id:', user.id);
      
      // Utiliser la nouvelle méthode qui gère la conversion user_id -> profile.id
      const producersData = await CollecteService.getProducersByUserId(user.id);
      console.log('✅ Producteurs récupérés:', producersData.length);
      console.log('📋 Détails des producteurs:', producersData);
      
      setProducers(producersData);
      setPlots([]); // Les parcelles seront chargées dynamiquement selon le producteur sélectionné
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleProducerSelect = async (option: { value: string; label: string; subtitle?: string }) => {
    const producer = producers.find(p => p.id === option.value);
    if (!producer) return;
    
    setSelectedProducer(producer);
    setFormData(prev => ({ ...prev, producer_id: producer.id }));
    
    // Charger les parcelles du producteur sélectionné
    try {
      // Utiliser la nouvelle méthode qui gère la conversion user_id -> profile.id
      const plotsData = await CollecteService.getPlotsByUserId(user?.id || '');
      const producerPlots = plotsData.filter(plot => 
        plot.producerName === producer.name
      );
      setPlots(producerPlots);
    } catch (error) {
      console.error('Erreur lors du chargement des parcelles:', error);
      setPlots([]);
    }
  };

  const handlePlotSelect = (option: { value: string; label: string; subtitle?: string }) => {
    if (option.value === '') {
      setSelectedPlot(null);
      setFormData(prev => ({ ...prev, plot_id: '' }));
      return;
    }
    
    const plot = plots.find(p => p.id === option.value);
    if (!plot) return;
    
    setSelectedPlot(plot);
    setFormData(prev => ({ ...prev, plot_id: plot.id }));
  };

  const handleDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, visit_date: date.toISOString() }));
  };

  const handleSubmit = async () => {
    if (!formData.producer_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner un producteur');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Implémenter la création de visite via CollecteService
      console.log('Création de visite:', formData);
      
      Alert.alert('Succès', 'Visite créée avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la création de visite:', error);
      Alert.alert('Erreur', 'Impossible de créer la visite');
    } finally {
      setLoading(false);
    }
  };

  const visitTypes = [
    { value: 'planned', label: 'Planifiée' },
    { value: 'follow_up', label: 'Suivi' },
    { value: 'emergency', label: 'Urgence' },
    { value: 'routine', label: 'Routine' }
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Programmée' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' },
    { value: 'no_show', label: 'Absence' }
  ];

  // Préparer les options pour les dropdowns
  const producerOptions = producers.map(producer => ({
    value: producer.id,
    label: producer.name,
    subtitle: producer.location
  }));

  const plotOptions = [
    { value: '', label: 'Aucune parcelle spécifique' },
    ...plots.map(plot => ({
      value: plot.id,
      label: plot.name,
      subtitle: `${plot.area?.toFixed(2)} ha`
    }))
  ];

  if (loading && producers.length === 0) {
    return (
      <ContentWithHeader style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D944B" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </ContentWithHeader>
    );
  }

  return (
    <ContentWithHeader style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Nouvelle Visite</Text>
        
        {/* Sélection du producteur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Producteur *</Text>
          {producerOptions.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Aucun producteur assigné à cet agent
              </Text>
            </View>
          ) : (
            <Dropdown
              options={producerOptions}
              selectedValue={formData.producer_id}
              onSelect={handleProducerSelect}
              placeholder="Sélectionner un producteur"
              disabled={loading}
            />
          )}
        </View>

        {/* Sélection de la parcelle (optionnelle) */}
        {selectedProducer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parcelle (optionnel)</Text>
            {plotOptions.length === 1 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Aucune parcelle disponible pour ce producteur
                </Text>
              </View>
            ) : (
              <Dropdown
                options={plotOptions}
                selectedValue={formData.plot_id || ''}
                onSelect={handlePlotSelect}
                placeholder="Sélectionner une parcelle"
                disabled={loading}
              />
            )}
            {selectedPlot && (
              <Text style={styles.selectedInfo}>
                Parcelle sélectionnée: {selectedPlot.name} ({selectedPlot.area?.toFixed(2)} ha)
              </Text>
            )}
          </View>
        )}

        {/* Date et heure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date et heure *</Text>
          <CustomDateTimePicker
            value={new Date(formData.visit_date)}
            onChange={handleDateChange}
            mode="datetime"
            placeholder="Sélectionner la date et l'heure"
            disabled={loading}
          />
        </View>

        {/* Type de visite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de visite *</Text>
          <Dropdown
            options={visitTypes}
            selectedValue={formData.visit_type}
            onSelect={(option) => setFormData(prev => ({ ...prev, visit_type: option.value as any }))}
            placeholder="Sélectionner le type de visite"
            disabled={loading}
          />
        </View>

        {/* Statut */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut *</Text>
          <Dropdown
            options={statusOptions}
            selectedValue={formData.status}
            onSelect={(option) => setFormData(prev => ({ ...prev, status: option.value as any }))}
            placeholder="Sélectionner le statut"
            disabled={loading}
          />
        </View>

        {/* Durée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durée (minutes)</Text>
          <View style={styles.inputContainer}>
            <Feather name="clock" size={20} color="#3D944B" />
            <Text style={styles.inputText}>{formData.duration_minutes} minutes</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.textAreaContainer}>
            <Text style={styles.placeholderText}>
              Ajoutez des notes sur la visite...
            </Text>
          </View>
        </View>

        {/* Conditions météo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions météo</Text>
          <View style={styles.inputContainer}>
            <Feather name="cloud" size={20} color="#3D944B" />
            <Text style={styles.inputText}>
              {formData.weather_conditions || 'Non spécifié'}
            </Text>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Créer la visite</Text>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  textAreaContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#3D944B',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedInfo: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
