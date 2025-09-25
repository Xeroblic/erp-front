import { useState } from 'react';
import { toast } from 'react-toastify';
import { mockWooSyncApi } from '../mocks/mockWooSyncApi';
import { ProductStock, WooSyncJob } from '../types/wooSync.types';

export const useWooSync = (initialProducts: ProductStock[], initialHistory: WooSyncJob[]) => {
	const [productStocks, setProductStocks] = useState<ProductStock[]>(initialProducts);
	const [syncHistory, setSyncHistory] = useState<WooSyncJob[]>(initialHistory);
	const [lastSync, setLastSync] = useState<WooSyncJob | null>(initialHistory[0] ?? null);
	const [isProcessing, setIsProcessing] = useState(false);

	const pull = async (): Promise<boolean> => {
		setIsProcessing(true);
		try {
			const job = await mockWooSyncApi.pullStock();
			setLastSync(job);
			setSyncHistory((prev) => [job, ...prev]);
			setProductStocks((prev) =>
				prev.map((product) => ({
					...product,
					last_sync: new Date().toISOString(),
					sync_status: Math.random() > 0.2 ? 'synced' : 'out_of_sync',
				})),
			);
			toast.success(`Stock importado: ${job.products_updated} productos actualizados`);
			return true;
		} catch (error) {
			toast.error('Error al importar stock desde WooCommerce');
			return false;
		} finally {
			setIsProcessing(false);
		}
	};

	const push = async (ids: number[]): Promise<boolean> => {
		if (!ids.length) {
			toast.error('Seleccione al menos un producto para actualizar');
			return false;
		}

		setIsProcessing(true);
		try {
			const job = await mockWooSyncApi.pushStock(ids);
			setLastSync(job);
			setSyncHistory((prev) => [job, ...prev]);
			setProductStocks((prev) =>
				prev.map((product) =>
					ids.includes(product.id)
						? {
							...product,
							sync_status: 'synced',
							last_sync: new Date().toISOString(),
						}
						: product,
					),
			);
			toast.success(`Stock actualizado: ${job.products_updated} productos enviados a WooCommerce`);
			return true;
		} catch (error) {
			toast.error('Error al actualizar stock en WooCommerce');
			return false;
		} finally {
			setIsProcessing(false);
		}
	};

	return { productStocks, setProductStocks, syncHistory, lastSync, isProcessing, pull, push };
};
