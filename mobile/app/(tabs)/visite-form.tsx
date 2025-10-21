import React, { useState, useEffect, useCallback } from 'react';
import { 
  Alert
} from 'react-native';
import { Text, VStack, Spinner, Box, HStack, Icon } from 'native-base';
import { FormInput, FormSelect, FormDatePicker, FormField } from '../../components/ui';
import { FormContainer } from '../../components/ui/layout/Container';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAgentAssignments } from '../../lib/hooks/useAgentAssignments';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { ProducersServiceInstance as ProducersService } from '../../lib/services/domain/producers';
import { useVisitForEdit, useCreateVisit, useUpdateVisit } from '../../lib/hooks/useVisits';
import { PlotsServiceInstance as PlotsService } from '../../lib/services/domain/plots';
import type { PlotDisplay } from '../../lib/services/domain/plots/plots.types';
import { Feather } from '@expo/vector-icons';

// Types pour le formulaire de visite
interface VisiteFormData {
  producer_id: string;
  plot_id?: string;
  visit_date: string;
  visit_type: string;
  status: string;
  duration_minutes: number;
  notes: string;
  weather_conditions: string;
}

// Local light types
type ProducerDisplay = { id: string; name?: string; location?: string };
type PlotOption = Pick<PlotDisplay, 'id' | 'name' | 'area_hectares' | 'soil_type' | 'water_source' | 'status' | 'producer_id'> & {
  area?: number;
  producerName?: string;
  cropsCount?: number;
  hasGps?: boolean;
  lat?: number;
  lon?: number;
};

