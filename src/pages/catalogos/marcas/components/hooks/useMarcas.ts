import { useEffect, useState } from 'react';
import { mockBrands, mockBrandStats } from '../mocks/marcasMock';
import { IBrand, IBrandFilters, IBrandStats } from '../types';

export function useMarcas(filters: IBrandFilters) {
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [stats, setStats] = useState<IBrandStats>(mockBrandStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let data = [...mockBrands];

      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter(
          (brand) =>
            brand.name.toLowerCase().includes(query) ||
            brand.code.toLowerCase().includes(query) ||
            brand.manufacturer.toLowerCase().includes(query),
        );
      }

      if (filters.market_position) {
        data = data.filter((brand) => brand.market_position === filters.market_position);
      }

      if (filters.origin_country) {
        data = data.filter((brand) => brand.origin_country === filters.origin_country);
      }

      if (filters.is_active !== undefined) {
        data = data.filter((brand) => brand.is_active === filters.is_active);
      }

      if (filters.is_exclusive !== undefined) {
        data = data.filter((brand) => brand.is_exclusive === filters.is_exclusive);
      }

      if (filters.quality_rating_min !== undefined) {
        data = data.filter((brand) => brand.quality_rating >= (filters.quality_rating_min || 0));
      }

      setBrands(data);
      setStats(mockBrandStats);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [filters]);

  return { brands, stats, loading };
}