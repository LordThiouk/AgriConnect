import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  MapPin, 
  Calendar, 
  Building2, 
  User,
  Plus,
  X
} from 'lucide-react';
import { FarmFile, FarmFilesService } from '../../services/farmFilesService';
import { CooperativesService } from '../../services/cooperativesService';
import { ProducersService } from '../../services/producersService';

// Type assertions pour résoudre le conflit de types
const FileTextIcon = FileText as any;
const MapPinIcon = MapPin as any;
const CalendarIcon = Calendar as any;
const Building2Icon = Building2 as any;
const UserIcon = User as any;
const PlusIcon = Plus as any;
const XIcon = X as any;

interface FarmFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (farmFile: FarmFile) => void;
  farmFile?: FarmFile | null;
  producerId?: string;
}

interface Cooperative {
  id: string;
  name: string;
  region: string;
}

interface Producer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

const FarmFileModal: React.FC<FarmFileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  farmFile,
  producerId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    department: '',
    commune: '',
    village: '',
    sector: '',
    cooperative_id: '',
    gpc: '',
    census_date: '',
    responsible_producer_id: '',
    material_inventory: {} as Record<string, any>
  });

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inventoryItems, setInventoryItems] = useState<Array<{key: string, value: string}>>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (farmFile) {
        setFormData({
          name: farmFile.name || '',
          region: farmFile.region || '',
          department: farmFile.department || '',
          commune: farmFile.commune || '',
          village: farmFile.village || '',
          sector: farmFile.sector || '',
          cooperative_id: farmFile.cooperative_id || '',
          gpc: farmFile.gpc || '',
          census_date: farmFile.census_date || '',
          responsible_producer_id: farmFile.responsible_producer_id || '',
          material_inventory: farmFile.material_inventory || {}
        });
        
        // Convert inventory to array for editing
        const inventoryArray = Object.entries(farmFile.material_inventory || {}).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setInventoryItems(inventoryArray);
      } else {
        resetForm();
      }
    }
  }, [isOpen, farmFile]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load cooperatives
      const cooperativesResult = await CooperativesService.getCooperatives({}, 1, 100);
      setCooperatives(cooperativesResult.data);

      // Load producers
      const producersResult = await ProducersService.getProducers({}, { page: 1, limit: 100 });
      setProducers(producersResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      region: '',
      department: '',
      commune: '',
      village: '',
      sector: '',
      cooperative_id: '',
      gpc: '',
      census_date: '',
      responsible_producer_id: producerId || '',
      material_inventory: {}
    });
    setInventoryItems([]);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addInventoryItem = () => {
    setInventoryItems(prev => [...prev, { key: '', value: '' }]);
  };

  const removeInventoryItem = (index: number) => {
    setInventoryItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateInventoryItem = (index: number, field: 'key' | 'value', value: string) => {
    setInventoryItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.region.trim()) newErrors.region = 'La région est requise';
    if (!formData.department.trim()) newErrors.department = 'Le département est requis';
    if (!formData.commune.trim()) newErrors.commune = 'La commune est requise';
    if (!formData.village.trim()) newErrors.village = 'Le village est requis';
    if (!formData.sector.trim()) newErrors.sector = 'Le secteur est requis';
    if (!formData.cooperative_id) newErrors.cooperative_id = 'La coopérative est requise';
    if (!formData.census_date) newErrors.census_date = 'La date de recensement est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Convert inventory items to object
      const inventory = inventoryItems.reduce((acc, item) => {
        if (item.key.trim() && item.value.trim()) {
          acc[item.key.trim()] = item.value.trim();
        }
        return acc;
      }, {} as Record<string, any>);

      const farmFileData = {
        ...formData,
        material_inventory: inventory,
        created_by: 'current-user-id' // This should come from auth context
      };

      let savedFarmFile: FarmFile;
      if (farmFile) {
        savedFarmFile = await FarmFilesService.updateFarmFile(farmFile.id, farmFileData);
      } else {
        savedFarmFile = await FarmFilesService.createFarmFile(farmFileData);
      }

      onSave(savedFarmFile);
      onClose();
    } catch (error) {
      console.error('Error saving farm file:', error);
    } finally {
      setLoading(false);
    }
  };

  const regions = ['Kaolack', 'Thiès', 'Dakar', 'Saint-Louis', 'Ziguinchor', 'Kolda', 'Tambacounda', 'Kédougou', 'Matam', 'Louga', 'Fatick', 'Kaffrine', 'Diourbel', 'Sédhiou'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            {farmFile ? 'Modifier la fiche d\'exploitation' : 'Nouvelle fiche d\'exploitation'}
          </DialogTitle>
          <DialogDescription>
            {farmFile ? 'Modifiez les informations de la fiche' : 'Créez une nouvelle fiche d\'exploitation'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de la fiche *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Fiche Exploitation Alpha"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="gpc">GPC</Label>
                    <Input
                      id="gpc"
                      value={formData.gpc}
                      onChange={(e) => handleInputChange('gpc', e.target.value)}
                      placeholder="Ex: GPC001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="census_date">Date de recensement *</Label>
                    <Input
                      id="census_date"
                      type="date"
                      value={formData.census_date}
                      onChange={(e) => handleInputChange('census_date', e.target.value)}
                      className={errors.census_date ? 'border-red-500' : ''}
                    />
                    {errors.census_date && <p className="text-sm text-red-500 mt-1">{errors.census_date}</p>}
                  </div>

                  <div>
                    <Label htmlFor="sector">Secteur *</Label>
                    <Input
                      id="sector"
                      value={formData.sector}
                      onChange={(e) => handleInputChange('sector', e.target.value)}
                      placeholder="Ex: Secteur A"
                      className={errors.sector ? 'border-red-500' : ''}
                    />
                    {errors.sector && <p className="text-sm text-red-500 mt-1">{errors.sector}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region">Région *</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => handleInputChange('region', value)}
                    >
                      <SelectTrigger className={errors.region ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.region && <p className="text-sm text-red-500 mt-1">{errors.region}</p>}
                  </div>

                  <div>
                    <Label htmlFor="department">Département *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Ex: Kaolack"
                      className={errors.department ? 'border-red-500' : ''}
                    />
                    {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
                  </div>

                  <div>
                    <Label htmlFor="commune">Commune *</Label>
                    <Input
                      id="commune"
                      value={formData.commune}
                      onChange={(e) => handleInputChange('commune', e.target.value)}
                      placeholder="Ex: Kaolack"
                      className={errors.commune ? 'border-red-500' : ''}
                    />
                    {errors.commune && <p className="text-sm text-red-500 mt-1">{errors.commune}</p>}
                  </div>

                  <div>
                    <Label htmlFor="village">Village *</Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e) => handleInputChange('village', e.target.value)}
                      placeholder="Ex: Ndiaganiao"
                      className={errors.village ? 'border-red-500' : ''}
                    />
                    {errors.village && <p className="text-sm text-red-500 mt-1">{errors.village}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coopérative et Producteur */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2Icon className="h-5 w-5" />
                  Coopérative et Producteur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cooperative_id">Coopérative *</Label>
                    <Select
                      value={formData.cooperative_id}
                      onValueChange={(value) => handleInputChange('cooperative_id', value)}
                    >
                      <SelectTrigger className={errors.cooperative_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Sélectionner une coopérative" />
                      </SelectTrigger>
                      <SelectContent>
                        {cooperatives.map(coop => (
                          <SelectItem key={coop.id} value={coop.id}>
                            {coop.name} - {coop.region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cooperative_id && <p className="text-sm text-red-500 mt-1">{errors.cooperative_id}</p>}
                  </div>

                  <div>
                    <Label htmlFor="responsible_producer_id">Producteur responsable</Label>
                    <Select
                      value={formData.responsible_producer_id}
                      onValueChange={(value) => handleInputChange('responsible_producer_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un producteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {producers.map(producer => (
                          <SelectItem key={producer.id} value={producer.id}>
                            {producer.first_name} {producer.last_name} - {producer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventaire matériel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Inventaire matériel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {inventoryItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`inventory-key-${index}`}>Article</Label>
                        <Input
                          id={`inventory-key-${index}`}
                          value={item.key}
                          onChange={(e) => updateInventoryItem(index, 'key', e.target.value)}
                          placeholder="Ex: Graines de maïs"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`inventory-value-${index}`}>Quantité</Label>
                        <Input
                          id={`inventory-value-${index}`}
                          value={item.value}
                          onChange={(e) => updateInventoryItem(index, 'value', e.target.value)}
                          placeholder="Ex: 50 kg"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInventoryItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInventoryItem}
                    className="w-full"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Ajouter un article
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement...' : (farmFile ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FarmFileModal;
