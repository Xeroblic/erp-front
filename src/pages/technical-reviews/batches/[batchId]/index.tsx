/**
 * Technical Reviews - Batch Detail
 * Detalle de un lote con BatchDetail y BatchTabs integrados
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchBatchById,
	selectSelectedBatch,
	selectBatchesLoading,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import BatchDetail from '../../components/batches/BatchDetail';
import BatchTabs from '../../components/batches/BatchTabs';

const BatchDetailPage: React.FC = () => {
	const { batchId } = useParams<{ batchId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const batch = useAppSelector(selectSelectedBatch);
	const batchLoading = useAppSelector(selectBatchesLoading);

	useEffect(() => {
		if (!batchId || !branchId) return;
		const parsedBatchId = parseInt(batchId);
		dispatch(fetchBatchById({ branchId, batchId: parsedBatchId }));
	}, [dispatch, batchId, branchId]);

	const handleBack = () => {
		navigate('/technical-reviews/batches');
	};

	const handleViewItem = (itemId: number) => {
		navigate(`/technical-reviews/batches/${batchId}/items/${itemId}`);
	};

	return (
		<PageWrapper name='batch-detail'>
			<Subheader>
				<SubheaderLeft>
					<Button variant='outline' onClick={handleBack} icon='HeroArrowLeft'>
						Volver
					</Button>
					<div className='ml-3'>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
							{batch?.code || `Lote #${batchId}`}
						</h1>
						{batch && (
							<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
								{batch.warehouse?.name || `Bodega #${batch.warehouse_id}`} •
								Entrada: {batch.entry_date}
							</p>
						)}
					</div>
				</SubheaderLeft>

				<SubheaderRight>
					{/* Botón para registrar serie dentro del lote (ruta semántica REST) */}
					<Button
						color='green'
						onClick={() =>
							navigate(`/technical-reviews/batches/${batch?.id}/items/create`)
						}>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Registrar Serie
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				{batchLoading ? (
					<Card>
						<CardBody>
							<div className='py-12 text-center'>
								<div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent' />
								<p className='mt-2 text-sm text-gray-600'>Cargando lote...</p>
							</div>
						</CardBody>
					</Card>
				) : !batch ? (
					<Card>
						<CardBody>
							<div className='py-12 text-center text-gray-500'>
								<Icon
									icon='HeroExclamationCircle'
									className='mx-auto mb-3 h-12 w-12 text-gray-400'
								/>
								<p>Lote no encontrado</p>
							</div>
						</CardBody>
					</Card>
				) : (
					<>
						{/* Información general del lote */}
						<BatchDetail batch={batch} />

						{/* Tabs con equipos por tipo */}
						<BatchTabs batch={batch} onItemClick={handleViewItem} />
					</>
				)}
			</Container>
		</PageWrapper>
	);
};

export default BatchDetailPage;
