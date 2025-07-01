import { useState, useCallback, useMemo } from 'react';

export type SortOption = 'recent' | 'name' | 'price';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  sortBy: SortOption;
  searchTerm: string;
}

export interface PaginationActions {
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  setSortBy: (sort: SortOption) => void;
  setSearchTerm: (term: string) => void;
  reset: () => void;
  setTotalItems: (total: number) => void;
}

export interface PaginationInfo {
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startItem: number;
  endItem: number;
  isFirstPage: boolean;
  isLastPage: boolean;
}

const DEFAULT_PAGE_SIZE = 12;

export function usePagination(initialPageSize: number = DEFAULT_PAGE_SIZE) {
  const [state, setState] = useState<PaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    sortBy: 'recent',
    searchTerm: ''
  });

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: Math.max(1, page) }));
  }, []);

  const nextPage = useCallback(() => {
    setState(prev => {
      const maxPage = Math.ceil(prev.totalItems / prev.pageSize);
      return {
        ...prev,
        currentPage: Math.min(prev.currentPage + 1, maxPage)
      };
    });
  }, []);

  const prevPage = useCallback(() => {
    setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState(prev => ({
      ...prev,
      pageSize: Math.max(1, size),
      currentPage: 1 // Reset à la première page
    }));
  }, []);

  const setSortBy = useCallback((sort: SortOption) => {
    setState(prev => ({
      ...prev,
      sortBy: sort,
      currentPage: 1 // Reset à la première page
    }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({
      ...prev,
      searchTerm: term,
      currentPage: 1 // Reset à la première page
    }));
  }, []);

  const setTotalItems = useCallback((total: number) => {
    setState(prev => ({ ...prev, totalItems: Math.max(0, total) }));
  }, []);

  const reset = useCallback(() => {
    setState({
      currentPage: 1,
      pageSize: initialPageSize,
      totalItems: 0,
      sortBy: 'recent',
      searchTerm: ''
    });
  }, [initialPageSize]);

  const paginationInfo: PaginationInfo = useMemo(() => {
    const totalPages = Math.ceil(state.totalItems / state.pageSize);
    const startItem = (state.currentPage - 1) * state.pageSize + 1;
    const endItem = Math.min(state.currentPage * state.pageSize, state.totalItems);

    return {
      totalPages,
      hasNextPage: state.currentPage < totalPages,
      hasPrevPage: state.currentPage > 1,
      startItem: state.totalItems > 0 ? startItem : 0,
      endItem: state.totalItems > 0 ? endItem : 0,
      isFirstPage: state.currentPage === 1,
      isLastPage: state.currentPage === totalPages || totalPages === 0
    };
  }, [state]);

  const actions: PaginationActions = {
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    setSortBy,
    setSearchTerm,
    reset,
    setTotalItems
  };

  return {
    state,
    actions,
    info: paginationInfo
  };
}