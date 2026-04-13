import { useState, useCallback } from 'react';
import { dataService } from '../services/dataService';

export default function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(() => dataService.getFavorites());

  const isFavorite = useCallback(
    (hostelId) => favoriteIds.includes(hostelId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((hostelId) => {
    const next = dataService.toggleFavorite(hostelId);
    setFavoriteIds([...next]);
  }, []);

  const removeFavorite = useCallback((hostelId) => {
    const next = dataService.removeFavorite(hostelId);
    setFavoriteIds([...next]);
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite, removeFavorite };
}
