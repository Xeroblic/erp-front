import { useEffect, useState } from 'react';
import {
  mockSuppliers,
  mockSupplierStats,
  supplierCategoryOptions,
  supplierRatingOptions,
  supplierStatusOptions,
} from '../mocks/proveedoresMock';
import { ISupplier, ISupplierFilters, ISupplierStats } from '../types';

export function useProveedores(filters: ISupplierFilters) {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [stats, setStats] = useState<ISupplierStats>(mockSupplierStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let data = [...mockSuppliers];

      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter((supplier) =>
          [
            supplier.name,
            supplier.code,
            supplier.document_number,
            supplier.contact_person,
            supplier.contact_email,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query),
        );
      }

      if (filters.category) {
        data = data.filter((supplier) => supplier.category === filters.category);
      }

      if (filters.city) {
        const cityQuery = filters.city.toLowerCase();
        data = data.filter((supplier) => supplier.city.toLowerCase().includes(cityQuery));
      }

      if (filters.rating !== undefined) {
        data = data.filter((supplier) => supplier.rating >= (filters.rating ?? 0));
      }

      if (filters.is_active !== undefined) {
        data = data.filter((supplier) => supplier.is_active === filters.is_active);
      }

      setSuppliers(data);
      setStats(mockSupplierStats);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [filters]);

  return {
    suppliers,
    stats,
    loading,
    categoryOptions: supplierCategoryOptions,
    ratingOptions: supplierRatingOptions,
    statusOptions: supplierStatusOptions,
  };
}