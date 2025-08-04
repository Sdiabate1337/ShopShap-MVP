'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';

// Types déjà définis dans client-page.tsx - on les réimporte
type ProductFiltersProps = {
  theme: any;
  onFilter: (filter: string) => void;
  onSort: (sort: string) => void;
  onSearch: (search: string) => void;
};

// ✅ Composant ProductFilters extrait pour le lazy loading
export const ProductFilters = memo(function ProductFilters({ 
  theme, 
  onFilter, 
  onSort, 
  onSearch 
}: ProductFiltersProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ useMemo pour éviter de recréer les options à chaque render
  const filters = useMemo(() => [
    { id: 'all', label: 'Tous les produits', icon: '🛍️' },
    { id: 'available', label: 'Disponibles', icon: '✅' },
    { id: 'popular', label: 'Populaires', icon: '🔥' },
    { id: 'lowstock', label: 'Stock limité', icon: '⚠️' },
  ], []);

  const sorts = useMemo(() => [
    { id: 'newest', label: 'Plus récents' },
    { id: 'price-low', label: 'Prix croissant' },
    { id: 'price-high', label: 'Prix décroissant' },
    { id: 'name', label: 'Nom A-Z' },
    { id: 'popularity', label: 'Popularité' },
  ], []);

  // ✅ Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleFilterClick = useCallback((filterId: string) => {
    setActiveFilter(filterId);
    onFilter(filterId);
  }, [onFilter]);

  const handleSortChange = useCallback((sortValue: string) => {
    setActiveSort(sortValue);
    onSort(sortValue);
  }, [onSort]);

  return (
    <div className={`${theme.card} backdrop-blur-xl border ${theme.border} rounded-2xl p-6 mb-8`}>
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            type="search"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            aria-label="Rechercher dans les produits"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-4">Filtrer par :</h3>
          <div className="flex gap-3 flex-wrap">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeFilter === filter.id
                    ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                aria-pressed={activeFilter === filter.id}
              >
                <span role="img" aria-hidden="true">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="lg:w-64">
          <h3 className="text-white font-semibold mb-4">Trier par :</h3>
          <select
            value={activeSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Trier les produits"
          >
            {sorts.map(sort => (
              <option key={sort.id} value={sort.id} className="bg-gray-900">
                {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});