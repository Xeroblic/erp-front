import { useState, useEffect } from 'react';
import { mockWarehouses, mockStats } from '../mocks/bodegasMock';
import { IWarehouse, IWarehouseStats, IWarehouseFilters } from '../types';

export function useBodegas(filters: IWarehouseFilters) {
    const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
    const [stats, setStats] = useState<IWarehouseStats>(mockStats);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setWarehouses(mockWarehouses);
            setStats(mockStats);
            setLoading(false);
        }, 800);
    }, [filters]);

    return { warehouses, stats, loading };
}
