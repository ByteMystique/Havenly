import { useState, useCallback } from 'react';

const STORAGE_KEY = 'favorites';

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(readFavorites);

  const isFavorite = useCallback(
    (hostelId) => favoriteIds.includes(hostelId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((hostelId) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(hostelId)
        ? prev.filter((id) => id !== hostelId)
        : [...prev, hostelId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((hostelId) => {
    setFavoriteIds((prev) => {
      const next = prev.filter((id) => id !== hostelId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite, removeFavorite };
}
