import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, BackHandler, TextInput } from 'react-native';
import { router, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { CollecteService } from '../../../lib/services/collecte';
import type { PlotDisplay } from '../../../types/collecte';
import { Feather } from '@expo/vector-icons';
import MapComponent from '../../../components/MapComponent';
import ContentWithHeader from '../../../components/ContentWithHeader';

const PlotCard = ({ item }: { item: PlotDisplay }) => {
  const router = useRouter();
  const statusConfig = {
    preparation: { text: 'En cours', color: '#10b981', icon: 'check-circle' as const, iconColor: '#10b981' },
    cultivated: { text: 'Récolté', color: '#f59e0b', icon: 'clock' as const, iconColor: '#f59e0b' },
    fallow: { text: 'Abandonné', color: '#ef4444', icon: 'alert-triangle' as const, iconColor: '#ef4444' },
  };
  const currentStatus = statusConfig[item.status] || statusConfig.preparation;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.producerName}</Text>
          <Text style={styles.cardSubtitle}>ID: {item.name}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <View style={[styles.statusBadge, { backgroundColor: `${currentStatus.color}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
            <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.text}</Text>
          </View>
          <Feather name={currentStatus.icon} size={20} color={currentStatus.iconColor} style={{marginTop: 4}}/>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>Surface</Text>
          <Text style={styles.cardValue}>{item.area?.toFixed(2)} ha</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>Culture</Text>
          <Text style={styles.cardValue}>{item.variety || 'N/A'}</Text>
        </View>
      </View>

      <View>
        <Text style={styles.cardLabel}>Localisation</Text>
        <Text style={styles.cardValue}>{item.location || 'N/A'}</Text>
      </View>
      
      <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/parcelles/[plotId]', params: { plotId: item.id } })} style={styles.detailsBtn}>
        <Text style={styles.detailsBtnText}>Voir détails</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ParcellesListScreen() {
  const { isLoading: authLoading, userRole, user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [plots, setPlots] = useState<PlotDisplay[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    producer: '',
    region: '',
    culture: '',
    dateSemis: '',
    status: '',
    area: '',
    soilType: '',
    waterSource: ''
  });
  const [filteredPlots, setFilteredPlots] = useState<PlotDisplay[]>([]);
  const [availableProducers, setAvailableProducers] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableCultures, setAvailableCultures] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Gestion du bouton retour Android pour fermer le modal
  useEffect(() => {
    const backAction = () => {
      if (showDropdown) {
        setShowDropdown(null);
        return true; // Empêcher la fermeture de l'app
      }
      return false; // Permettre la fermeture de l'app
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showDropdown]);

  // Composant Dropdown pour les filtres
  const FilterDropdown = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    filterKey 
  }: { 
    label: string; 
    value: string; 
    options: string[]; 
    onSelect: (value: string) => void; 
    filterKey: string; 
  }) => {
    const isOpen = showDropdown === filterKey;
    const [localSearchText, setLocalSearchText] = useState<string>('');
    
    // Filtrer les options basées sur la recherche
    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(localSearchText.toLowerCase())
    );
    
    // Réinitialiser la recherche quand le modal s'ouvre
    const handleOpen = () => {
      setLocalSearchText('');
      setShowDropdown(isOpen ? null : filterKey);
    };
    
    return (
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>{label}:</Text>
        <TouchableOpacity 
          style={styles.filterInput}
          onPress={handleOpen}
        >
          <Text style={styles.filterInputText}>
            {value || `Tous les ${label.toLowerCase()}s`}
          </Text>
          <Feather 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#6b7280" 
          />
        </TouchableOpacity>
        
        {isOpen && (
          <Modal
            transparent={true}
            visible={isOpen}
            onRequestClose={() => setShowDropdown(null)}
            animationType="fade"
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(null)}
            >
              <TouchableOpacity 
                style={styles.dropdownContainer}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Sélectionner {label.toLowerCase()}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowDropdown(null)}
                    style={styles.closeButton}
                  >
                    <Feather name="x" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                {/* Champ de recherche pour les longues listes */}
                {options.length > 5 && (
                  <View style={styles.searchContainer}>
                    <Feather name="search" size={16} color="#6b7280" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={`Rechercher ${label.toLowerCase()}...`}
                      value={localSearchText}
                      onChangeText={setLocalSearchText}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                )}
                
                <FlatList
                  data={['', ...filteredOptions]}
                  keyExtractor={(item, index) => `${filterKey}-${index}`}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        index === 0 && styles.dropdownItemFirst,
                        item === value && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        onSelect(item);
                        setShowDropdown(null);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        item === value && styles.dropdownItemTextSelected
                      ]}>
                        {index === 0 ? `Tous les ${label.toLowerCase()}s` : item}
                      </Text>
                      {item === value && (
                        <Feather name="check" size={16} color="#3D944B" />
                      )}
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={true}
                  style={styles.dropdownList}
                  ListEmptyComponent={
                    <View style={styles.emptySearchContainer}>
                      <Text style={styles.emptySearchText}>
                        Aucun {label.toLowerCase()} trouvé
                      </Text>
                    </View>
                  }
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    );
  };

  // Chargement des parcelles et extraction des options de filtres
  useEffect(() => {
    const loadPlots = async () => {
      if (authLoading || userRole !== 'agent' || !user?.id) return;
      
      setLoading(true);
      try {
        const data = await CollecteService.getAgentPlots(user.id, {});
        setPlots(data);
        setFilteredPlots(data);

        // Extraire les options de filtres
        const producers = [...new Set(data.map(p => p.producerName))].sort();
        const regions = [...new Set(data.map(p => p.location).filter((loc): loc is string => Boolean(loc)))].sort();
        const cultures = [...new Set(data.map(p => p.variety).filter((cult): cult is string => Boolean(cult)))].sort();
        
        setAvailableProducers(producers);
        setAvailableRegions(regions);
        setAvailableCultures(cultures);
      } catch (error) {
        console.error('Erreur lors du chargement des parcelles:', error);
        setError('Erreur lors du chargement des parcelles');
      } finally {
        setLoading(false);
      }
    };
    
    loadPlots();
  }, [authLoading, userRole, user?.id]); // Dépendances correctes

  // Filtrage des parcelles
  useEffect(() => {
    let filtered = [...plots];

    if (filters.producer) {
      filtered = filtered.filter(p => p.producerName.toLowerCase().includes(filters.producer.toLowerCase()));
    }
    if (filters.region) {
      filtered = filtered.filter(p => p.location?.toLowerCase().includes(filters.region.toLowerCase()));
    }
    if (filters.culture) {
      filtered = filtered.filter(p => p.variety?.toLowerCase().includes(filters.culture.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.area) {
      const area = parseFloat(filters.area);
      if (!isNaN(area)) {
        filtered = filtered.filter(p => p.area >= area);
      }
    }
    if (filters.soilType) {
      filtered = filtered.filter(p => p.soilType?.toLowerCase().includes(filters.soilType.toLowerCase()));
    }
    if (filters.waterSource) {
      filtered = filtered.filter(p => p.waterSource?.toLowerCase().includes(filters.waterSource.toLowerCase()));
    }

    setFilteredPlots(filtered);
  }, [plots, filters]);

  if (authLoading || userRole !== 'agent' || !user?.id) {
    return (
      <View style={styles.center}> 
        <Text style={styles.info}>Onglet réservé aux agents.</Text>
      </View>
    );
  }

  return (
    <ContentWithHeader style={styles.container}>
      {/* Switch Liste/Carte + Filtre */}
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          onPress={() => setShowMap(false)} 
          style={[styles.toggleBtn, !showMap && styles.toggleActive]}
        >
          <Feather name="list" size={16} color={!showMap ? '#065f46' : '#6b7280'} />
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>Liste</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowMap(true)} 
          style={[styles.toggleBtn, showMap && styles.toggleActive]}
        >
          <Feather name="map" size={16} color={showMap ? '#065f46' : '#6b7280'} />
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Carte</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowFilters(!showFilters)} 
          style={[styles.filterBtn, showFilters && styles.filterActive]}
        >
          <Feather name="filter" size={16} color={showFilters ? '#065f46' : '#6b7280'} />
          <Text style={[styles.toggleText, showFilters && styles.toggleTextActive]}>Filtres</Text>
          </TouchableOpacity>
        </View>

      {/* Nombre de parcelles et filtres actifs */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredPlots.length} parcelle{filteredPlots.length > 1 ? 's' : ''} trouvée{filteredPlots.length > 1 ? 's' : ''}
        </Text>
        {Object.values(filters).some(f => f !== '') && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersText}>Filtres actifs:</Text>
            {filters.producer && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>Producteur: {filters.producer}</Text>
              </View>
            )}
            {filters.region && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>Région: {filters.region}</Text>
              </View>
            )}
            {filters.culture && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>Culture: {filters.culture}</Text>
              </View>
            )}
            {filters.status && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>Statut: {filters.status === 'preparation' ? 'Préparation' : 
                 filters.status === 'cultivated' ? 'Cultivé' : 'Jachère'}</Text>
              </View>
            )}
            {filters.area && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>Superficie: {filters.area} ha+</Text>
              </View>
            )}
            {filters.soilType && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>Sol: {filters.soilType}</Text>
              </View>
            )}
            {filters.waterSource && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>Eau: {filters.waterSource}</Text>
            </View>
            )}
          </View>
        )}
      </View>

      {/* Panneau de filtres */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filtersTitle}>Filtres</Text>
          
          {/* Filtre par producteur */}
          <FilterDropdown
            label="Producteur"
            value={filters.producer}
            options={availableProducers}
            onSelect={(value) => setFilters(prev => ({ ...prev, producer: value }))}
            filterKey="producer"
          />

          {/* Filtre par région */}
          <FilterDropdown
            label="Région"
            value={filters.region}
            options={availableRegions}
            onSelect={(value) => setFilters(prev => ({ ...prev, region: value }))}
            filterKey="region"
          />

          {/* Filtre par culture */}
          <FilterDropdown
            label="Culture"
            value={filters.culture}
            options={availableCultures}
            onSelect={(value) => setFilters(prev => ({ ...prev, culture: value }))}
            filterKey="culture"
          />

          {/* Filtre par statut */}
          <FilterDropdown
            label="Statut"
            value={filters.status === 'preparation' ? 'Préparation' : 
                   filters.status === 'cultivated' ? 'Cultivé' :
                   filters.status === 'fallow' ? 'Jachère' : ''}
            options={['Préparation', 'Cultivé', 'Jachère']}
            onSelect={(value) => {
              const statusMap: { [key: string]: string } = {
                'Préparation': 'preparation',
                'Cultivé': 'cultivated',
                'Jachère': 'fallow'
              };
              setFilters(prev => ({ ...prev, status: statusMap[value] || '' }));
            }}
            filterKey="status"
          />

          {/* Filtre par superficie */}
          <FilterDropdown
            label="Superficie min"
            value={filters.area ? `${filters.area} ha` : ''}
            options={['0.5 ha', '1 ha', '2 ha', '3 ha', '5 ha']}
            onSelect={(value) => {
              const area = value.replace(' ha', '');
              setFilters(prev => ({ ...prev, area }));
            }}
            filterKey="area"
          />

          {/* Filtre par type de sol */}
          <FilterDropdown
            label="Type de sol"
            value={filters.soilType}
            options={['Argileux', 'Sableux', 'Limoneux', 'Tourbeux']}
            onSelect={(value) => setFilters(prev => ({ ...prev, soilType: value }))}
            filterKey="soilType"
          />

          {/* Filtre par source d'eau */}
          <FilterDropdown
            label="Source d'eau"
            value={filters.waterSource}
            options={['Puits', 'Forage', 'Rivière', 'Pluie', 'Irrigation']}
            onSelect={(value) => setFilters(prev => ({ ...prev, waterSource: value }))}
            filterKey="waterSource"
          />

          {/* Boutons d'action */}
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.clearFiltersBtn}
              onPress={() => setFilters({
                producer: '',
                region: '',
                culture: '',
                dateSemis: '',
                status: '',
                area: '',
                soilType: '',
                waterSource: ''
              })}
            >
              <Text style={styles.clearFiltersText}>Effacer</Text>
          </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyFiltersBtn}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3D944B" />
          <Text style={styles.loadingText}>Chargement des parcelles...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : showMap ? (
          <MapComponent
            plots={filteredPlots}
          onPlotSelect={(plot) => router.push({ pathname: '/(tabs)/parcelles/[plotId]', params: { plotId: plot.id } })}
          />
      ) : (
        <FlatList
          data={filteredPlots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlotCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}> 
              <Text style={styles.info}>Aucune parcelle trouvée.</Text>
            </View>
          }
        />
      )}
    </ContentWithHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#065f46',
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  filterActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  filtersPanel: {
    backgroundColor: '#f9fafb', 
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    width: 80,
  },
  filterInput: {
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterInputText: {
    fontSize: 14,
    color: '#374151',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  clearFiltersBtn: {
    flex: 1, 
    backgroundColor: '#f3f4f6', 
    paddingVertical: 10, 
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  applyFiltersBtn: {
    flex: 1,
    backgroundColor: '#3D944B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  info: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  list: {
    padding: 8,
  },
  countContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  activeFiltersContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  activeFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D944B',
    marginRight: 8,
  },
  activeFilterTag: {
    backgroundColor: '#3D944B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemFirst: {
    backgroundColor: '#f9fafb',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0fdf4',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#3D944B',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 4,
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailsBtn: {
    backgroundColor: '#3D944B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  detailsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});