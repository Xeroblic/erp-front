import { useEffect, useState } from 'react';
import { mockCategories, mockCategoryStats } from '../mocks/categoriesMock';
import { ICategory, ICategoryFilters, ICategoryStats } from '../types';

export function useCategorias(filters: ICategoryFilters) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [stats, setStats] = useState<ICategoryStats>(mockCategoryStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      // En un futuro se pueden aplicar filtros aquí
      setCategories(mockCategories);
      setStats(mockCategoryStats);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [filters]);

  return { categories, stats, loading };
}

