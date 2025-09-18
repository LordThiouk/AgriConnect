import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Cooperative } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Building2Icon, UsersIcon, MapPinIcon, EyeIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CooperativesMapProps {
  cooperatives: Cooperative[];
  onCooperativeSelect: (cooperative: Cooperative) => void;
  selectedCooperative?: Cooperative | null;
  loading?: boolean;
}

// Component to handle map updates when cooperatives change
function MapUpdater({ cooperatives }: { cooperatives: Cooperative[] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (cooperatives.length > 0) {
      // Calculate bounds to fit all cooperatives
      const bounds = cooperatives
        .filter(coop => coop.latitude && coop.longitude)
        .map(coop => [coop.latitude!, coop.longitude!] as [number, number]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [cooperatives, map]);

  return null;
}

export default function CooperativesMap({
  cooperatives,
  onCooperativeSelect,
  selectedCooperative,
  loading = false
}: CooperativesMapProps) {
  // Default center (Dakar, Senegal)
  const defaultCenter: [number, number] = [14.7167, -17.4677];
  const defaultZoom = 6;

  // Filter cooperatives with valid coordinates
  const cooperativesWithCoords = cooperatives.filter(
    coop => coop.latitude && coop.longitude && 
           !isNaN(Number(coop.latitude)) && !isNaN(Number(coop.longitude)) &&
           Number(coop.latitude) >= -90 && Number(coop.latitude) <= 90 &&
           Number(coop.longitude) >= -180 && Number(coop.longitude) <= 180
  );


  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </CardContent>
      </Card>
    );
  }

  if (cooperativesWithCoords.length === 0) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="p-8 text-center">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune localisation disponible</h3>
          <p className="text-gray-600 mb-4">
            Les coopératives n'ont pas encore de coordonnées GPS définies.
          </p>
          <p className="text-sm text-gray-500">
            {cooperatives.length} coopérative{cooperatives.length > 1 ? 's' : ''} trouvée{cooperatives.length > 1 ? 's' : ''} sans coordonnées.
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
            <MapPinIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Carte des coopératives
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {cooperativesWithCoords.length} sur {cooperatives.length} coopératives
          </Badge>
        </div>
      </div>
      <CardContent className="p-0 h-full">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater cooperatives={cooperativesWithCoords} />
          
          {cooperativesWithCoords.map((cooperative, index) => {
            const isSelected = selectedCooperative?.id === cooperative.id;
            return (
              <Marker
                key={cooperative.id}
                position={[cooperative.latitude!, cooperative.longitude!]}
                eventHandlers={{
                  click: () => onCooperativeSelect(cooperative),
                }}
              >
              <Popup className="cooperative-popup">
                <div className="min-w-[250px] p-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2Icon className={`h-5 w-5 ${isSelected ? 'text-green-600' : 'text-blue-600'}`} />
                      <h3 className={`font-semibold text-sm ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                        {cooperative.name}
                        {isSelected && <span className="ml-2 text-xs">✓ Sélectionnée</span>}
                      </h3>
                    </div>
                    <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                      ID: {cooperative.id.slice(0, 8)}...
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{cooperative.region}, {cooperative.department}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <UsersIcon className="h-4 w-4" />
                      <span>{cooperative.producer_count || 0} producteurs</span>
                    </div>
                    
                    {cooperative.commune && (
                      <div className="text-gray-600">
                        <span className="font-medium">Commune:</span> {cooperative.commune}
                      </div>
                    )}
                    
                    {cooperative.description && (
                      <div className="text-gray-600 text-xs">
                        <span className="font-medium">Description:</span> {cooperative.description}
                      </div>
                    )}
                    
                    <div className="text-gray-500 text-xs">
                      <span className="font-medium">Coordonnées:</span> {cooperative.latitude?.toFixed(4)}, {cooperative.longitude?.toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => onCooperativeSelect(cooperative)}
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
