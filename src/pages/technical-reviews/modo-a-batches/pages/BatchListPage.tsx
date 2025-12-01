/**
 * Technical Reviews - Batches List (Modo A)
 * Listado de lotes con filtros y búsqueda por serie
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import BatchList from '@/pages/technical-reviews/components/batches/BatchList';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Label from '@/components/form/Label';
import { useBatchList } from '../hooks';
import type { CommercialStatus } from '@/interface/technicalReviews.interface';

const BatchesListPage: React.FC = () => {
	const navigate = useNavigate();
	const { branchId } = useCurrentBranch();
	const { batches, meta, loading, error, fetchBatches } = useBatchList(branchId);

	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | CommercialStatus>('all');

	useEffect(() => {
		if (!branchId) return;
		fetchBatches({
			page,
			per_page: limit,
			search: searchQuery || undefined,
			status: statusFilter === 'all' ? undefined : statusFilter,
		});
	}, [branchId, fetchBatches, limit, page, searchQuery, statusFilter]);

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		setPage(1);
	};

	const handleStatusFilter = (status: string) => {
		const nextStatus: 'all' | CommercialStatus = status === 'all' ? 'all' : (status as CommercialStatus);
		setStatusFilter(nextStatus);
		setPage(1);
	};

	const handleCreateBatch = () => {
		navigate('/technical-reviews/batches/create');
	};

	return (
		<PageWrapper name='technical-reviews-batches'>
			<Subheader className='mb-6 flex items-center justify-between'>
				<SubheaderLeft>
					<div>
						<Badge className='text-2xl font-semibold mb-1'>Lotes de Revisión</Badge>
						<p className="text-zinc-500 text-sm">Consulta y administra los lotes de revisión registrados.</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant="solid"
						icon="HeroPlus"
						onClick={handleCreateBatch}
					>
						Nuevo Lote
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container>

				{/* Error */}
				{error && (
					<Card className='mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
						<CardBody>
							<p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
						</CardBody>
					</Card>
				)}

				{/* Lista de Lotes con componente reutilizable */}
				<BatchList
					batches={batches}
					meta={meta}
					loading={loading}
					onPageChange={setPage}
					onLimitChange={setLimit}
					onSearch={handleSearch}
					onStatusFilter={handleStatusFilter}
				/>
			</Container>
		</PageWrapper>
	);
};

export default BatchesListPage;
