import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { CollecteService } from '../../../../lib/services/collecte';
import { PlotDisplay, ParticipantDisplay, RecommendationDisplay, OperationDisplay, InputDisplay, ObservationDisplay, Crop } from '../../../../types/collecte';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';

const InfoCard = ({ plot }: { plot: PlotDisplay | null }) => {
  const statusConfig = {
    preparation: { text: 'En cours', color: '#10b981' },
    active: { text: 'En cours', color: '#10b981' }, // Correction du bug
    cultivated: { text: 'Récolté', color: '#f59e0b' },
    fallow: { text: 'Abandonné', color: '#ef4444' },
  };
  const currentStatus = statusConfig[plot?.status as keyof typeof statusConfig] || statusConfig.preparation;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Informations générales</Text>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>ID Parcelle</Text>
          <Text style={styles.infoValue}>{plot?.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Surface</Text>
          <Text style={styles.infoValue}>{plot?.area?.toFixed(2)} ha</Text>
        </View>
      </View>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Culture principale</Text>
          <Text style={styles.infoValue}>{plot?.variety || 'N/A'}</Text>
        </View>
      </View>
       <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Localisation</Text>
          <Text style={styles.infoValue}>{plot?.location || 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Statut</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${currentStatus.color}20` }]}>
            <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.text}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Dernière synchro</Text>
          <Text style={styles.infoValue}>Il y a 2h</Text>
        </View>
      </View>
    </View>
  );
};

const IntervenantsCard = ({ plotId, router }: { plotId: string; router: any }) => {
  const [participants, setParticipants] = useState<ParticipantDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const data = await CollecteService.getParticipantsByPlotId(plotId);
      setParticipants(data);
    } catch (error) {
      console.error("Failed to fetch participants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [plotId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchParticipants();
    }, [plotId])
  );

  const getTagStyle = (tag: string) => {
    if (tag.toLowerCase().includes('alpha')) return styles.tagGreen;
    if (tag.toLowerCase().includes('wolof')) return styles.tagBlue;
    return styles.tagGray;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Intervenants</Text>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/parcelles/${plotId}/intervenants`)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator />
      ) : participants.length === 0 ? (
        <Text style={styles.noDataText}>Aucun intervenant pour cette parcelle.</Text>
      ) : (
        participants.map(item => (
          <View key={item.id} style={styles.intervenantItem}>
            <Image source={{ uri: `https://i.pravatar.cc/150?u=${item.id}` }} style={styles.avatar} />
            <View style={styles.intervenantInfo}>
              <Text style={styles.intervenantName}>{item.name}</Text>
              <Text style={styles.intervenantRole}>{item.role}{item.age ? ` • ${item.age} ans` : ''}</Text>
            </View>
            {item.tags[0] && <Text style={[styles.tag, getTagStyle(item.tags[0])]}>{item.tags[0]}</Text>}
          </View>
        ))
      )}
    </View>
  );
};

