import { useEffect, useState } from 'react';
import { mockCustomers, mockCustomerStats } from '../mocks/customersMock';
import { ICustomer, ICustomerFilters, ICustomerStats } from '../types';

export function useClientes(filters: ICustomerFilters) {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [stats, setStats] = useState<ICustomerStats>(mockCustomerStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      let data = [...mockCustomers];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
      }
      if (filters.segment) data = data.filter((c) => c.segment === filters.segment);
      if (filters.industry) data = data.filter((c) => c.industry === filters.industry);
      if (filters.city) data = data.filter((c) => c.city === filters.city);
      if (filters.is_active !== undefined) data = data.filter((c) => c.is_active === filters.is_active);
      if (filters.loyalty_score) data = data.filter((c) => c.loyalty_score >= (filters.loyalty_score || 0));

      setCustomers(data);
      setStats(mockCustomerStats);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [filters]);

  return { customers, stats, loading };
}

