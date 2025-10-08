import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

// Type assertions pour résoudre les conflits de types
const FilterIcon = Filter as any;
const XIcon = X as any;
const ChevronUpIcon = ChevronUp as any;
const ChevronDownIcon = ChevronDown as any;
import { ProducerFilters } from '../../services/producersService';
import { Card, CardContent, CardHeader } from '../ui/card';

interface AdvancedFiltersProps {
  filters: ProducerFilters;
  onFiltersChange: (filters: ProducerFilters) => void;
  regions: string[];
  cooperatives: Array<{id: string, name: string}>;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  regions,
  cooperatives
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof ProducerFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: filters.search, // Keep search
      region: undefined,
      cooperative_id: undefined
    });
  };

  const hasActiveFilters = filters.region || filters.cooperative_id;

  // Valeurs par défaut pour éviter les erreurs
  const safeFilters = {
    region: 'all',
    cooperative_id: 'all'
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Filtres avancés</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {[filters.region, filters.cooperative_id].filter(Boolean).length} actif(s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Effacer
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isOpen ? (
                <>
                  <ChevronUpIcon className="h-4 w-4 mr-1" />
                  Réduire
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                  Développer
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtre par région */}
            <div className="space-y-2">
              <Label htmlFor="region-filter" className="text-sm font-medium text-gray-700">
                Région
              </Label>
              <Select
                value={filters.region || safeFilters.region}
                onValueChange={(value) => handleFilterChange('region', value)}
              >
                <SelectTrigger id="region-filter" className="w-full">
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par coopérative */}
            <div className="space-y-2">
              <Label htmlFor="cooperative-filter" className="text-sm font-medium text-gray-700">
                Coopérative
              </Label>
              <Select
                value={filters.cooperative_id || safeFilters.cooperative_id}
                onValueChange={(value) => handleFilterChange('cooperative_id', value)}
              >
                <SelectTrigger id="cooperative-filter" className="w-full">
                  <SelectValue placeholder="Toutes les coopératives" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les coopératives</SelectItem>
                  {cooperatives.map((cooperative) => (
                    <SelectItem key={cooperative.id} value={cooperative.id}>
                      {cooperative.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par statut actif/inactif */}
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Statut
              </Label>
              <Select
                value="all" // Toujours "all" car on utilise is_active directement
                onValueChange={() => {}} // Pas de changement car on utilise is_active
              >
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active" disabled>Tous les producteurs (actifs uniquement)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
