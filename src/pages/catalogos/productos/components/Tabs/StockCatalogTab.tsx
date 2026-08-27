import React, { useEffect } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchStockCatalog } from '@/store/slices/products/productStockSlice';
import StockCatalogTable from '../tables/StockCatalogTable';

interface StockCatalogTabProps {
	subsidiaryId: number;
}

const StockCatalogTab: React.FC<StockCatalogTabProps> = ({ subsidiaryId }) => {
	const dispatch = useAppDispatch();
	const { stockCatalog, isLoadingStockCatalog } = useAppSelector((state) => state.productStock);

	useEffect(() => {
		if (!subsidiaryId) return;
		void dispatch(fetchStockCatalog({ subsidiaryId }));
	}, [dispatch, subsidiaryId]);

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Icon icon='HeroBuildingStorefront' className='h-5 w-5 text-emerald-500' />
						Catálogo Global de Stock
					</CardTitle>
					<div className='flex items-center gap-3'>
						<Badge variant='outline' color='emerald'>
							Matriz vs sucursales
						</Badge>
						<Button
							variant='outline'
							size='sm'
							icon='HeroArrowPath'
							onClick={() => void dispatch(fetchStockCatalog({ subsidiaryId }))}
							isLoading={isLoadingStockCatalog}
							isDisable={!subsidiaryId}>
							Recargar catálogo
						</Button>
					</div>
				</CardHeader>
				<CardBody>
					<div className='mb-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300'>
						Vista operativa para revisar cuánto stock sigue en la matriz, cuánto ya fue
						asignado a sucursales y cuántos productos están distribuidos.
					</div>
					<StockCatalogTable items={stockCatalog} loading={isLoadingStockCatalog} />
				</CardBody>
			</Card>
		</div>
	);
};

export default StockCatalogTab;
