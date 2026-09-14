import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Card, { CardBody } from '@/components/ui/Card';
import { TrazabilidadFilters } from './components/TrazabilidadFilters';
import { TrazabilidadTimeline } from './components/TrazabilidadTimeline';
import { useTrazabilidadMovimientos } from './hooks/useTrazabilidadMovimientos';

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
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroArchiveBox'
						title='Trazabilidad de Inventario'
						description='Historial completo de movimientos de inventario por sucursal'
					/>
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
