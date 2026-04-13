import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Collapse from '@/components/utils/Collapse';
import { useWarehouseManagement } from './hooks/useWarehouseManagement';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import WarehouseInfoCard from './detallesComponents/cards/WarehouseInfoCard';
import AssociatedProductsCard from './detallesComponents/cards/AssociatedProductsCard';

// Tipos definidos localmente para eliminar ANY
export interface IMinimalProduct {
	id: number;
	branch_id?: number | null;
	[key: string]: unknown;
}

// Componentes Lazy
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

const WarehouseDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const user = useAppSelector((s) => s.auth.user);
	const personal = useAppSelector((s) => s.personalizacion);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const branchId = useMemo(
		() =>
			personal?.personalizacionUsuario?.sucursal_principal ??
			user?.branch?.id ??
			user?.personalizacion?.sucursal_principal ??
			0,
		[personal, user],
	);

	const { loadWarehouseDetail, handleAttachProducts, handleDetachProduct } =
		useWarehouseManagement(branchId);

	const warehouse = useAppSelector((s) => s.warehouse.warehouseDetail);
	const { items: allProducts, loading: productsLoading } = useAppSelector((s) => s.products);

	// Estados UI puramente locales
	const [isEditable, setIsEditable] = useState<boolean>(false);
	const [productToRemove, setProductToRemove] = useState<IMinimalProduct | null>(null);
	const [attachProduct, setAttachProduct] = useState<IMinimalProduct | null>(null);
	const [showCharts, setShowCharts] = useState<boolean>(false);
	const [isAttaching, setIsAttaching] = useState<boolean>(false);

	// Carga inicial del detalle
	useEffect(() => {
		if (branchId && id) {
			loadWarehouseDetail(Number(id));
		}
	}, [branchId, id, loadWarehouseDetail]);

	// Carga inicial de productos basados en el contexto de la sucursal (bodega)
	useEffect(() => {
		if (!id) return;
		if (branchId) {
			dispatch(fetchProductsList({ entityParam: 'branches', entityId: branchId, params: { per_page: 50 } }));
		}
	}, [dispatch, branchId, id]);

	// Reglas de negocio puras derivadas (Memoizadas para evitar recalculos)
	const associatedProductIds = useMemo(() => {
		return new Set(warehouse?.products?.map((wp) => wp.id) ?? []);
	}, [warehouse?.products]);

	const availableProducts = useMemo(() => {
		if (!warehouse?.products) return [];
		const targetBranchId = warehouse?.branch_id ?? branchId ?? null;

		return allProducts.filter((product: any) => {
			const matchesBranch = targetBranchId ? product.branch_id === targetBranchId : true;
			return matchesBranch && !associatedProductIds.has(product.id);
		});
	}, [allProducts, warehouse?.products, branchId, warehouse?.branch_id, associatedProductIds]);

	const isProductAssociated = useCallback(
		(productId: number): boolean => {
			return associatedProductIds.has(productId);
		},
		[associatedProductIds],
	);

	// Manejadores de Interfaz
	const onSelectProductToAttach = useCallback(
		(product: IMinimalProduct) => {
			if (isProductAssociated(product.id)) {
				console.warn(`[UX Safety] Producto ${product.id} ya está asociado a la bodega`);
				return;
			}
			setAttachProduct(product);
		},
		[isProductAssociated],
	);

	const onConfirmAttach = useCallback(
		async (productId: number, sync: boolean, quantity: number) => {
			if (!warehouse) return;
			if (isProductAssociated(productId)) {
				console.warn(`[Backend Safety] Evitando POST duplicado para producto ${productId}`);
				setAttachProduct(null);
				return;
			}

			setIsAttaching(true);
			try {
				const success = await handleAttachProducts(warehouse.id, {
					product_id: productId,
					quantity: sync ? undefined : quantity,
					sync_stock: sync,
				});
				if (success) {
					await loadWarehouseDetail(warehouse.id);
					setAttachProduct(null);
				}
			} finally {
				setIsAttaching(false);
			}
		},
		[warehouse, isProductAssociated, handleAttachProducts, loadWarehouseDetail],
	);

	const onConfirmRemove = useCallback(
		async (productId: number) => {
			if (!warehouse) return;
			// Usar any tipado para evitar el error estricto de axios sin interfaces complejas
			const success = await handleDetachProduct(warehouse.id, {
				product_id: productId,
			} as any);
			if (success) {
				setProductToRemove(null);
			}
		},
		[warehouse, handleDetachProduct],
	);

	// Render de estado vacío / error
	if (!warehouse) {
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
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<Button
						onClick={() => navigate('/inventario/bodegas')}
						variant='outline'
						icon='HeroArrowLeft'>
						Volver
					</Button>
					<span className='ml-2 text-lg font-semibold'>{warehouse.name}</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='solid'
						color={isEditable ? 'amber' : 'blue'}
						onClick={() => setIsEditable((prev) => !prev)}
						icon={isEditable ? 'HeroLockClosed' : 'HeroPencil'}>
						{isEditable ? 'Bloquear Edición' : 'Habilitar Edición'}
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-4'>
					{/* Tarjeta de Información Principal */}
					<WarehouseInfoCard warehouse={warehouse} />

					{/* Gráficos de Análisis Carga Diferida */}
					<div className='rounded-lg border border-zinc-200 dark:border-zinc-800'>
						<button
							onClick={() => setShowCharts((prev) => !prev)}
							className='flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroChartBarSquare' className='size-5 text-blue-500' />
								<h3 className='text-lg font-semibold'>Análisis y Estadísticas</h3>
								<span className='text-sm text-zinc-500'>
									({warehouse.products?.length || 0} productos)
								</span>
							</div>
							<Icon
								icon={showCharts ? 'HeroChevronUp' : 'HeroChevronDown'}
								className='size-5 text-zinc-400'
							/>
						</button>

						<Collapse isOpen={showCharts}>
							<div className='border-t border-zinc-200 p-4 dark:border-zinc-800'>
								<React.Suspense
									fallback={
										<div className='h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800' />
									}>
									<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
										<WarehouseCapacityChart
											currentCapacity={warehouse.current_capacity ?? 0}
											maximumCapacity={warehouse.maximum_capacity ?? 0}
										/>
										<ProductBrandsChart
											products={warehouse.products || []}
											allProducts={allProducts}
										/>
									</div>
								</React.Suspense>
							</div>
						</Collapse>
					</div>

					{/* Catálogo de Productos Asociados */}
					<AssociatedProductsCard
						products={warehouse.products || []}
						allProducts={allProducts}
						branchId={branchId}
						onRemoveProduct={setProductToRemove as any}
					/>

					{/* Panel de Edición de Stock (Lazy) */}
					{isEditable && (
						<React.Suspense
							fallback={
								<div className='h-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800' />
							}>
							<AvailableProductsCard
								products={availableProducts}
								loading={productsLoading}
								onAttachProduct={onSelectProductToAttach as any}
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
				{productToRemove && (
					<RemoveProductModal
						isOpen={!!productToRemove}
						product={productToRemove as any}
						onClose={() => setProductToRemove(null)}
						onConfirm={onConfirmRemove}
					/>
				)}

				{attachProduct && (
					<AttachProductModal
						isOpen={!!attachProduct}
						product={attachProduct as any}
						allProducts={allProducts}
						associatedProducts={warehouse?.products || []}
						onClose={() => setAttachProduct(null)}
						onConfirm={onConfirmAttach}
						isLoading={isAttaching}
					/>
				)}
			</React.Suspense>
		</PageWrapper>
	);
};

export default WarehouseDetailPage;
