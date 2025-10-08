import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { CooperativeFilters } from '../../types';

interface AdvancedFiltersProps {
  filters: CooperativeFilters;
  onFiltersChange: (filters: CooperativeFilters) => void;
  regions: string[];
  departments: string[];
  communes: string[];
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  regions,
  departments,
  communes
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof CooperativeFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: filters.search, // Keep search
      region: undefined,
      department: undefined,
      commune: undefined,
      hasGeo: undefined
      // minProducers et maxProducers supprimés - on utilise le modal "Voir producteurs"
    });
  };

  const hasActiveFilters = filters.region || filters.department || filters.commune || 
                          filters.hasGeo;

  // Valeurs par défaut pour éviter les erreurs
  const safeFilters = {
    region: 'all',
    department: 'all',
    commune: 'all',
    hasGeo: 'all',
    ...filters
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <Button
        variant="ghost"
        className="w-full justify-between p-0 h-auto font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Filtres avancés</span>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {Object.values(filters).filter(v => v && v !== 'all').length} actif(s)
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Géolocalisation */}
            <div className="min-w-0">
              <Label htmlFor="hasGeo" className="text-xs font-medium text-gray-700">
                Géolocalisation
              </Label>
              <Select
                value={safeFilters.hasGeo || 'all'}
                onValueChange={(value) => handleFilterChange('hasGeo', value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="true">Avec coordonnées</SelectItem>
                  <SelectItem value="false">Sans coordonnées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtres min/max producteurs supprimés - utiliser le bouton "Voir producteurs" dans le tableau */}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="flex items-center gap-2"
            >
              <X className="h-3 w-3" />
              Effacer les filtres
            </Button>
            <div className="text-xs text-gray-500 flex items-center">
              {hasActiveFilters ? (
                <>
                  Filtres actifs: {Object.entries(filters)
                    .filter(([key, value]) => value && value !== 'all' && key !== 'search')
                    .map(([key]) => {
                      const labels: Record<string, string> = {
                        region: 'Région',
                        department: 'Département',
                        commune: 'Commune',
                        hasGeo: 'Géolocalisation',
                        minProducers: 'Min. producteurs',
                        maxProducers: 'Max. producteurs'
                      };
                      return labels[key] || key;
                    })
                    .join(', ')}
                </>
              ) : (
                'Aucun filtre actif'
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
