import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapPin, Package } from 'lucide-react';
import { FarmFilesService, ProducerPlot, ProducerCrop } from '../../services/farmFilesService';

// Type assertions pour résoudre le conflit de types
const MapPinIcon = MapPin as any;
const PackageIcon = Package as any;

interface PlotCropSelectorProps {
  producerId: string;
  onPlotSelect: (plotId: string | null) => void;
  onCropSelect: (cropId: string | null) => void;
  selectedPlotId?: string | null;
  selectedCropId?: string | null;
}

// Utiliser les interfaces du service
type Plot = ProducerPlot;
type Crop = ProducerCrop;

const PlotCropSelector: React.FC<PlotCropSelectorProps> = ({
  producerId,
  onPlotSelect,
  onCropSelect,
  selectedPlotId,
  selectedCropId
}) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlots();
  }, [producerId]);

  useEffect(() => {
    if (selectedPlotId) {
      fetchCrops(selectedPlotId);
    } else {
      setCrops([]);
      onCropSelect(null);
    }
  }, [selectedPlotId]);

  const fetchPlots = async () => {
    try {
      setLoading(true);
      // Récupérer les vraies parcelles du producteur
      const producerPlots = await FarmFilesService.getProducerPlots(producerId);
      setPlots(producerPlots);
    } catch (error) {
      console.error('Error fetching plots:', error);
      setPlots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCrops = async (plotId: string) => {
    try {
      // Récupérer les vraies cultures de la parcelle
      const plotCrops = await FarmFilesService.getPlotCrops(plotId);
      setCrops(plotCrops);
    } catch (error) {
      console.error('Error fetching crops:', error);
      setCrops([]);
    }
  };

  const handlePlotChange = (plotId: string) => {
    onPlotSelect(plotId);
  };

  const handleCropChange = (cropId: string) => {
    onCropSelect(cropId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Chargement des parcelles...</p>
        </CardContent>
      </Card>
    );
  }

  if (plots.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <MapPinIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune parcelle trouvée pour ce producteur.</p>
            <p className="text-xs mt-1">Veuillez d'abord créer des fiches d'exploitation avec des parcelles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPinIcon className="h-5 w-5" />
          Sélection de parcelle et culture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="plot-select">Parcelle *</Label>
          <Select value={selectedPlotId || ''} onValueChange={handlePlotChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une parcelle" />
            </SelectTrigger>
            <SelectContent>
              {plots.map(plot => (
                <SelectItem key={plot.id} value={plot.id}>
                  {plot.name_season_snapshot} ({plot.area_hectares} ha)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlotId && (
          <div>
            <Label htmlFor="crop-select">Culture *</Label>
            <Select value={selectedCropId || ''} onValueChange={handleCropChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une culture" />
              </SelectTrigger>
              <SelectContent>
                {crops.map(crop => (
                  <SelectItem key={crop.id} value={crop.id}>
                    <div className="flex items-center gap-2">
                      <PackageIcon className="h-4 w-4" />
                      {crop.crop_type} - {crop.variety}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedPlotId && selectedCropId && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              ✅ Parcelle et culture sélectionnées. Vous pouvez maintenant créer une opération ou observation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlotCropSelector;
