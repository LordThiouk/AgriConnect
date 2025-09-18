import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  // Validation des valeurs pour éviter NaN
  const safeCurrentPage = isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;
  const safeItemsPerPage = isNaN(itemsPerPage) || itemsPerPage < 1 ? 1 : itemsPerPage;
  const safeTotalItems = isNaN(totalItems) || totalItems < 0 ? 0 : totalItems;
  
  const startItem = Math.max(1, (safeCurrentPage - 1) * safeItemsPerPage + 1);
  const endItem = Math.min(safeCurrentPage * safeItemsPerPage, safeTotalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
        >
          Suivant
        </Button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Affichage de <span className="font-medium">{startItem}</span> à{' '}
            <span className="font-medium">{endItem}</span> sur{' '}
            <span className="font-medium">{totalItems}</span> résultats
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safeCurrentPage <= 3) {
                pageNum = i + 1;
              } else if (safeCurrentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safeCurrentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === safeCurrentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}