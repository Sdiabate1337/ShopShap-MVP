import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour debouncer une valeur
 * Utile pour optimiser les recherches en temps réel
 * 
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur debouncée après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook useDebounce avec callback
 * Permet d'exécuter une fonction après le délai
 */
export function useDebounceCallback<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: T) => {
    // Annuler le timer précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Créer un nouveau timer
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

/**
 * Hook useDebounce avec état de loading
 * Utile pour afficher un indicateur de chargement pendant le debounce
 */
export function useDebounceWithLoading<T>(
  value: T, 
  delay: number
): { debouncedValue: T; isDebouncing: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isDebouncing };
}