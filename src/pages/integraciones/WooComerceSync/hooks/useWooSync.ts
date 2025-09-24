import { useState } from 'react';
import { mockWooSyncApi } from '../mocks/mockWooSyncApi';
import { ProductStock, WooSyncJob } from '../types/wooSync.types';
import { toast } from 'react-toastify';

export const useWooSync = (initialProducts: ProductStock[], initialHistory: WooSyncJob[]) => {
    const [productStocks, setProductStocks] = useState<ProductStock[]>(initialProducts);
    const [syncHistory, setSyncHistory] = useState<WooSyncJob[]>(initialHistory);
    const [lastSync, setLastSync] = useState<WooSyncJob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const pull = async () => {
        setIsProcessing(true);
        try {
            const job = await mockWooSyncApi.pullStock();
            setLastSync(job);
            setSyncHistory(prev => [job, ...prev]);
            setProductStocks(prev =>
                prev.map(p => ({
                    ...p,
                    last_sync: new Date().toISOString(),
                    sync_status: Math.random() > 0.2 ? 'synced' : 'out_of_sync',
                })),
            );
            toast.success(`Stock importado: ${job.products_updated} productos actualizados`);
        } catch {
            toast.error('Error al importar stock desde WooCommerce');
        } finally {
            setIsProcessing(false);
        }
    };

    const push = async (ids: number[]) => {
        if (!ids.length) {
            toast.error('Seleccione al menos un producto para actualizar');
            return;
        }
        setIsProcessing(true);
        try {
            const job = await mockWooSyncApi.pushStock(ids);
            setLastSync(job);
            setSyncHistory(prev => [job, ...prev]);
            setProductStocks(prev =>
                prev.map(p => (ids.includes(p.id) ? { ...p, sync_status: 'synced', last_sync: new Date().toISOString() } : p)),
            );
            toast.success(`Stock actualizado: ${job.products_updated} productos enviados a WooCommerce`);
        } catch {
            toast.error('Error al actualizar stock en WooCommerce');
        } finally {
            setIsProcessing(false);
        }
    };

    return { productStocks, setProductStocks, syncHistory, lastSync, isProcessing, pull, push };
};
