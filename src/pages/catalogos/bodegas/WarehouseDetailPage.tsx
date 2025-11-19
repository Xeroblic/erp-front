import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts, fetchSubsidiaryProducts } from '@/store/slices/products/productsSlice';
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
import AvailableProductsCard from './detallesComponents/cards/AvailableProductsCard';
import RemoveProductModal from './detallesComponents/modals/RemoveProductModal';
import AttachProductModal from './detallesComponents/modals/AttachProductModal';
import WarehouseCapacityChart from './detallesComponents/charts/WarehouseCapacityChart';
import ProductBrandsChart from './detallesComponents/charts/ProductBrandsChart';

const WarehouseDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const user = useAppSelector((s) => s.auth.user);
	const personal = useAppSelector((s) => s.personalizacion);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const branchId =
		personal?.personalizacionUsuario?.sucursal_principal ||
		user?.branch?.id ||
		(user?.personalizacion?.sucursal_principal ?? 0);

	const { loadWarehouseDetail, handleAttachProducts, handleDetachProduct } =
		useWarehouseManagement(branchId);
	const warehouse = useAppSelector((s) => s.warehouse.warehouseDetail);
	const { items: allProducts, loading: productsLoading } = useAppSelector((s) => s.products);

	const [isEditable, setIsEditable] = useState(false);
	const [productToRemove, setProductToRemove] = useState<any | null>(null);
	const [showCharts, setShowCharts] = useState(false); // Estado para collapse de charts

	// attach modal state
	const [attachProduct, setAttachProduct] = useState<any | null>(null);
	const [attaching, setAttaching] = useState(false);

	useEffect(() => {
		if (branchId && id) {
			loadWarehouseDetail(Number(id));
		}
	}, [branchId, id, loadWarehouseDetail]);

	useEffect(() => {
		if (!id) return;

		if (subsidiaryId) {
			dispatch(fetchSubsidiaryProducts({ subsidiaryId, params: { per_page: 50 } }));
			return;
		}

		if (branchId) {
			dispatch(fetchProducts({ branchId, params: { per_page: 50 } }));
		}
	}, [dispatch, branchId, subsidiaryId, id]);

	// Filtrar productos disponibles: solo los que NO están asociados a la bodega
	const availableProducts = useMemo(() => {
		if (!warehouse?.products) return [];

		const associatedProductIds = new Set(warehouse.products.map((wp) => wp.id));

		const targetBranchId = warehouse?.branch_id ?? branchId ?? null;

		return allProducts.filter((product) => {
			const matchesBranch = targetBranchId ? product.branch_id === targetBranchId : true;
			return matchesBranch && !associatedProductIds.has(product.id);
		});
	}, [allProducts, warehouse?.products, branchId, warehouse?.branch_id]);

	// Helper: verificar si un producto ya está asociado
	const isProductAssociated = (productId: number): boolean => {
		return warehouse?.products?.some((p) => p.id === productId) ?? false;
	};

	const searchTimerRef = useRef<number | null>(null);
	const handleProductSearch = (val: string) => {
		if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
		searchTimerRef.current = window.setTimeout(() => {
			if (subsidiaryId) {
				dispatch(
					fetchSubsidiaryProducts({
						subsidiaryId,
						params: { per_page: 50, search: val },
					}),
				);
			} else if (branchId) {
				dispatch(fetchProducts({ branchId, params: { per_page: 50, search: val } }));
			}
		}, 300) as unknown as number;
	};

	const handleAttachProduct = (product: any) => {
		// Validación preventiva: verificar que el producto NO esté ya asociado
		if (isProductAssociated(product.id)) {
			// Este caso NO debería ocurrir si el filtro funciona bien,
			// pero es una capa extra de seguridad
			console.warn(`[UX Safety] Producto ${product.id} ya está asociado a la bodega`);
			return;
		}

		setAttachProduct(product);
	};

	const confirmAttach = async (productId: number, sync: boolean, quantity: number) => {
		if (!warehouse) return;

		// Validación final antes de enviar al backend
		if (isProductAssociated(productId)) {
			console.warn(`[Backend Safety] Evitando POST duplicado para producto ${productId}`);
			setAttachProduct(null);
			return;
		}

		setAttaching(true);
		try {
			const payload = {
				product_id: productId,
				quantity: sync ? null : quantity,
				sync_stock: sync,
			} as any;
			const success = await handleAttachProducts(warehouse.id, payload);
			if (success) {
				await loadWarehouseDetail(warehouse.id);
				setAttachProduct(null);
			}
		} finally {
			setAttaching(false);
		}
	};

	const confirmRemoveProduct = async (productId: number) => {
		if (!warehouse) return;

		const success = await handleDetachProduct(warehouse.id, {
			product_id: productId,
		} as any);

		if (success) {
			setProductToRemove(null);
		}
	};

	if (!warehouse)
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

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<Button
						onClick={() => navigate('/catalogos/bodegas')}
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
						onClick={() => setIsEditable(!isEditable)}
						icon={isEditable ? 'HeroLockClosed' : 'HeroPencil'}>
						{isEditable ? 'Bloquear Edición' : 'Habilitar Edición'}
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-4'>
					<WarehouseInfoCard warehouse={warehouse} />

					{/* Gráficos de análisis - Colapsable */}
					<div className='rounded-lg border border-zinc-200 dark:border-zinc-800'>
						<button
							onClick={() => setShowCharts(!showCharts)}
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
							</div>
						</Collapse>
					</div>

					<AssociatedProductsCard
						products={warehouse.products || []}
						allProducts={allProducts}
						branchId={branchId}
						onRemoveProduct={setProductToRemove}
					/>

					{isEditable && (
						<AvailableProductsCard
							products={availableProducts}
							loading={productsLoading}
							onAttachProduct={handleAttachProduct}
						/>
					)}
				</div>
			</Container>

			<RemoveProductModal
				isOpen={!!productToRemove}
				product={productToRemove}
				onClose={() => setProductToRemove(null)}
				onConfirm={confirmRemoveProduct}
			/>

			<AttachProductModal
				isOpen={!!attachProduct}
				product={attachProduct}
				allProducts={allProducts}
				associatedProducts={warehouse?.products || []}
				onClose={() => setAttachProduct(null)}
				onConfirm={confirmAttach}
				isLoading={attaching}
			/>
		</PageWrapper>
	);
};

export default WarehouseDetailPage;
