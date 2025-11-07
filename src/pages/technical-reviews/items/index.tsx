/**
 * Technical Reviews - Items List (Modo B - Global View)
 * Vista global de todos los items sin agrupar por lote
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchItems, selectItemsLoading, selectItemsError } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import ItemList from '../components/items/ItemList';

const ItemsListPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const loading = useAppSelector(selectItemsLoading);
	const error = useAppSelector(selectItemsError);
	const { items, itemsMeta } = useAppSelector((state) => state.technicalReviews);

	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);

	useEffect(() => {
		if (!branchId) return;
		dispatch(
			fetchItems({
				branchId: branchId,
				params: { page, per_page: limit },
			}),
		);
	}, [dispatch, page, limit, branchId]);

	const handleViewItem = (itemId: number) => {
		navigate(`/technical-reviews/items/${itemId}`);
	};

	const handleCreateItem = () => {
		navigate('/technical-reviews/items/create');
	};

	return (
		<PageWrapper name='technical-reviews-items'>
			<Container>
				{/* Header */}
				<div className='mb-6 flex items-center justify-between'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							Ítems Globales
						</h1>
						<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
							Vista global de todos los equipos sin agrupar por lote
						</p>
					</div>
					<Button onClick={handleCreateItem}>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Nueva Revisión
					</Button>
				</div>

				{/* Error */}
				{error && (
					<Card className='mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
						<CardBody>
							<p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
						</CardBody>
					</Card>
				)}

				{/* Lista de Items con componente reutilizable */}
				<ItemList
					items={items}
					meta={itemsMeta}
					loading={loading}
					onPageChange={setPage}
					onLimitChange={setLimit}
					onItemClick={handleViewItem}
				/>
			</Container>
		</PageWrapper>
	);
};

export default ItemsListPage;
