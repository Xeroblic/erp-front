import { useState, useEffect } from 'react';
import FalabellaApiService, { Product } from '@/services/falabellaApi.service';

const falabellaApi = new FalabellaApiService();

export const useLowStockProducts = (threshold: number = 5) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLowStockProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const lowStockProducts = await falabellaApi.getLowStockProducts(threshold);
                setProducts(lowStockProducts);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar productos con stock bajo');
            } finally {
                setLoading(false);
            }
        };

        fetchLowStockProducts();
    }, [threshold]);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const lowStockProducts = await falabellaApi.getLowStockProducts(threshold);
            setProducts(lowStockProducts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar productos con stock bajo');
        } finally {
            setLoading(false);
        }
    };

    return { products, loading, error, refetch };
};

export const useBestSellingProducts = (days: number = 30) => {
    const [products, setProducts] = useState<{ product: Product, totalSold: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBestSellingProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const bestSelling = await falabellaApi.getBestSellingProducts(days);
                setProducts(bestSelling);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar productos más vendidos');
            } finally {
                setLoading(false);
            }
        };

        fetchBestSellingProducts();
    }, [days]);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const bestSelling = await falabellaApi.getBestSellingProducts(days);
            setProducts(bestSelling);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar productos más vendidos');
        } finally {
            setLoading(false);
        }
    };

    return { products, loading, error, refetch };
};

export const useInventorySummary = () => {
    const [summary, setSummary] = useState({
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        averagePrice: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInventorySummary = async () => {
            try {
                setLoading(true);
                setError(null);
                const inventorySummary = await falabellaApi.getInventorySummary();
                setSummary(inventorySummary);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar resumen de inventario');
            } finally {
                setLoading(false);
            }
        };

        fetchInventorySummary();
    }, []);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);
            const inventorySummary = await falabellaApi.getInventorySummary();
            setSummary(inventorySummary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar resumen de inventario');
        } finally {
            setLoading(false);
        }
    };

    return { summary, loading, error, refetch };
};
