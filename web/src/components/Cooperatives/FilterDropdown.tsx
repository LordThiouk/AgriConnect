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
    <div className="flex flex-wrap gap-4">
      <Select
        value={safeFilters.region || 'all'}
        onValueChange={(value) => handleFilterChange('region', value)}
      >
        <SelectTrigger className="w-[180px]" aria-label="Filtrer par région">
          <SelectValue placeholder="Région" />
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

      <Select
        value={safeFilters.department || 'all'}
        onValueChange={(value) => handleFilterChange('department', value)}
      >
        <SelectTrigger className="w-[180px]" aria-label="Filtrer par département">
          <SelectValue placeholder="Département" />
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

      <Select
        value={safeFilters.commune || 'all'}
        onValueChange={(value) => handleFilterChange('commune', value)}
      >
        <SelectTrigger className="w-[180px]" aria-label="Filtrer par commune">
          <SelectValue placeholder="Commune" />
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
  );
}