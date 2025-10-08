import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MapPin, Map, Navigation, Search, BookOpen, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PlotsService } from '../../services/plotsService';

// Type assertions pour résoudre le conflit de types
const MapPinIcon = MapPin as any;
const MapIcon = Map as any;
const NavigationIcon = Navigation as any;
const SearchIcon = Search as any;
const BookOpenIcon = BookOpen as any;
const RefreshCwIcon = RefreshCw as any;

// Type assertions pour les composants React Leaflet
const MapContainerComponent = MapContainer as any;
const TileLayerComponent = TileLayer as any;
const MarkerComponent = Marker as any;
const PopupComponent = Popup as any;

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Plot {
  plot_id: string;
  name: string;
  area_hectares: number;
  latitude: number | null;
  longitude: number | null;
  status: string;
  soil_type?: string;
  water_source?: string;
  producer_first_name?: string;
  producer_last_name?: string;
  producer_region?: string;
  cooperative_name?: string;
  producer_name?: string;
}

interface MapPanelProps {
  plotCount?: number;
  onViewMap?: () => void;
}

// Component to handle map updates when plots change
function MapUpdater({ plots }: { plots: Plot[] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (plots.length > 0) {
      // Calculate bounds to fit all plots with valid coordinates
      const bounds = plots
        .filter(plot => 
          plot.latitude !== null && 
          plot.latitude !== undefined && 
          plot.longitude !== null && 
          plot.longitude !== undefined
        )
        .map(plot => [plot.latitude!, plot.longitude!] as [number, number]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [plots, map]);

  return null;
}

const MapPanel: React.FC<MapPanelProps> = ({ plotCount = 0, onViewMap }) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Default center (Dakar, Senegal)
  const defaultCenter: [number, number] = [14.7167, -17.4677];
  const defaultZoom = 6;

  useEffect(() => {
    fetchPlotsWithGeo();
  }, []);

  const fetchPlotsWithGeo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const plotsData = await PlotsService.getPlotsWithGeolocation();
      setPlots((plotsData || []) as unknown as Plot[]);
    } catch (err) {
      console.error('Error fetching plots with geolocation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des parcelles');
    } finally {
      setLoading(false);
    }
  };

  // Filter plots with valid coordinates
  const plotsWithCoords = plots.filter(plot => 
    plot.latitude !== null && 
    plot.latitude !== undefined && 
    plot.longitude !== null && 
    plot.longitude !== undefined
  ).map(plot => ({
    ...plot,
    latitude: plot.latitude!,
    longitude: plot.longitude!
  }));

  // Fonction de filtrage par recherche
  const filteredPlots = plotsWithCoords.filter(plot => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (plot.name || '').toLowerCase().includes(query) ||
      (plot.soil_type || '').toLowerCase().includes(query) ||
      (plot.water_source || '').toLowerCase().includes(query) ||
      (plot.producer_first_name || '').toLowerCase().includes(query) ||
      (plot.producer_last_name || '').toLowerCase().includes(query) ||
      (plot.producer_region || '').toLowerCase().includes(query) ||
      (plot.status || '').toLowerCase().includes(query)
    );
  });

  // Fonction de gestion de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-yellow-600';
      case 'abandoned':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'abandoned':
        return 'Abandonnée';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <MapPinIcon className="h-5 w-5 text-green-600 mr-2" />
              Carte des parcelles
            </CardTitle>
            <p className="text-sm text-gray-500">
              {filteredPlots.length} parcelle{filteredPlots.length > 1 ? 's' : ''} géolocalisée{filteredPlots.length > 1 ? 's' : ''}
              {searchQuery && (
                <span className="text-blue-600 font-medium">
                  {' '}(recherche: "{searchQuery}")
                </span>
              )}
              {searchQuery && ` (${plotsWithCoords.length} total)`}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              onClick={() => setShowSearchModal(true)}
              variant="outline"
              size="sm"
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            <Button 
              onClick={fetchPlotsWithGeo}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Vraie carte Leaflet */}
          <div className="relative rounded-lg border border-gray-200 h-64 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <RefreshCwIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Chargement de la carte...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center bg-red-50">
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-2">Erreur de chargement</p>
                  <Button onClick={fetchPlotsWithGeo} size="sm" variant="outline">
                    Réessayer
                  </Button>
                </div>
              </div>
            ) : filteredPlots.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MapPinIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune parcelle géolocalisée</p>
                </div>
              </div>
            ) : (
              <MapContainerComponent
                center={defaultCenter}
                zoom={defaultZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayerComponent
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater plots={filteredPlots} />
                
                {filteredPlots.map((plot, index) => (
                  <MarkerComponent
                    key={plot.plot_id || `plot-${index}-${plot.latitude}-${plot.longitude}`}
                    position={[plot.latitude, plot.longitude]}
                  >
                    <PopupComponent>
                      <div className="p-3 min-w-[250px]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {plot.name || 'Parcelle sans nom'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(plot.status)}`}>
                            {getStatusLabel(plot.status)}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Surface:</span>
                            <span className="font-medium">{plot.area_hectares} ha</span>
                          </div>
                          {plot.soil_type && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type de sol:</span>
                              <span className="font-medium">{plot.soil_type}</span>
                            </div>
                          )}
                          {plot.water_source && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Source d'eau:</span>
                              <span className="font-medium">{plot.water_source}</span>
                            </div>
                          )}
                          {(plot.producer_first_name || plot.producer_last_name) && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Producteur:</span>
                              <span className="font-medium">
                                {plot.producer_first_name || ''} {plot.producer_last_name || ''}
                              </span>
                            </div>
                          )}
                          {plot.producer_region && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Région:</span>
                              <span className="font-medium">{plot.producer_region}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Statut:</span>
                            <span className="font-medium">{getStatusLabel(plot.status)}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            📍 {plot.latitude.toFixed(4)}, {plot.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </PopupComponent>
                  </MarkerComponent>
                ))}
              </MapContainerComponent>
            )}
          </div>

          

          {/* Statistiques rapides */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{filteredPlots.length}</div>
              <div className="text-sm text-gray-500">Parcelles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(filteredPlots.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0) * 100) / 100}
              </div>
              <div className="text-sm text-gray-500">Hectares</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredPlots.filter(plot => plot.status === 'active').length}
              </div>
              <div className="text-sm text-gray-500">Actives</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Modal de recherche */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Rechercher des parcelles</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot-clé de recherche
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nom de parcelle, type de sol, source d'eau, producteur, région..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="text-sm text-gray-500">
                Recherche dans : nom de parcelle, type de sol, source d'eau, producteur, région, statut
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => setShowSearchModal(false)}
                  variant="outline"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchModal(false);
                  }}
                >
                  Effacer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
};

export default MapPanel;
