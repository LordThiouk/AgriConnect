import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Plot } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Users, Eye, Droplets, Thermometer } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Type assertions pour résoudre le conflit de types
const MapPinIcon = MapPin as any;
const UsersIcon = Users as any;
const EyeIcon = Eye as any;
const DropletsIcon = Droplets as any;
const ThermometerIcon = Thermometer as any;

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

interface PlotsLeafletMapProps {
  plots: Plot[];
  onPlotSelect: (plot: Plot) => void;
  selectedPlot?: Plot | null;
  loading?: boolean;
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

export default function PlotsLeafletMap({
  plots,
  onPlotSelect,
  selectedPlot,
  loading = false
}: PlotsLeafletMapProps) {
  // Default center (Dakar, Senegal)
  const defaultCenter: [number, number] = [14.7167, -17.4677];
  const defaultZoom = 6;

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
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'abandoned':
        return 'Abandonné';
      default:
        return 'Inconnu';
    }
  };

  const getSoilTypeLabel = (soilType?: string) => {
    const labels: Record<string, string> = {
      'sandy': 'Sableux',
      'clay': 'Argileux',
      'loam': 'Limoneux',
      'silt': 'Silt',
      'organic': 'Organique',
      'other': 'Autre'
    };
    return soilType ? labels[soilType] || soilType : 'Non spécifié';
  };

  const getWaterSourceLabel = (waterSource?: string) => {
    const labels: Record<string, string> = {
      'rain': 'Pluie',
      'irrigation': 'Irrigation',
      'well': 'Puits',
      'river': 'Rivière',
      'other': 'Autre'
    };
    return waterSource ? labels[waterSource] || waterSource : 'Non spécifiée';
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </CardContent>
      </Card>
    );
  }

  if (plotsWithCoords.length === 0) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="p-8 text-center">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune parcelle disponible</h3>
          <p className="text-gray-600 mb-4">
            Aucune parcelle n'a été trouvée pour affichage sur la carte.
          </p>
          <p className="text-sm text-gray-500">
            {plots.length} parcelle{plots.length > 1 ? 's' : ''} trouvée{plots.length > 1 ? 's' : ''} sans coordonnées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] overflow-hidden">
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Carte des parcelles
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {plotsWithCoords.length} parcelle{plotsWithCoords.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
      <CardContent className="p-0 h-full">
        <MapContainerComponent
          center={defaultCenter}
          zoom={defaultZoom}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayerComponent
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater plots={plotsWithCoords} />
          
          {plotsWithCoords.map((plot) => {
            const isSelected = selectedPlot?.id === plot.id;
            return (
              <MarkerComponent
                key={plot.farm_file_plot_id || plot.id}
                position={[plot.latitude!, plot.longitude!]}
                eventHandlers={{
                  click: () => onPlotSelect(plot),
                }}
              >
                <PopupComponent className="plot-popup">
                  <div className="min-w-[280px] p-2">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className={`h-5 w-5 ${isSelected ? 'text-green-600' : getStatusColor(plot.status)}`} />
                        <h3 className={`font-semibold text-sm ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                          {plot.name}
                          {isSelected && <span className="ml-2 text-xs">✓ Sélectionnée</span>}
                        </h3>
                      </div>
                      <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                        {getStatusLabel(plot.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {plot.producer && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <UsersIcon className="h-4 w-4" />
                          <span>{plot.producer.first_name} {plot.producer.last_name}</span>
                        </div>
                      )}
                      
                      {plot.area_hectares && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{plot.area_hectares} hectares</span>
                        </div>
                      )}
                      
                      {plot.soil_type && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <ThermometerIcon className="h-4 w-4" />
                          <span>{getSoilTypeLabel(plot.soil_type)}</span>
                        </div>
                      )}
                      
                      {plot.water_source && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DropletsIcon className="h-4 w-4" />
                          <span>{getWaterSourceLabel(plot.water_source)}</span>
                        </div>
                      )}
                      
                      {plot.producer?.region && (
                        <div className="text-gray-600">
                          <span className="font-medium">Région:</span> {plot.producer.region}
                        </div>
                      )}
                      
                      {plot.notes && (
                        <div className="text-gray-600 text-xs">
                          <span className="font-medium">Notes:</span> {plot.notes}
                        </div>
                      )}
                      
                      <div className="text-gray-500 text-xs">
                        <span className="font-medium">Coordonnées:</span> {plot.latitude?.toFixed(4)}, {plot.longitude?.toFixed(4)}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => onPlotSelect(plot)}
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                </PopupComponent>
              </MarkerComponent>
            );
          })}
        </MapContainerComponent>
      </CardContent>
    </Card>
  );
}