const ConseilsCard = ({ plotId }: { plotId: string }) => {
  const [recommendations, setRecommendations] = useState<RecommendationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await CollecteService.getRecommendationsByPlotId(plotId);
        setRecommendations(data);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [plotId]);

  const getStatusStyle = (status: string) => {
    if (status.toLowerCase() === 'completed') return { container: styles.statusGreen, text: styles.statusTextGreen };
    if (status.toLowerCase() === 'acknowledged') return { container: styles.statusBlue, text: styles.statusTextBlue };
    return { container: styles.statusGray, text: styles.statusTextGray };
  };

  const RecommendationItem = ({ item }: { item: RecommendationDisplay }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={styles.conseilItem}>
        <Feather name="info" size={24} color="#3D944B" />
        <View style={styles.conseilContent}>
          <View style={styles.conseilHeader}>
            <Text style={styles.conseilTitle}>{item.title}</Text>
            <View style={statusStyle.container}><Text style={statusStyle.text}>{item.status}</Text></View>
          </View>
          <Text style={styles.conseilMessage}>{item.message}</Text>
          <Text style={styles.conseilDate}>{item.date}</Text>
        </View>
      </View>
    );
  };
  
  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Conseils & Recommandations</Text>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/parcelles/${plotId}/conseils/add`)}>
          <Feather name="plus-circle" size={24} color="#3D944B" />
        </TouchableOpacity>
      </View>
      {recommendations.length === 0 ? (
        <Text style={styles.noDataText}>Aucun conseil pour cette parcelle.</Text>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={({ item }) => <RecommendationItem item={item} />}
          keyExtractor={(item) => item.id}
          scrollEnabled={false} // Disable scroll for FlatList inside ScrollView
        />
      )}
    </View>
  );
};

const LatestConseilsCard = ({ plotId, onSeeAll }: { plotId: string; onSeeAll: () => void }) => {
  const [recommendations, setRecommendations] = useState<RecommendationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setLoading(true);
        const data = await CollecteService.getLatestRecommendations(plotId);
        setRecommendations(data);
      } catch (error) {
        console.error("Failed to fetch latest recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [plotId]);

  const renderItem = ({ item }: { item: RecommendationDisplay }) => (
    <View style={styles.conseilItem}>
      <Feather name="info" size={20} color="#3D944B" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.conseilTitle}>{item.title}</Text>
        <Text style={styles.conseilMessage}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Derniers Conseils</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllButton}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }} />
      ) : recommendations.length === 0 ? (
        <Text style={styles.emptyText}>Aucun conseil pour le moment.</Text>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const LatestOperationsCard = ({ plotId, onSeeAll }: { plotId: string; onSeeAll: () => void }) => {
  const [operations, setOperations] = useState<OperationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOps = async () => {
    try {
      setLoading(true);
      const data = await CollecteService.getLatestOperations(plotId);
      setOperations(data);
    } catch (error) {
      console.error("Failed to fetch latest operations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOps();
  }, [plotId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchOps();
    }, [plotId])
  );

  const renderItem = ({ item }: { item: OperationDisplay }) => {
    const iconName = operationIcons[item.type] || 'settings';
    return (
      <View style={styles.operationItem}>
        <View style={styles.operationIconContainer}>
          <Feather name={iconName} size={24} color="#3D944B" />
        </View>
        <View style={styles.operationDetails}>
          <Text style={styles.operationType}>{item.type}</Text>
          <Text style={styles.operationDate}>Par {item.author} le {item.date}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Dernières Opérations</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllButton}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }} />
      ) : operations.length === 0 ? (
        <Text style={styles.emptyText}>Aucune opération récente.</Text>
      ) : (
        <FlatList
          data={operations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const LatestObservationsCard = ({ plotId, onSeeAll }: { plotId: string; onSeeAll: () => void }) => {
  const [observations, setObservations] = useState<ObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchObs = async () => {
    try {
      setLoading(true);
      const data = await CollecteService.getLatestObservations(plotId);
      setObservations(data);
    } catch (error) {
      console.error("Failed to fetch latest observations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObs();
  }, [plotId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchObs();
    }, [plotId])
  );

  const renderItem = ({ item }: { item: ObservationDisplay }) => (
    <View style={styles.observationItem}>
      <Feather name="eye" size={20} color="#3D944B" style={{ marginRight: 12, marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.observationTitle}>{item.title}</Text>
        <Text style={styles.observationDate}>Par {item.author} le {item.date}</Text>
        <Text style={styles.observationDescription}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Dernières Observations</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllButton}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }} />
      ) : observations.length === 0 ? (
        <Text style={styles.emptyText}>Aucune observation récente.</Text>
      ) : (
        <FlatList
          data={observations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const ActiveCropCard = ({ crop }: { crop: Crop | null }) => {
  if (!crop) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Culture Active</Text>
        <Text style={styles.emptyText}>Aucune culture active sur cette parcelle.</Text>
      </View>
    );
  }

  const InfoItem = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Culture Active</Text>
      <View style={styles.infoGrid}>
        <InfoItem label="Type" value={crop.crop_type} />
        <InfoItem label="Variété" value={crop.variety} />
        <InfoItem label="Date de semis" value={new Date(crop.sowing_date).toLocaleDateString('fr-FR')} />
        <InfoItem label="Statut" value={crop.status} />
      </View>
    </View>
  );
};

const LatestIntrantsCard = ({ plotId, onSeeAll }: { plotId: string; onSeeAll: () => void }) => {
  const [inputs, setInputs] = useState<InputDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInputs = async () => {
    try {
      setLoading(true);
      const data = await CollecteService.getLatestInputs(plotId);
      setInputs(data);
    } catch (error) {
      console.error("Failed to fetch latest inputs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInputs();
  }, [plotId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchInputs();
    }, [plotId])
  );

  const renderItem = ({ item }: { item: InputDisplay }) => {
    const iconName = inputIcons[item.category.toLowerCase()] || 'package';
    return (
      <View style={styles.intrantItem}>
        <View style={styles.intrantIconContainer}>
          <Feather name={iconName} size={20} color="#3D944B" />
        </View>
        <View style={styles.intrantDetails}>
          <Text style={styles.intrantCategory}>{item.category}</Text>
          <Text style={styles.intrantQuantity}>{item.quantity} {item.unit}</Text>
        </View>
        <Text style={styles.intrantDate}>{item.date}</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Derniers Intrants</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllButton}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }}/>
      ) : inputs.length === 0 ? (
        <Text style={styles.emptyText}>Aucun intrant récent.</Text>
      ) : (
        <FlatList
          data={inputs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const operationIcons: { [key: string]: keyof typeof Feather.glyphMap } = {
  sowing: 'feather',
  fertilization: 'droplet',
  irrigation: 'cloud-drizzle',
  weeding: 'scissors',
  pesticide: 'shield',
  harvest: 'gift',
  tillage: 'grid',
  scouting: 'search',
  default: 'tool',
};


const OperationsCard = ({ plotId }: { plotId: string }) => {
  const router = useRouter();
  const [operations, setOperations] = useState<OperationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOperations = async () => {
      try {
        setLoading(true);
        const data = await CollecteService.getOperationsByPlotId(plotId);
        setOperations(data);
      } catch (error) {
        console.error("Failed to fetch operations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOperations();
  }, [plotId]);
  
  const renderItem = ({ item }: { item: OperationDisplay }) => {
    const iconName = operationIcons[item.type] || operationIcons.default;
    
    return (
      <View style={styles.operationItem}>
        <View style={styles.operationIconContainer}>
          <Feather name={iconName} size={24} color="#3D944B" />
        </View>
        <View style={styles.operationDetails}>
          <Text style={styles.operationType}>{item.type}</Text>
          <Text style={styles.operationDate}>{item.date} {item.author && `par ${item.author}`}</Text>
          {item.product && <Text style={styles.operationProduct}>Produit: {item.product}</Text>}
          {item.description && <Text style={styles.operationDescription}>{item.description}</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Opérations Agricoles</Text>
        <TouchableOpacity onPress={() => router.push(`/parcelles/${plotId}/operations/add`)}>
          <Feather name="plus-circle" size={24} color="#3D944B" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }}/>
      ) : operations.length === 0 ? (
        <Text style={styles.emptyText}>Aucune opération enregistrée pour cette parcelle.</Text>
      ) : (
        <FlatList
          data={operations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const inputIcons: { [key: string]: keyof typeof Feather.glyphMap } = {
  semence: 'sun',
  engrais: 'trending-up',
  pesticide: 'shield',
  herbicide: 'slash',
  autre: 'package',
};


const IntrantsCard = ({ plotId }: { plotId: string }) => {
  const [inputs, setInputs] = useState<InputDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchInputs = async () => {
      try {
        setLoading(true);
        const data = await CollecteService.getInputsByPlotId(plotId);
        setInputs(data);
      } catch (error) {
        console.error("Failed to fetch inputs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInputs();
  }, [plotId]);

  const renderItem = ({ item }: { item: InputDisplay }) => {
    const iconName = inputIcons[item.category.toLowerCase()] || 'package';
    return (
      <View style={styles.intrantItem}>
        <View style={styles.intrantIconContainer}>
          <Feather name={iconName} size={24} color="#3D944B" />
        </View>
        <View style={styles.intrantDetails}>
          <Text style={styles.intrantCategory}>{item.category}</Text>
          <Text style={styles.intrantLabel}>{item.label}</Text>
          <Text style={styles.intrantQuantity}>{item.quantity} {item.unit}</Text>
        </View>
        <Text style={styles.intrantDate}>{item.date}</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Intrants</Text>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/parcelles/${plotId}/intrants/add`)}>
          <Feather name="plus-circle" size={24} color="#3D944B" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }}/>
      ) : inputs.length === 0 ? (
        <Text style={styles.emptyText}>Aucun intrant enregistré.</Text>
      ) : (
        <FlatList
          data={inputs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};


const ParcelleDashboardScreen: React.FC = () => {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [plot, setPlot] = useState<PlotDisplay | null>(null);
  const [activeCrop, setActiveCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Infos');

  useEffect(() => {
    if (plotId && user?.id) {
      const loadData = async () => {
        try {
          setLoading(true);
          const plotData = await CollecteService.getPlotById(plotId, user.id);
          setPlot(plotData);

          let cropData = await CollecteService.getActiveCropByPlotId(plotId);
          
          if (!cropData) {
            console.log(`🌽 Aucune culture active trouvée. Tentative de création d'une culture par défaut...`);
            const currentSeason = await CollecteService.getCurrentSeason();
            if (currentSeason) {
              console.log(`📅 Utilisation de la saison active: ${currentSeason.name} (${currentSeason.id})`);
              const newCrop = await CollecteService.createCrop({
                plot_id: plotId,
                season_id: currentSeason.id,
                crop_type: 'Maize',
                variety: 'Default Variety',
                sowing_date: new Date().toISOString(),
                status: 'en_cours',
                created_by: plotData?.createdBy || undefined,
              }, user?.id);
              cropData = newCrop;
            } else {
              console.warn("⚠️ Impossible de créer une culture par défaut : aucune saison active n'a été trouvée.");
            }
          }
          
          setActiveCrop(cropData);

        } catch (err) {
          console.error("Failed to load plot data:", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [plotId]);

  const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[styles.tab, isActive && styles.activeTab]}>
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" />;
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        <View style={styles.headerImageContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x200.png/a3e6bd/ffffff?text=Photo+Parcelle' }} 
            style={styles.headerImage} 
          />
          <View style={styles.headerOverlay}>
            <Text style={styles.headerTitle}>{plot?.producerName} / {plot?.name}</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{plot?.area?.toFixed(2)} ha</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          <TabButton title="Infos" isActive={activeTab === 'Infos'} onPress={() => setActiveTab('Infos')} />
          <TabButton title="Intrants" isActive={activeTab === 'Intrants'} onPress={() => setActiveTab('Intrants')} />
          <TabButton title="Opérations" isActive={activeTab === 'Opérations'} onPress={() => setActiveTab('Opérations')} />
          <TabButton title="Observations" isActive={activeTab === 'Observations'} onPress={() => setActiveTab('Observations')} />
          <TabButton title="Conseils" isActive={activeTab === 'Conseils'} onPress={() => setActiveTab('Conseils')} />
        </ScrollView>

        {activeTab === 'Infos' && (
          <View style={styles.contentContainer}>
            {plot && <InfoCard plot={plot} />}
            {plot && <ActiveCropCard crop={activeCrop} />}
            {plot && <IntervenantsCard plotId={plot.id} router={router} />}
            {plot && <LatestIntrantsCard plotId={plot.id} onSeeAll={() => setActiveTab('Intrants')} />}
            {plot && <LatestOperationsCard plotId={plot.id} onSeeAll={() => setActiveTab('Opérations')} />}
            {plot && <LatestObservationsCard plotId={plot.id} onSeeAll={() => setActiveTab('Observations')} />}
            {plot && <LatestConseilsCard plotId={plot.id} onSeeAll={() => setActiveTab('Conseils')} />}
          </View>
        )}
        {activeTab === 'Conseils' && (
          <View style={styles.contentContainer}>
            {plot && <ConseilsCard plotId={plot.id} />}
          </View>
        )}
        {activeTab === 'Opérations' && (
          <View style={styles.contentContainer}>
            {plot && <OperationsCard plotId={plot.id} />}
          </View>
        )}
        {activeTab === 'Observations' && (
          <View style={styles.contentContainer}>
            {plot && <LatestObservationsCard plotId={plot.id} onSeeAll={() => setActiveTab('Observations')} />}
          </View>
        )}
        {activeTab === 'Intrants' && (
          <View style={styles.contentContainer}>
            {plot && <IntrantsCard plotId={plot.id} />}
          </View>
        )}
        {/* Other tabs content will go here */}
      </ScrollView>
      <TouchableOpacity style={styles.fab}>
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  headerImageContainer: { height: 200 },
  headerImage: { width: '100%', height: '100%' },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: { color: '#111827', fontWeight: 'bold', fontSize: 12 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3D944B',
  },
  tabText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#3D944B',
  },
  content: {
    padding: 16,
  },
  contentContainer: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3D944B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtnText: {
    color: '#3D944B',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  intervenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  intervenantInfo: {
    flex: 1,
  },
  intervenantName: {
    fontWeight: '600',
    color: '#1f2937',
  },
  intervenantRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  tag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tagBlue: {
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
  },
  tagGreen: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  tagGray: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 16,
  },
  conseilItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  conseilContent: { flex: 1, marginLeft: 12 },
  conseilHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  conseilTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  conseilMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  conseilDate: { fontSize: 12, color: '#9ca3af' },
  statusGray: { backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusTextGray: { color: '#4b5563', fontSize: 10, fontWeight: 'bold' },
  statusBlue: { backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusTextBlue: { color: '#0284c7', fontSize: 10, fontWeight: 'bold' },
  statusGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusTextGreen: { color: '#16a34a', fontSize: 10, fontWeight: 'bold' },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  operationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eefdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  operationDetails: {
    flex: 1,
  },
  operationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  operationDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  operationProduct: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    fontStyle: 'italic',
  },
  operationDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  intrantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  intrantIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eefdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  intrantDetails: {
    flex: 1,
  },
  intrantCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  intrantLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  intrantQuantity: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  intrantDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  seeAllButton: {
    color: '#3D944B',
    fontWeight: '600',
    fontSize: 14,
  },
  observationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  observationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  observationDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 4,
  },
  observationDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default ParcelleDashboardScreen;
