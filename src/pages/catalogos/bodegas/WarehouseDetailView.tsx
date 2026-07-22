import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Icon from '@/components/icon/Icon';
import Collapse from '@/components/utils/Collapse';
import WarehouseInfoCard from './detallesComponents/cards/WarehouseInfoCard';
import AssociatedProductsCard from './detallesComponents/cards/AssociatedProductsCard';
import { useBodegaDetail } from './hooks/useBodegaDetail';

const AvailableProductsCard = React.lazy(
	() => import('./detallesComponents/cards/AvailableProductsCard'),
);
const RemoveProductModal = React.lazy(
	() => import('./detallesComponents/modals/RemoveProductModal'),
);
const AttachProductModal = React.lazy(
	() => import('./detallesComponents/modals/AttachProductModal'),
);
const WarehouseCapacityChart = React.lazy(
	() => import('./detallesComponents/charts/WarehouseCapacityChart'),
);
const ProductBrandsChart = React.lazy(
	() => import('./detallesComponents/charts/ProductBrandsChart'),
);

const WarehouseDetailView: React.FC = () => {
	const navigate = useNavigate();
	const { state, derived, actions } = useBodegaDetail();

	if (state.warehouseDetailLoading) {
		return (
			<PageWrapper>
				<Container>
					<div className='flex items-center justify-center py-12'>
						<div className='h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent' />
						<span className='ml-3 text-gray-500'>Cargando...</span>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	if (!state.warehouse) {
		return (
			<PageWrapper>
				<Container>
					<div className='flex items-center justify-center py-12'>
						<Icon icon='HeroExclamationCircle' className='size-12 text-red-500' />
						<div className='ml-3'>Bodega no encontrada</div>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper isProtectedRoute title={state.warehouse.name} name='bodega-detail'>
			<Subheader>
				<SubheaderLeft>
					<Button
						onClick={() => navigate('/inventario/bodegas')}
						variant='outline'
						icon='HeroArrowLeft'>
						Volver
					</Button>
					<span className='ml-2 text-lg font-semibold'>{state.warehouse.name}</span>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission='update-warehouse'
						branchId={state.branchId}
						scope='access'
						variant='outline'
						className={state.isEditable ? 'bg-amber-400/20' : 'bg-blue-400/20'}
						color={state.isEditable ? 'amber' : 'blue'}
						onClick={() => actions.setIsEditable((prev) => !prev)}
						icon={state.isEditable ? 'HeroLockClosed' : 'HeroPencil'}>
						{state.isEditable ? 'Bloquear Edición' : 'Habilitar Edición'}
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-4'>
					{/* Tarjeta de Información Principal */}
					<WarehouseInfoCard warehouse={state.warehouse} />

					{/* Gráficos de Análisis Carga Diferida */}
					<div className='rounded-lg border border-zinc-200 dark:border-zinc-800'>
						<button
							onClick={() => actions.setShowCharts((prev) => !prev)}
							className='flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroChartBarSquare' className='size-5 text-blue-500' />
								<h3 className='text-lg font-semibold'>Análisis y Estadísticas</h3>
								<span className='text-sm text-zinc-500'>
									({state.warehouse.products?.length || 0} productos)
								</span>
							</div>
							<Icon
								icon={state.showCharts ? 'HeroChevronUp' : 'HeroChevronDown'}
								className='size-5 text-zinc-400'
							/>
						</button>

						<Collapse isOpen={state.showCharts}>
							<div className='border-t border-zinc-200 p-4 dark:border-zinc-800'>
								<React.Suspense
									fallback={
										<div className='h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800' />
									}>
									<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
										<WarehouseCapacityChart
											currentCapacity={state.warehouse.current_capacity ?? 0}
											maximumCapacity={state.warehouse.maximum_capacity ?? 0}
										/>
										<ProductBrandsChart
											products={state.warehouse.products || []}
											allProducts={state.allProducts}
										/>
									</div>
								</React.Suspense>
							</div>
						</Collapse>
					</div>

					{/* Catálogo de Productos Asociados */}
					<AssociatedProductsCard
						products={state.warehouse.products || []}
						allProducts={state.allProducts}
						branchId={state.branchId ?? 0}
						onRemoveProduct={actions.setProductToRemove}
					/>

					{/* Panel de Edición de Stock (Lazy) */}
					{state.isEditable && (
						<React.Suspense
							fallback={
								<div className='h-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800' />
							}>
							<AvailableProductsCard
								products={derived.availableProducts}
								loading={state.productsLoading}
								onAttachProduct={actions.onSelectProductToAttach}
							/>
						</React.Suspense>
					)}
				</div>
			</Container>

			{/* Renderizado Condicional y Perezoso de Modales */}
			<React.Suspense
				fallback={
					<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
						<div className='h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent' />
					</div>
				}>
				{state.productToRemove && (
					<RemoveProductModal
						isOpen={!!state.productToRemove}
						product={state.productToRemove}
						onClose={() => actions.setProductToRemove(null)}
						onConfirm={actions.onConfirmRemove}
					/>
				)}

				{state.attachProduct && (
					<AttachProductModal
						isOpen={!!state.attachProduct}
						product={state.attachProduct}
						allProducts={state.allProducts}
						associatedProducts={state.warehouse?.products || []}
						onClose={actions.closeAttachModal}
						onConfirm={actions.onConfirmAttach}
						isLoading={state.isAttaching}
					/>
				)}
			</React.Suspense>
		</PageWrapper>
	);
};

export default WarehouseDetailView;
