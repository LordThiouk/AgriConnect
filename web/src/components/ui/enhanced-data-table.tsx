import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Type assertions pour les icônes
const ChevronLeftIcon = ChevronLeft as any;
const ChevronRightIcon = ChevronRight as any;
const ChevronsLeftIcon = ChevronsLeft as any;
const ChevronsRightIcon = ChevronsRight as any;

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface EnhancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: PaginationParams;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  title?: string;
  onAdd?: () => void;
  addButtonText?: string;
}

export function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPageChange,
  onLimitChange,
  loading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  title,
  onAdd,
  addButtonText = "Ajouter"
}: EnhancedDataTableProps<T>) {
  const handlePageChange = (page: number) => {
    if (onPageChange && pagination && page >= 1 && page <= (pagination.totalPages || 1)) {
      onPageChange(page);
    }
  };

  const renderPagination = () => {
    if (!pagination || !onPageChange) return null;

    const { page, totalPages = 1, total = 0 } = pagination;
    const startItem = (page - 1) * pagination.limit + 1;
    const endItem = Math.min(page * pagination.limit, total);

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Affichage de {startItem} à {endItem} sur {total} résultats
          </span>
          {onLimitChange && (
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="ml-4 text-sm border border-gray-300 rounded px-2 py-1"
              title="Sélectionner le nombre d'éléments par page"
            >
              <option value={10}>10 par page</option>
              <option value={20}>20 par page</option>
              <option value={50}>50 par page</option>
              <option value={100}>100 par page</option>
            </select>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={page === 1 || loading}
          >
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || loading}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-700 px-2">
            Page {page} sur {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || loading}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages || loading}
          >
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              {onAdd && (
                <Button onClick={onAdd} className="flex items-center gap-2">
                  {addButtonText}
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="p-8 text-center">
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            {onAdd && (
              <Button onClick={onAdd} className="flex items-center gap-2">
                {addButtonText}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    {column.icon}
                    {column.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item.id || `row-${index}`} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={`${item.id || index}-${column.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {data.map((item, index) => (
          <div key={item.id || `mobile-${index}`} className="border-b border-gray-200 p-4">
            <div className="space-y-2">
              {columns.map((column) => (
                <div key={`mobile-${item.id || index}-${column.key}`} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    {column.icon}
                    {column.label}:
                  </span>
                  <span className="text-sm text-gray-900 text-right">
                    {column.render ? column.render(item) : item[column.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {renderPagination()}
    </div>
  );
}
