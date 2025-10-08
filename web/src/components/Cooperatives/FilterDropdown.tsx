import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CooperativeFilters } from '../../types';

interface FilterDropdownProps {
  filters: CooperativeFilters;
  onFiltersChange: (filters: CooperativeFilters) => void;
  regions: string[];
  departments: string[];
  communes: string[];
}

export default function FilterDropdown({
  filters,
  onFiltersChange,
  regions,
  departments,
  communes
}: FilterDropdownProps) {
  const handleFilterChange = (key: keyof CooperativeFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value
    });
  };

  // Valeurs par défaut pour éviter les erreurs
  const safeFilters = {
    region: 'all',
    department: 'all',
    commune: 'all',
    ...filters
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div className="min-w-0">
        <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">
          Région
        </label>
        <Select
          value={safeFilters.region || 'all'}
          onValueChange={(value) => handleFilterChange('region', value)}
        >
          <SelectTrigger className="w-full" aria-label="Filtrer par région">
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

      <div className="min-w-0">
        <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">
          Département
        </label>
        <Select
          value={safeFilters.department || 'all'}
          onValueChange={(value) => handleFilterChange('department', value)}
        >
          <SelectTrigger className="w-full" aria-label="Filtrer par département">
            <SelectValue placeholder="Tous les départements" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les départements</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0">
        <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">
          Commune
        </label>
        <Select
          value={safeFilters.commune || 'all'}
          onValueChange={(value) => handleFilterChange('commune', value)}
        >
          <SelectTrigger className="w-full" aria-label="Filtrer par commune">
            <SelectValue placeholder="Toutes les communes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les communes</SelectItem>
            {communes.map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}