export default function VisiteForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { edit, emergency, alertId, producerId, plotId, notes, alertTitle, alertDescription } = useLocalSearchParams<{
    edit?: string;
    emergency?: string;
    alertId?: string;
    producerId?: string;
    plotId?: string;
    notes?: string;
    alertTitle?: string;
    alertDescription?: string;
  }>();

  // Debug logs pour le mode édition
  console.log('🔍 [VISITE_FORM] Paramètres reçus:', {
    edit,
    emergency,
    alertId,
    producerId,
    plotId,
    notes,
    alertTitle,
    alertDescription,
    isEditMode: !!edit
  });
  const [loading, setLoading] = useState(false);
  const [plots, setPlots] = useState<PlotOption[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<ProducerDisplay | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<PlotOption | null>(null);
  const [isEditMode, setIsEditMode] = useState(!!edit);
  const [visitId, setVisitId] = useState<string | null>(edit || null);
  
  // Utiliser les assignations pour obtenir les producteurs affectés
  const { assignments, loading: producersLoading, refetch: refetchAssignments } = useAgentAssignments({
    agentId: user?.id,
    enabled: !!user?.id,
    refetchOnMount: true,
  });

  // Build a producer list from domain service (assignments-aware via RPC)
  const [producers, setProducers] = useState<any[]>([]);
  const [producerSearch, setProducerSearch] = useState<string>('');
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const list = await ProducersService.getProducersByAgentId(user.id);
        setProducers(list || []);
      } catch (e) {
        console.error('❌ [VisiteForm] Impossible de récupérer les producteurs assignés:', e);
        setProducers([]);
      }
    };
    load();
  }, [user?.id]);

  const { data: visitEditData, refetch: refetchVisitEdit } = useVisitForEdit(edit || '', { refetchOnMount: !!edit });
  const { createVisit } = useCreateVisit();
  const { updateVisit } = useUpdateVisit();
  
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

  // Charger les parcelles
  useEffect(() => {
    if (user?.id) {
      // Cette fonction sera définie plus tard
      console.log('Chargement des parcelles pour user:', user.id);
    }
  }, [user?.id]);

  // S'assurer que la parcelle est sélectionnée en mode édition
  useEffect(() => {
    console.log('🔄 useEffect déclenché:', { isEditMode, selectedPlot: !!selectedPlot, plotsLength: plots.length });
    
    if (isEditMode && plots.length > 0 && formData.plot_id && !selectedPlot) {
      console.log('🔄 Recherche de la parcelle à sélectionner en mode édition');
      console.log('   formData.plot_id:', formData.plot_id);
      console.log('   plots disponibles:', plots.map(p => ({ id: p.id, name: p.name })));
      
      const plotToSelect = plots.find(p => p.id === formData.plot_id);
      if (plotToSelect) {
        console.log('✅ Parcelle trouvée, sélection en cours:', plotToSelect.name);
        setSelectedPlot(plotToSelect);
      } else {
        console.log('⚠️ Parcelle non trouvée dans la liste pour formData.plot_id:', formData.plot_id);
      }
    } else {
      console.log('⚠️ Conditions non remplies pour la sélection de parcelle');
    }
  }, [isEditMode, selectedPlot, plots]); // formData.plot_id retiré pour éviter la boucle


  // Charger les données de visite en mode édition
  useEffect(() => {
    if (edit && user?.id) {
      console.log('🔄 Chargement des données de visite en mode édition');
      
      // Réinitialiser tous les états du formulaire
      setFormData({
        producer_id: '',
        plot_id: '',
        visit_date: '',
        visit_type: 'routine',
        status: 'planned',
        duration_minutes: 30,
        notes: '',
        weather_conditions: ''
      });
      setSelectedProducer(null);
      setSelectedPlot(null);
      setPlots([]);
      setLoading(true);
      setIsEditMode(true);
      setVisitId(edit);
      
      // Déclencher le chargement des données
      refetchVisitEdit();
    }
  }, [edit, user?.id, refetchVisitEdit]);

  // Réinitialiser le formulaire quand on quitte le mode édition
  useEffect(() => {
    if (!edit && isEditMode) {
      console.log('🔄 Sortie du mode édition - réinitialisation du formulaire');
      
      // Réinitialiser tous les états
      setFormData({
        producer_id: '',
        plot_id: '',
        visit_date: '',
        visit_type: 'routine',
        status: 'planned',
        duration_minutes: 30,
        notes: '',
        weather_conditions: ''
      });
      setSelectedProducer(null);
      setSelectedPlot(null);
      setPlots([]);
      setIsEditMode(false);
      setVisitId('');
      setLoading(false);
    }
  }, [edit, isEditMode]);

  // Traiter les données de visite quand elles sont chargées
  useEffect(() => {
    if (isEditMode && visitEditData) {
      console.log('🔄 Traitement des données de visite chargées');
      
      const visitData = visitEditData as any;
      
      if (!visitData) {
        console.error('❌ Visite non trouvée ou accès refusé:', edit);
        Alert.alert(
          'Visite introuvable', 
          'Cette visite n\'existe plus ou vous n\'avez pas l\'autorisation de la modifier.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
        return;
      }
      
      console.log('✅ Données de visite chargées via RPC:', {
        visit: visitData.visit?.id,
        producer: visitData.producer?.first_name + ' ' + visitData.producer?.last_name,
        plot: visitData.plot?.name
      });
      
      // Pré-remplir le formulaire avec les données de la visite
      setFormData({
        producer_id: visitData.visit.producer_id,
        plot_id: visitData.visit.plot_id,
        visit_date: visitData.visit.visit_date,
        visit_type: visitData.visit.visit_type,
        status: visitData.visit.status,
        duration_minutes: visitData.visit.duration_minutes || 30,
        notes: visitData.visit.notes || '',
        weather_conditions: visitData.visit.weather_conditions || ''
      });

      // Créer un objet producteur à partir des données RPC
      const producerFromRPC: ProducerDisplay = {
        id: visitData.producer.id,
        name: `${visitData.producer.first_name} ${visitData.producer.last_name}`,
        location: `${visitData.producer.village}, ${visitData.producer.commune}`,
      };
      
      // Créer un objet parcelle à partir des données RPC
      const plotFromRPC: any = {
        id: visitData.plot.id,
        name: visitData.plot.name,
        area_hectares: visitData.plot.area_hectares,
        soil_type: visitData.plot.soil_type,
        water_source: visitData.plot.water_source,
        status: visitData.plot.status,
        producer_id: visitData.visit.producer_id,
        area: visitData.plot.area_hectares,
        producerName: `${visitData.producer.first_name} ${visitData.producer.last_name}`,
        cropsCount: 0,
        hasGps: !!(visitData.plot.lat && visitData.plot.lon)
      } as Partial<PlotDisplay> as PlotDisplay;
      
      console.log('✅ Producteur et parcelle créés à partir du RPC:', {
        producer: producerFromRPC.name,
        plot: plotFromRPC.name,
        plotId: plotFromRPC.id,
        area: plotFromRPC.area_hectares
      });
      
      // Sélectionner le producteur et la parcelle
      setSelectedProducer(producerFromRPC);
      setSelectedPlot(plotFromRPC);
      
      // Ajouter la parcelle aux listes si pas déjà présente
      setPlots(prev => {
        const exists = prev.some(p => p.id === plotFromRPC.id);
        const newPlots = exists ? prev : [...prev, plotFromRPC];
        console.log('🔍 Parcelles après ajout:', newPlots.length, 'parcelles');
        console.log('🔍 Parcelle ajoutée:', plotFromRPC.name, 'ID:', plotFromRPC.id);
        return newPlots;
      });
      
      setLoading(false);
      console.log('✅ Données de visite traitées avec succès');
    }
  }, [isEditMode, visitEditData, edit, router]); // Retirer loading des dépendances

  // Forcer la mise à jour du dropdown parcelle en mode édition
  useEffect(() => {
    if (isEditMode && selectedPlot && plots.length > 0) {
      console.log('🔄 Forçage de la mise à jour du dropdown parcelle');
      console.log('   selectedPlot:', selectedPlot.name, 'ID:', selectedPlot.id);
      console.log('   plots.length:', plots.length);
      console.log('   formData.plot_id:', formData.plot_id);
      
      // S'assurer que formData.plot_id correspond à selectedPlot.id
      if (formData.plot_id !== selectedPlot.id) {
        console.log('🔄 Mise à jour formData.plot_id pour correspondre à selectedPlot.id');
        setFormData(prev => ({ ...prev, plot_id: selectedPlot.id }));
      }
    }
  }, [isEditMode, selectedPlot, plots]); // Retirer formData.plot_id des dépendances pour éviter la boucle

  // Forcer la sélection de la parcelle quand elle est ajoutée en mode édition
  useEffect(() => {
    if (isEditMode && plots.length > 0 && formData.plot_id && !selectedPlot) {
      console.log('🔄 Recherche de la parcelle à sélectionner en mode édition');
      console.log('   formData.plot_id:', formData.plot_id);
      console.log('   plots disponibles:', plots.map(p => ({ id: p.id, name: p.name })));
      
      const plotToSelect = plots.find(p => p.id === formData.plot_id);
      if (plotToSelect) {
        console.log('✅ Parcelle trouvée, sélection en cours:', plotToSelect.name);
        setSelectedPlot(plotToSelect);
      } else {
        console.log('⚠️ Parcelle non trouvée dans la liste pour formData.plot_id:', formData.plot_id);
      }
    }
  }, [isEditMode, plots, formData.plot_id, selectedPlot]);

  // Fonction pour charger les parcelles d'un producteur
  const handleProducerSelect = useCallback(async (option: { value: string; label: string; subtitle?: string }) => {
    console.log('🔄 handleProducerSelect appelé avec:', option);
    const producer = (producers || []).find((p: any) => p.id === option.value);
    if (!producer) {
      console.error('❌ Producteur non trouvé:', option.value);
      console.log('📋 Producteurs disponibles:', producers?.map(p => ({ id: p.id, name: p.name })));
      return;
    }
    
    console.log('🔄 Sélection producteur:', producer.name);
    setSelectedProducer(producer as unknown as ProducerDisplay);
    setFormData(prev => ({ ...prev, producer_id: producer.id }));
    
    // Charger les parcelles du producteur sélectionné via PlotsService
    try {
      console.log('🔄 Chargement parcelles pour producteur via PlotsService:', producer.id);
      
      // Utiliser le nouveau service PlotsService avec cache
      const plotsData = await PlotsService.getPlotsByProducerId(producer.id);
      console.log('✅ Parcelles récupérées via PlotsService:', plotsData.length);

      // Transformer les données pour le format attendu
      const transformedPlots: PlotOption[] = (plotsData || []).map((plot: any): PlotOption => ({
        id: plot.id,
        name: plot.name,
        area: plot.area_hectares,
        area_hectares: plot.area_hectares,
        soil_type: plot.soil_type,
        water_source: plot.water_source,
        status: plot.status,
        producerName: selectedProducer?.name,
        producer_id: producer.id,
        cropsCount: 0,
        hasGps: !!(plot.lat && plot.lon),
        lat: plot.lat,
        lon: plot.lon,
      }));

      console.log('✅ Parcelles transformées:', transformedPlots.length);
      console.log('📋 Parcelles disponibles:', transformedPlots.map(p => ({ id: p.id, name: p.name })));
      
      setPlots(transformedPlots);
      console.log('✅ setPlots() appelé avec', transformedPlots.length, 'parcelles');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des parcelles:', error);
    }
  }, [producers, selectedProducer?.name]);

  // Fonction pour gérer les visites d'urgence
  const handleEmergencyVisit = useCallback(async () => {
    try {
      console.log('🚨 Mode urgence activé:', {
        alertId,
        producerId,
        plotId,
        notes,
        alertTitle,
        alertDescription
      });

      // Pré-remplir le formulaire pour l'urgence
      setFormData(prev => ({
        ...prev,
        producer_id: producerId || '',
        plot_id: plotId || '',
        visit_type: 'emergency',
        status: 'scheduled',
        notes: notes || `Visite d'urgence suite à: ${alertTitle || 'Alerte'}`,
        weather_conditions: 'À déterminer'
      }));

      // Attendre que les données soient chargées
      const waitForData = async (maxRetries = 10) => {
        for (let i = 0; i < maxRetries; i++) {
          if (producers && producers.length > 0) {
            console.log('✅ Données producteurs chargées');
            return true;
          }
          console.log(`⏳ Attente des données... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        return false;
      };

      const dataLoaded = await waitForData();
      if (!dataLoaded) {
        console.error('❌ Timeout: Données non chargées');
        Alert.alert('Erreur', 'Impossible de charger les données des producteurs');
        return;
      }

      // Sélectionner le producteur si fourni
      if (producerId && producers) {
        console.log('🔍 Recherche du producteur:', producerId);
        console.log('📋 Producteurs disponibles:', producers.map((p: any) => ({ id: p.id, name: p.name })));
        const producer = (producers as any[]).find((p: any) => p.id === producerId);
        
        if (producer) {
          console.log('✅ Producteur trouvé:', producer.name);
          setSelectedProducer(producer as unknown as ProducerDisplay);
          
          // Charger les parcelles de ce producteur
          await handleProducerSelect({ value: producer.id, label: producer.name || 'Producteur sans nom' });
          
          // Attendre que les parcelles soient chargées
          const waitForPlots = async (maxRetries = 10) => {
            for (let i = 0; i < maxRetries; i++) {
              if (plots.length > 0) {
                console.log('✅ Parcelles chargées');
                return true;
              }
              console.log(`⏳ Attente des parcelles... (${i + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            return false;
          };

          const plotsLoaded = await waitForPlots();
          if (plotsLoaded && plotId) {
            console.log('🔍 Recherche de la parcelle:', plotId);
            const plot = plots.find(p => p.id === plotId);
            console.log('📋 Parcelles disponibles:', plots.map(p => ({ id: p.id, name: p.name })));
            
            if (plot) {
              console.log('✅ Parcelle trouvée:', plot.name);
              setSelectedPlot(plot);
              setFormData(prev => ({
                ...prev,
                plot_id: plotId
              }));
            } else {
              console.warn('⚠️ Parcelle non trouvée:', plotId);
            }
          }
        } else {
          console.warn('⚠️ Producteur non trouvé:', producerId);
        }
      }

    } catch (error) {
      console.error('❌ Erreur configuration visite d\'urgence:', error);
      Alert.alert('Erreur', 'Impossible de configurer la visite d\'urgence');
    }
  }, [alertId, producerId, plotId, notes, alertTitle, alertDescription, producers, plots, handleProducerSelect]);

  // Gérer les paramètres d'urgence
  useEffect(() => {
    if (emergency === 'true' && user?.id && producers && producers.length > 0) {
      handleEmergencyVisit();
    }
  }, [emergency, user?.id, producers, handleEmergencyVisit]);

  const handlePlotSelect = (option: { value: string; label: string }) => {
    if (option.value === '') {
      setSelectedPlot(null);
      setFormData(prev => ({ ...prev, plot_id: '' }));
      return;
    }
    
    const plot = plots?.find(p => p.id === option.value);
    if (!plot) return;
    
    setSelectedPlot(plot);
    setFormData(prev => ({ ...prev, plot_id: plot.id }));
  };

  // Cette fonction n'est plus utilisée car on utilise FormDatePicker

  const handleSubmit = async () => {
    if (!formData.producer_id) {
      Alert.alert('Erreur', 'Veuillez sélectionner un producteur');
      return;
    }

    try {
      setLoading(true);
      
      // Préparer les données de visite
      const visitData = {
        producer_id: formData.producer_id,
        plot_id: formData.plot_id || null,
        visit_date: formData.visit_date,
        visit_type: formData.visit_type,
        status: formData.status,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes.toString()) : null,
        notes: formData.notes || null,
        weather_conditions: formData.weather_conditions || null
      };

      if (isEditMode && visitId) {
        // Mode édition via Supabase
        console.log('Mise à jour de visite via Supabase:', visitData);
        await updateVisit(visitId, visitData);
        Alert.alert('Succès', 'Visite mise à jour avec succès');
        // Redirection automatique après un court délai
        setTimeout(() => {
          router.push({
            pathname: '/(tabs)/agent-dashboard',
            params: { refresh: 'true' } // Paramètre pour forcer le rafraîchissement
          });
        }, 1000);
      } else {
        // Mode création via Supabase
        console.log('Création de visite via Supabase:', visitData);
        const data = await createVisit(user?.id || '', visitData);
        console.log('✅ Visite créée avec succès:', data);
        Alert.alert('Succès', 'Visite créée avec succès');
        // Redirection automatique après un court délai
        setTimeout(() => {
          router.push('/(tabs)/agent-dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission de visite:', error);
      Alert.alert('Erreur', `Impossible de ${isEditMode ? 'mettre à jour' : 'créer'} la visite: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
  const producerOptions = (producers || []).map((p: any) => {
    const label = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Producteur sans nom';
    const phone = p.phone || '';
    const place = p.location || [p.village, p.commune].filter(Boolean).join(', ');
    const subtitle = [phone, place].filter(Boolean).join(' · ');
    const searchable = `${label} ${phone} ${place}`.toLowerCase();
    return { value: p.id, label, subtitle, searchable } as { value: string; label: string; subtitle?: string; searchable: string };
  });

  const filteredProducerOptions = producerOptions.filter(opt =>
    producerSearch ? opt.searchable.includes(producerSearch.toLowerCase()) : true
  );

  const plotOptions = [
    { value: '', label: 'Aucune parcelle spécifique' },
    ...(plots?.map(plot => {
      console.log('🔍 Mapping parcelle pour dropdown:', {
        id: plot.id,
        name: plot.name,
        area_hectares: plot.area_hectares,
        rawPlot: plot
      });
      return {
        value: plot.id,
        label: plot.name || 'Parcelle sans nom',
        subtitle: `${plot.area_hectares?.toFixed(2) || '0.00'} ha`
      };
    }) || [])
  ];

  // Debug logs pour les parcelles
  console.log('🔍 Debug parcelles:', {
    plotsLength: plots?.length || 0,
    plotOptionsLength: plotOptions.length,
    isEditMode,
    selectedPlot: selectedPlot?.name,
    formDataPlotId: formData.plot_id,
    plots: plots?.map(p => ({ id: p.id, name: p.name, area_hectares: p.area_hectares })) || [],
    plotOptions: plotOptions.map(o => ({ value: o.value, label: o.label, subtitle: 'subtitle' in o ? o.subtitle : undefined }))
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <FormContainer
      title={emergency === 'true' ? 'Visite d\'Urgence' : (isEditMode ? 'Modifier la Visite' : 'Nouvelle Visite')}
      showBackButton={true}
      onBackPress={() => router.back()}
      onCancel={() => router.back()}
      onSave={handleSubmit}
      loading={loading || producersLoading}
      contentPadding={5}
    >
      <VStack space={4}>
        {(loading && (!producers || producers.length === 0)) && (
          <VStack space={4} alignItems="center" justifyContent="center" flex={1}>
            <Spinner size="lg" color="primary.500" />
            <Text color="gray.600">Chargement des données...</Text>
          </VStack>
        )}
        {/* Sélection du producteur */}
        <FormField
          label="Producteur"
          required
        >
          {filteredProducerOptions.length === 0 && !producersLoading ? (
            <Box p={4} bg="gray.100" borderRadius="md" alignItems="center">
              <Text color="gray.600" textAlign="center">
                Aucun producteur assigné à cet agent
              </Text>
            </Box>
          ) : (
            <VStack space={2}>
              <FormInput
                placeholder="Rechercher (nom, téléphone, localité)"
                value={producerSearch}
                onChangeText={setProducerSearch}
              />
              <FormSelect
                value={formData.producer_id}
                onValueChange={(value) => {
                  const option = filteredProducerOptions.find(opt => opt.value === value);
                  if (option) {
                    handleProducerSelect(option);
                  }
                }}
                options={filteredProducerOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                placeholder="Sélectionner un producteur"
                disabled={producersLoading}
              />
            </VStack>
          )}
        </FormField>

        {/* Sélection de la parcelle (optionnelle) */}
        {selectedProducer && (
          <FormField
            label="Parcelle" required
          >
            {/* Debug dropdown parcelle */}
            {(() => {
              console.log('🔍 Debug dropdown parcelle:', { 
                selectedProducer: !!selectedProducer, 
                plotsLength: plots?.length || 0, 
                plotOptionsLength: plotOptions.length,
                isEditMode,
                selectedPlot: selectedPlot?.name,
                formDataPlotId: formData.plot_id,
                plotOptions: plotOptions.map(o => ({ value: o.value, label: o.label }))
              });
              return null;
            })()}
            {plotOptions.length === 0 ? (
              <Box p={4} bg="gray.100" borderRadius="md" alignItems="center">
                <Text color="gray.600" textAlign="center">
                  Aucune parcelle disponible pour ce producteur
                </Text>
              </Box>
            ) : (
              <FormSelect
                key={`plot-select-${plots?.length || 0}-${formData.plot_id}`}
                value={formData.plot_id || ''}
                onValueChange={(value) => {
                  const option = plotOptions.find(opt => opt.value === value);
                  if (option) {
                    handlePlotSelect(option);
                  }
                }}
                options={plotOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                placeholder="Sélectionner une parcelle"
                disabled={loading || producersLoading}
              />
            )}
            {selectedPlot && (
              <Box mt={2} p={3} bg="primary.50" borderRadius="md">
                <Text color="primary.700" fontSize="sm">
                  Parcelle sélectionnée: {selectedPlot.name} ({selectedPlot.area_hectares?.toFixed(2)} ha)
                </Text>
              </Box>
            )}
          </FormField>
        )}

        {/* Date et heure */}
        <FormField
          label="Date et heure"
          required
        >
          <FormDatePicker
            value={formData.visit_date}
            onChange={(value) => setFormData(prev => ({ ...prev, visit_date: value }))}
            mode="datetime"
            minuteInterval={5}
            display="default"
            disabled={loading || producersLoading}
          />
        </FormField>

        {/* Type de visite */}
        <FormField
          label="Type de visite"
        >
          <FormSelect
            value={formData.visit_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, visit_type: value as any }))}
            options={visitTypes.map(opt => ({ value: opt.value, label: opt.label }))}
            placeholder="Sélectionner le type de visite"
            disabled={loading || producersLoading}
          />
        </FormField>

        {/* Statut */}
        <FormField
          label="Statut"
        >
          <FormSelect
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            options={statusOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            placeholder="Sélectionner le statut"
            disabled={loading || producersLoading}
          />
        </FormField>

        {/* Durée */}
        <FormField
          label="Durée (minutes)"
        >
          <FormSelect
            value={String(formData.duration_minutes || '')}
            onValueChange={(value) => {
              const minutes = parseInt(String(value || '0'), 10) || 0;
              setFormData(prev => ({ ...prev, duration_minutes: minutes }));
            }}
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '1 heure' },
              { value: '90', label: '1h 30' },
              { value: '120', label: '2 heures' },
            ]}
            placeholder="Sélectionner une durée"
            disabled={loading || producersLoading}
          />
        </FormField>

        {/* Notes */}
        <FormField
          label="Notes"
        >
          <FormInput
            placeholder="Ajoutez des notes sur la visite..."
            value={formData.notes || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            multiline
            numberOfLines={4}
          />
        </FormField>

        {/* Conditions météo */}
        <FormField
          label="Conditions météo"
        >
          <HStack space={3} alignItems="center">
            <Icon as={Feather} name="cloud" size={5} color="primary.500" />
            <FormInput
              placeholder="Conditions météo (ex: Ensoleillé, Pluvieux...)"
              value={formData.weather_conditions || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, weather_conditions: text }))}
            />
          </HStack>
        </FormField>

        {/* Détails de la visite - Affichage des informations complètes */}
        {isEditMode && selectedProducer && selectedPlot && (
          <FormField
            label="Détails de la visite"
          >
            <VStack space={3} p={4} bg="gray.50" borderRadius="md">
              {/* Producteur */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Producteur</Text>
                <Text color="gray.900" fontSize="sm">{selectedProducer.name}</Text>
              </HStack>
              
              {/* Parcelle */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Parcelle</Text>
                <Text color="gray.900" fontSize="sm">{selectedPlot.name}</Text>
              </HStack>
              
              {/* Localisation */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Localisation</Text>
                <Text color="gray.900" fontSize="sm">
                  {selectedPlot.lat && selectedPlot.lon 
                    ? `${selectedPlot.lat.toFixed(6)}, ${selectedPlot.lon.toFixed(6)}`
                    : 'Non disponible'
                  }
                </Text>
              </HStack>
              
              {/* Visite */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Visite</Text>
                <Text color="gray.900" fontSize="sm">
                  {formData.visit_date 
                    ? new Date(formData.visit_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Date non spécifiée'
                  }
                </Text>
              </HStack>
              
              {/* Durée prévue */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Durée prévue</Text>
                <Text color="gray.900" fontSize="sm">
                  {formData.duration_minutes ? `${formData.duration_minutes} minutes` : 'Non spécifiée'}
                </Text>
              </HStack>
              
              {/* Statut */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Statut</Text>
                <Box px={2} py={1} bg="primary.100" borderRadius="sm">
                  <Text color="primary.700" fontSize="sm" fontWeight="medium">
                    {formData.status === 'scheduled' ? 'à faire' : 
                     formData.status === 'in_progress' ? 'en cours' : 
                     formData.status === 'completed' ? 'terminé' : 
                     formData.status || 'Non spécifié'}
                  </Text>
                </Box>
              </HStack>
              
              {/* Type de visite */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Type de visite</Text>
                <Text color="gray.900" fontSize="sm">
                  {formData.visit_type === 'routine' ? 'Routine' :
                   formData.visit_type === 'planned' ? 'Planifiée' :
                   formData.visit_type === 'follow_up' ? 'Suivi' :
                   formData.visit_type === 'emergency' ? 'Urgence' :
                   formData.visit_type || 'Non spécifié'}
                </Text>
              </HStack>
              
              {/* Superficie de la parcelle */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Superficie parcelle</Text>
                <Text color="gray.900" fontSize="sm">
                  {selectedPlot.area_hectares ? `${selectedPlot.area_hectares} hectares` : 'Non spécifiée'}
                </Text>
              </HStack>
              
              {/* Type de sol */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Type de sol</Text>
                <Text color="gray.900" fontSize="sm">
                  {selectedPlot.soil_type || 'Non spécifié'}
                </Text>
              </HStack>
              
              {/* Source d'eau */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm" fontWeight="medium">Source d&apos;eau</Text>
                <Text color="gray.900" fontSize="sm">
                  {selectedPlot.water_source || 'Non spécifiée'}
                </Text>
              </HStack>
            </VStack>
          </FormField>
        )}

        {/* Footer actions handled by FormContainer */}
      </VStack>
    </FormContainer>
    </TouchableWithoutFeedback>
  );
}

// Styles supprimés - utilisation du thème NativeBase