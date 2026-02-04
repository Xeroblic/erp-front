import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Card, { CardBody } from '@/components/ui/Card';
import { TrazabilidadFilters } from './components/TrazabilidadFilters';
import { TrazabilidadTimeline } from './components/TrazabilidadTimeline';
import { useTrazabilidadMovimientos } from './hooks/useTrazabilidadMovimientos';
import Icon from '@/components/icon/Icon';

const TrazabilidadSubsidiary = () => {
	const {
		movimientos,
		pagination,
		loading,
		error,
		fetchStatus,
		hasFetched,
		branchId,
		currentBranchName,
		isLoadingMore,
		filters,
		applyFilters,
		clearFilters,
		reload,
		loadMore,
	} = useTrazabilidadMovimientos();

	return (
		<PageWrapper
			isProtectedRoute={true}
			name='trazabilidad-sucursal'
			title='Trazabilidad de Inventario'>
			<Subheader>
				<SubheaderLeft className='flex flex-row gap-2'>
					<div className='flex flex-row gap-2'>
						<Icon icon='HeroArchiveBox' className='h-6 w-6' />
					</div>
					<div className='flex flex-col items-start justify-start'>
						<Badge className='text-xl font-bold'>Trazabilidad de Inventario</Badge>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Historial completo de movimientos de inventario por sucursal
						</p>
					</div>
				</SubheaderLeft>
			</Subheader>
			<Container className='flex flex-col gap-4'>
				<Card>
					<CardBody>
						{/* Filtros */}
						<TrazabilidadFilters
							filters={filters}
							onApplyFilters={applyFilters}
							onClearFilters={clearFilters}
							loading={loading || isLoadingMore}
						/>
					</CardBody>
				</Card>
				<Card>
					<CardBody>
						{/* Timeline */}
						<TrazabilidadTimeline
							movimientos={movimientos}
							pagination={pagination}
							loading={loading}
							error={error}
							fetchStatus={fetchStatus}
							hasFetched={hasFetched}
							branchId={branchId}
							currentBranchName={currentBranchName}
							isLoadingMore={isLoadingMore}
							onReload={reload}
							onLoadMore={loadMore}
						/>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default TrazabilidadSubsidiary;
