import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MapPin, ZoomIn, Layers, Navigation } from 'lucide-react';

interface MapPanelProps {
  plotCount?: number;
  onViewMap?: () => void;
}

const MapPanel: React.FC<MapPanelProps> = ({ plotCount = 0, onViewMap }) => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <MapPin className="h-5 w-5 mr-2 text-green-600" />
          Carte des parcelles
        </CardTitle>
        <p className="text-sm text-gray-500">
          Géolocalisation des parcelles agricoles
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Placeholder pour la carte */}
          <div className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carte interactive
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {plotCount} parcelle{plotCount > 1 ? 's' : ''} enregistrée{plotCount > 1 ? 's' : ''}
              </p>
              <Button 
                onClick={onViewMap}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Ouvrir la carte
              </Button>
            </div>
          </div>

          {/* Contrôles de la carte */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom
            </Button>
            <Button variant="outline" size="sm">
              <Layers className="h-4 w-4 mr-2" />
              Couches
            </Button>
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Marqueurs
            </Button>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{plotCount}</div>
              <div className="text-sm text-gray-500">Parcelles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-500">Régions</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPanel;
