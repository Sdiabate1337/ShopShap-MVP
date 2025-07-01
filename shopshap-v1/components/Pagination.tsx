import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startItem: number;
  endItem: number;
  totalItems: number;
  loading?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  startItem,
  endItem,
  totalItems,
  loading = false,
  className = ''
}: PaginationProps) {
  // Générer les numéros de pages à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Nombre de pages à afficher de chaque côté

    if (totalPages <= 7) {
      // Si peu de pages, les afficher toutes
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour les ellipses
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info sur les éléments */}
      <div className="text-sm text-night-foreground/60">
        {totalItems > 0 ? (
          <>
            Affichage de <span className="font-medium text-white">{startItem}</span> à{' '}
            <span className="font-medium text-white">{endItem}</span> sur{' '}
            <span className="font-medium text-white">{totalItems}</span> résultat(s)
          </>
        ) : (
          'Aucun résultat'
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {/* Bouton précédent */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || loading}
          className="px-3 py-2 text-sm font-medium text-night-foreground bg-night-foreground/10 border border-night-foreground/20 rounded-lg hover:bg-night-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← Précédent
        </button>

        {/* Numéros de pages */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-night-foreground/50">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-night-foreground bg-night-foreground/10 border border-night-foreground/20 hover:bg-night-foreground/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Page actuelle (mobile) */}
        <div className="sm:hidden px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
          {currentPage} / {totalPages}
        </div>

        {/* Bouton suivant */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || loading}
          className="px-3 py-2 text-sm font-medium text-night-foreground bg-night-foreground/10 border border-night-foreground/20 rounded-lg hover:bg-night-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}