import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Container from '@/components/layouts/Container/Container';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import WarehouseInfoCard from './detallesComponents/cards/WarehouseInfoCard';
import AssociatedProductsTable from './detallesComponents/tables/AssociatedProductsTable';
import { useBodegaDetail } from './hooks/useBodegaDetail';

const AvailableProductsTable = React.lazy(
	() => import('./detallesComponents/tables/AvailableProductsTable'),
);
const RemoveProductModal = React.lazy(
	() => import('./detallesComponents/modals/RemoveProductModal'),
);
const AttachProductModal = React.lazy(
	() => import('./detallesComponents/modals/AttachProductModal'),
);

/**
 * Ficha de una bodega: sus datos, capacidad y los productos asociados. Con
 * «Asociar productos» se despliegan los disponibles de la sucursal.
 */
const WarehouseDetailView: React.FC = () => {
	const navigate = useNavigate();
	const { state, derived, actions } = useBodegaDetail();
	// Al saltar de una ficha a otra, o de sucursal, la ruta no se desmonta: la bodega del
	// store sólo se muestra si es la del enlace y de la sucursal activa.
	const warehouse =
		state.warehouse?.id === state.warehouseId && state.warehouse.branch_id === state.branchId
			? state.warehouse
			: null;

	let content;
	if (state.warehouseId === null)
		content = <Alert title='Bodega inválida'>El enlace no apunta a una bodega válida.</Alert>;
	else if (!state.branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para consultar esta bodega.
			</Alert>
		);
	else if (warehouse)
		content = (
			<>
				<WarehouseInfoCard warehouse={warehouse} summary={derived.summary} />
				<AssociatedProductsTable
					products={warehouse.products ?? []}
					allProducts={state.allProducts}
					branchId={state.branchId}
					onRemoveProduct={actions.setProductToRemove}
				/>
				{state.showAvailable && (
					<React.Suspense
						fallback={
							<div className='h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800' />
						}>
						<AvailableProductsTable
							products={derived.availableProducts}
							loading={state.productsLoading}
							branchId={state.branchId}
							onAttachProduct={actions.onSelectProductToAttach}
						/>
					</React.Suspense>
				)}
			</>
		);
	// Un error con la bodega ya cargada es de una mutación y ya se avisó con toast.
	else if (state.warehouseDetailError)
		content = (
			<Alert
				color='red'
				variant='outline'
				icon='HeroExclamationTriangle'
				title='No pudimos cargar la bodega'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span>{state.warehouseDetailError}</span>
					<Button size='sm' variant='outline' onClick={actions.refresh}>
						Reintentar
					</Button>
				</div>
			</Alert>
		);
	else
		content = (
			<div className='space-y-4' role='status'>
				<span className='sr-only'>Cargando bodega…</span>
				<div className='h-52 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800' />
				<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
					{Array.from({ length: 4 }, (_, index) => (
						<div
							key={index}
							className='h-[88px] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800'
						/>
					))}
				</div>
			</div>
		);

	return (
		<PageWrapper isProtectedRoute title={warehouse?.name ?? 'Bodega'}>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='DuoBarcode'
						title='Ficha de bodega'
						description='Datos, capacidad y productos asociados a la bodega'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='outline'
						icon='HeroArrowLeft'
						onClick={() => navigate('/inventario/bodegas')}>
						Volver a bodegas
					</Button>
					{warehouse && (
						<ProtectedButton
							permission='attach-warehouse-product'
							branchId={state.branchId}
							scope='access'
							variant={state.showAvailable ? 'outline' : 'solid'}
							color='blue'
							icon={state.showAvailable ? 'HeroXMark' : 'HeroPlus'}
							aria-expanded={state.showAvailable}
							onClick={() => actions.setShowAvailable((prev) => !prev)}>
							{state.showAvailable ? 'Ocultar disponibles' : 'Asociar productos'}
						</ProtectedButton>
					)}
				</SubheaderRight>
			</Subheader>

			<Container className='space-y-4'>{content}</Container>

			<React.Suspense fallback={null}>
				{warehouse && state.productToRemove && (
					<RemoveProductModal
						isOpen={!!state.productToRemove}
						product={state.productToRemove}
						onClose={() => actions.setProductToRemove(null)}
						onConfirm={actions.onConfirmRemove}
					/>
				)}

				{warehouse && state.attachProduct && (
					<AttachProductModal
						isOpen={!!state.attachProduct}
						product={state.attachProduct}
						allProducts={state.allProducts}
						associatedProducts={warehouse.products ?? []}
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
