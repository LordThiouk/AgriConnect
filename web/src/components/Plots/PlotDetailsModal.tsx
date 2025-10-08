import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { useToast } from '../../context/ToastContext';
import { Plot, Crop, Operation } from '../../types';
import { PlotsService } from '../../services/plotsService';
import { OperationsService } from '../../services/operationsService';
import { 
  MapPin, 
  Droplets, 
  Thermometer, 
  TrendingUp, 
  Calendar,
  Activity,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface PlotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: Plot | null;
  onEdit?: (plot: Plot) => void;
  onDelete?: (plot: Plot) => void;
}

// Type assertions pour résoudre le conflit de types
const MapPinIcon = MapPin as any;
const DropletsIcon = Droplets as any;
const ThermometerIcon = Thermometer as any;
const TrendingUpIcon = TrendingUp as any;
const CalendarIcon = Calendar as any;
const ActivityIcon = Activity as any;
const EyeIcon = Eye as any;
const EditIcon = Edit as any;
const Trash2Icon = Trash2 as any;

// Type assertions pour les composants Tabs
const TabsComponent = Tabs as any;
const TabsListComponent = TabsList as any;
const TabsTriggerComponent = TabsTrigger as any;
const TabsContentComponent = TabsContent as any;

const PlotDetailsModal: React.FC<PlotDetailsModalProps> = ({
  isOpen,
  onClose,
  plot,
  onEdit,
  onDelete
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plotDetails, setPlotDetails] = useState<Plot | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);

  useEffect(() => {
    if (isOpen && plot) {
      fetchPlotDetails();
      fetchCrops();
      fetchOperations();
    }
  }, [isOpen, plot]);

  const fetchPlotDetails = async () => {
    if (!plot) return;
    
    try {
      setLoading(true);
      // Utiliser plot.id directement
      const plotId = plot.id;
      const details = await PlotsService.getPlotById(plotId);
      setPlotDetails(details);
    } catch (error) {
      console.error('Error fetching plot details:', error);
      showToast({ type: 'error', title: 'Erreur lors du chargement des détails de la parcelle' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCrops = async () => {
    if (!plot) return;
    
    try {
      // Utiliser plot.id directement
      const plotId = plot.id;
      const response = await PlotsService.getCrops({ plot_id: plotId }, { page: 1, limit: 50 });
      setCrops(response.data);
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };

  const fetchOperations = async () => {
    if (!plot) return;
    
    try {
      // Utiliser plot.id directement
      const plotId = plot.id;
      const response = await OperationsService.getOperations(
        { plot_id: plotId }, 
        { page: 1, limit: 50 }
      );
      setOperations(response.data);
    } catch (error) {
      console.error('Error fetching operations:', error);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getCropStatusColor = (status: string) => {
    switch (status) {
      case 'planted':
        return 'bg-blue-100 text-blue-800';
      case 'growing':
        return 'bg-green-100 text-green-800';
      case 'harvested':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSoilTypeLabel = (soilType: string) => {
    const labels: Record<string, string> = {
      sandy: 'Sableux',
      clay: 'Argileux',
      loam: 'Limon',
      silt: 'Limoneux',
      organic: 'Organique',
      other: 'Autre'
    };
    return labels[soilType] || soilType;
  };

  const getWaterSourceLabel = (waterSource: string) => {
    const labels: Record<string, string> = {
      rain: 'Pluie',
      irrigation: 'Irrigation',
      well: 'Puits',
      river: 'Rivière',
      other: 'Autre'
    };
    return labels[waterSource] || waterSource;
  };

  const getIrrigationTypeLabel = (irrigationType: string) => {
    const labels: Record<string, string> = {
      none: 'Aucune',
      drip: 'Goutte à goutte',
      sprinkler: 'Aspersion',
      flood: 'Inondation',
      other: 'Autre'
    };
    return labels[irrigationType] || irrigationType;
  };

  if (!plot || !plotDetails) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">{plotDetails.name}</DialogTitle>
              <DialogDescription>
                Parcelle de {plotDetails.producer?.first_name} {plotDetails.producer?.last_name}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(plotDetails.status)}>
                {plotDetails.status === 'active' ? 'Actif' : 
                 plotDetails.status === 'inactive' ? 'Inactif' : 'Abandonné'}
              </Badge>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(plotDetails)}>
                  <EditIcon className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={() => onDelete(plotDetails)}>
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <TabsComponent defaultValue="info" className="w-full">
          <TabsListComponent className="grid w-full grid-cols-3">
            <TabsTriggerComponent value="info">Informations</TabsTriggerComponent>
            <TabsTriggerComponent value="crops">Cultures</TabsTriggerComponent>
            <TabsTriggerComponent value="operations">Opérations</TabsTriggerComponent>
          </TabsListComponent>

          <TabsContentComponent value="info" className="space-y-4">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Surface</Label>
                    <p className="text-lg font-semibold">
                      {plotDetails.area_hectares ? `${plotDetails.area_hectares} ha` : 'Non définie'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type de sol</Label>
                    <p className="text-lg font-semibold">
                      {plotDetails.soil_type ? getSoilTypeLabel(plotDetails.soil_type) : 'Non défini'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">pH du sol</Label>
                    <p className="text-lg font-semibold flex items-center">
                      <ThermometerIcon className="h-4 w-4 mr-1" />
                      {plotDetails.soil_ph || 'Non défini'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Source d'eau</Label>
                    <p className="text-lg font-semibold flex items-center">
                      <DropletsIcon className="h-4 w-4 mr-1" />
                      {plotDetails.water_source ? getWaterSourceLabel(plotDetails.water_source) : 'Non définie'}
                    </p>
                  </div>
                </div>

                {plotDetails.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Notes</Label>
                    <p className="text-gray-700 mt-1 p-3 bg-gray-50 rounded-md">
                      {plotDetails.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Caractéristiques techniques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUpIcon className="h-5 w-5 mr-2" />
                  Caractéristiques techniques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type d'irrigation</Label>
                    <p className="text-lg font-semibold">
                      {plotDetails.irrigation_type ? getIrrigationTypeLabel(plotDetails.irrigation_type) : 'Aucune'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Pente</Label>
                    <p className="text-lg font-semibold">
                      {plotDetails.slope_percent ? `${plotDetails.slope_percent}%` : 'Non définie'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Altitude</Label>
                    <p className="text-lg font-semibold">
                      {plotDetails.elevation_meters ? `${plotDetails.elevation_meters} m` : 'Non définie'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Producteur */}
            <Card>
              <CardHeader>
                <CardTitle>Producteur responsable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {plotDetails.producer?.first_name?.[0]}{plotDetails.producer?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {plotDetails.producer?.first_name} {plotDetails.producer?.last_name}
                    </p>
                    <p className="text-gray-600">{plotDetails.producer?.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContentComponent>

          <TabsContentComponent value="crops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Cultures ({crops.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crops.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune culture enregistrée pour cette parcelle</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {crops.map((crop) => (
                      <div key={crop.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{crop.crop_type}</h4>
                            <p className="text-gray-600">{crop.variety}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-500">
                                Planté: {crop.sowing_date ? new Date(crop.sowing_date).toLocaleDateString() : 'Non défini'}
                              </span>
                              {crop.expected_harvest_date && (
                                <span className="text-sm text-gray-500">
                                  Récolte prévue: {new Date(crop.expected_harvest_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getCropStatusColor(crop.status)}>
                              {crop.status === 'en_cours' ? 'En cours' :
                               crop.status === 'recolte' ? 'Récolté' :
                               crop.status === 'abandonne' ? 'Abandonné' : 'Échoué'}
                            </Badge>
                            {crop.estimated_yield_kg_ha && (
                              <p className="text-sm text-gray-600 mt-1">
                                Rendement: {crop.estimated_yield_kg_ha} kg/ha
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContentComponent>

          <TabsContentComponent value="operations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ActivityIcon className="h-5 w-5 mr-2" />
                  Opérations agricoles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {operations.length === 0 ? (
                  <div className="text-center py-8">
                    <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune opération enregistrée pour cette parcelle</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {operations.map((operation) => (
                      <div key={operation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{operation.operation_type}</h4>
                            <p className="text-gray-600">{operation.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-500">
                                Date: {new Date(operation.operation_date).toLocaleDateString()}
                              </span>
                              {operation.product_used && (
                                <span className="text-sm text-gray-500">
                                  Produit: {operation.product_used}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {operation.total_cost && (
                              <p className="text-sm font-semibold text-green-600">
                                {operation.total_cost.toLocaleString()} FCFA
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContentComponent>
        </TabsComponent>
      </DialogContent>
    </Dialog>
  );
};

export default PlotDetailsModal;